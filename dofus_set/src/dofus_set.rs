use std::ops::Index;

use crate::{anneal, config, config::Config};

use dofus_characteristics::{stat_is_element, Characteristic, Stat, STAT_ELEMENT};
use dofus_items::{Item, ItemIndex, ItemType, Items, NicheItemIndex, SetIndex};
use rand::{prelude::Rng, seq::SliceRandom};
use serde::Serialize;

pub fn slot_index_to_item_type(index: usize) -> ItemType {
    match index {
        0 => ItemType::Hat,
        1 => ItemType::Cloak,
        2 => ItemType::Amulet,
        3..=4 => ItemType::Ring,
        5 => ItemType::Belt,
        6 => ItemType::Boot,
        7 => ItemType::Weapon,
        8 => ItemType::Shield,
        9..=14 => ItemType::Dofus,
        15 => ItemType::Mount,
        _ => panic!("Index out of range"),
    }
}

const MAX_AP: i32 = 12;
const MAX_MP: i32 = 6;
const MAX_RANGE: i32 = 6;

#[derive(Clone, Debug)]
pub struct State {
    set: [NicheItemIndex; 16],
    characteristic_points: [i32; 6],
    cached_totals: Characteristic,
}

impl State {
    fn new_from_initial_equipment(
        equipment: [Option<ItemIndex>; 16],
        items: &Items,
    ) -> Result<State, OptimiseError> {
        let mut set = [None; 16];
        for (index, equipment) in equipment.iter().enumerate() {
            if let Some(equipment) = equipment {
                if !items[slot_index_to_item_type(index)].contains(equipment) {
                    return Err(OptimiseError::InvalidItem {
                        item: items[*equipment].name.to_owned(),
                        attempted_slot: slot_index_to_item_type(index),
                    });
                }
                set[index] = Some(*equipment);
            }
        }

        let niche_optimised = set.map(NicheItemIndex::new);

        let state = State {
            set: niche_optimised,
            characteristic_points: [0; 6],
            cached_totals: Characteristic::new(),
        };
        let totals = state.item_stat_from_nothing(items);
        Ok(State {
            set: niche_optimised,
            characteristic_points: [0; 6],
            cached_totals: totals,
        })
    }
}

pub struct SetBonus<'a> {
    pub name: &'a str,
    pub bonus: &'a Characteristic,
    pub number_of_items: i32,
}
type SetBonusList<'a> = heapless::Vec<SetBonus<'a>, MAX_SETS>;

const MAX_SETS: usize = 12;

impl State {
    pub fn set(&'_ self) -> impl std::iter::Iterator<Item = Option<ItemIndex>> + '_ {
        self.set.iter().map(|x| x.get())
    }

    pub fn sets<'a>(&self, items: &'a Items) -> SetBonusList<'a> {
        let mut sets_linear_map: heapless::Vec<(SetIndex, i32), MAX_SETS> = heapless::Vec::new();

        for item in self.items(items) {
            if let Some(set_id) = item.set_id {
                if let Some((_, count)) = sets_linear_map
                    .iter_mut()
                    .find(|(set_index, _)| *set_index == set_id)
                {
                    *count += 1;
                } else {
                    sets_linear_map
                        .push((set_id, 1))
                        .expect("Too many different sets");
                }
            }
        }

        sets_linear_map
            .into_iter()
            .filter_map(move |(set, number_of_items)| {
                let set = &items[set];

                set.get(number_of_items as usize).map(|bonus| SetBonus {
                    name: set.name,
                    bonus,
                    number_of_items,
                })
            })
            .collect()
    }

    pub fn is_valid(
        &self,
        config: &Config,
        stats: &Characteristic,
        items: &Items,
        sets: &SetBonusList,
    ) -> bool {
        self.restriction_energy(config, stats, items, sets) == 0.
    }

    /// Violating restrictions reduces the energy of the system such that not violating would be better
    fn restriction_energy(
        &self,
        config: &Config,
        stats: &Characteristic,
        items: &Items,
        sets: &SetBonusList,
    ) -> f64 {
        let mut violation_energy = 0.;

        let total_set_bonuses = sets.iter().map(|x| x.number_of_items - 1).sum();

        for item in self.items(items) {
            if item.level > config.max_level {
                let difference = item.level - config.max_level;
                violation_energy += difference as f64 * 1000.;
            }

            violation_energy += item.restriction.accepts(stats, total_set_bonuses) as f64 * 100.;
        }

        let dofus = &self.set[9..=14];
        for (i, singular_dofus) in dofus.iter().enumerate() {
            if i == dofus.len() || singular_dofus.get().is_none() {
                continue;
            }
            if dofus[i + 1..].contains(singular_dofus) {
                violation_energy += 1_000.;
            }
        }

        // forbid two rings from the same set
        let rings = &self.set[3..=4];
        if let (Some(ring0), Some(ring1)) = (rings[0].get(), rings[1].get()) {
            let ring0_set = items[ring0].set_id;
            let ring1_set = items[ring1].set_id;
            if let (Some(ring0_set), Some(ring1_set)) = (ring0_set, ring1_set) {
                if ring0_set == ring1_set {
                    violation_energy += 1_000.;
                }
            }
        }

        let total_used_points: i32 = self.characteristic_points.iter().copied().sum();
        let total_points = config.characteristics_point();

        let over_usage = (total_used_points - total_points).max(0);

        violation_energy += (over_usage * 100) as f64;

        violation_energy
    }

    pub fn energy(&self, config: &config::Config, items: &Items, sets: &SetBonusList) -> f64 {
        let stats = self.stats(config, sets);
        // need to take the negative due to being a minimiser
        let energy_non_element = stats
            .iter()
            .zip(config.weights.iter())
            .zip(config.targets.iter())
            .enumerate()
            .filter(|(x, _)| !stat_is_element(*x))
            .map(|(_, x)| x)
            .map(|((&stat, &weight), &target)| {
                let stat = target.map_or_else(|| stat, |target| std::cmp::min(target, stat));
                stat as f64 * weight
            })
            .sum::<f64>();

        let difference_energy = config
            .initial_set
            .iter()
            .zip(self.set.iter())
            .filter(|(a, b)| a != b)
            .count() as f64
            * config.changed_item_weight;

        let damage_energy = config
            .damaging_moves
            .iter()
            .map(|x| {
                let critical = if x.damage.modifyable_crit {
                    (x.damage.base_crit_ratio + stats[Stat::Critical]).clamp(0, 100) as f64
                } else {
                    x.damage.base_crit_ratio as f64
                };
                let ratio = critical / 100.;
                let damage_stats = [
                    (Stat::Strength, Stat::DamageNeutral),
                    (Stat::Agility, Stat::DamageAir),
                    (Stat::Chance, Stat::DamageWater),
                    (Stat::Strength, Stat::DamageEarth),
                    (Stat::Intelligence, Stat::DamageFire),
                ];

                let critical_damage = stats[Stat::DamageCritical];
                let power = stats[Stat::Power];
                let damage = stats[Stat::Damage];
                x.damage
                    .elemental_damage
                    .into_iter()
                    .zip(x.damage.crit_elemental_damage)
                    .zip(damage_stats)
                    .map(|((b, c), (stat_power, stat_damage))| {
                        let stat_power = stats[stat_power];
                        let average_base_damage = b * (1. - ratio) + c * ratio;

                        if average_base_damage != 0. {
                            average_base_damage * (1. + ((stat_power + power) as f64) / 100.)
                                + (damage + stats[stat_damage]) as f64
                                + ratio * critical_damage as f64
                        } else {
                            0.
                        }
                    })
                    .sum::<f64>()
                    * x.weight
            })
            .sum::<f64>();

        let element_iter = STAT_ELEMENT
            .iter()
            .map(|&x| {
                (
                    stats[x],
                    config.weights[x as usize],
                    config.targets[x as usize],
                )
            })
            .filter(|(_, weight, _)| *weight > 0.)
            .map(|(stat, weight, target)| {
                let stat = target.map_or_else(|| stat, |target| std::cmp::min(target, stat));
                stat as f64 * weight
            });
        let energy_element = if config.multi_element {
            let e = element_iter.fold(f64::NAN, f64::min);
            if e.is_nan() {
                0.
            } else {
                e
            }
        } else {
            element_iter.sum()
        };

        -energy_non_element - energy_element - difference_energy - damage_energy
            + self.restriction_energy(config, &stats, items, sets)
    }

    fn items<'a>(
        &'a self,
        items: &'a Items,
    ) -> impl std::iter::Iterator<Item = &'a Item> + use<'a> {
        self.set
            .iter()
            .filter_map(move |item_id| item_id.get().map(|item_id| &items[item_id]))
    }

    fn item_stat_from_nothing(&self, items: &Items) -> Characteristic {
        let mut stat = Characteristic::new();

        for item in self.items(items) {
            stat += &item.stats;
        }

        stat
    }

    fn remove_item(&mut self, item: &Item) {
        self.cached_totals -= &item.stats;
    }

    fn add_item(&mut self, item: &Item) {
        self.cached_totals += &item.stats;
    }

    pub fn stats(
        &self,
        config: &config::Config,
        sets: &heapless::Vec<SetBonus<'_>, MAX_SETS>,
    ) -> Characteristic {
        let mut stat = self.cached_totals.clone();

        for set_bonus in sets {
            stat += set_bonus.bonus;
        }

        stat[Stat::Vitality] += self.characteristic_points[0];
        stat[Stat::Wisdom] += self.characteristic_points[1] / 3;

        stat[Stat::Agility] += calculate_points_for_stat(self.characteristic_points[2]);
        stat[Stat::Chance] += calculate_points_for_stat(self.characteristic_points[3]);
        stat[Stat::Strength] += calculate_points_for_stat(self.characteristic_points[4]);
        stat[Stat::Intelligence] += calculate_points_for_stat(self.characteristic_points[5]);

        stat[Stat::AP] = std::cmp::min(
            stat[Stat::AP] + level_initial_ap(config.max_level) + config.exo_ap as i32,
            MAX_AP,
        );
        stat[Stat::MP] = std::cmp::min(stat[Stat::MP] + 3 + config.exo_mp as i32, MAX_MP);
        stat[Stat::Range] = std::cmp::min(stat[Stat::Range] + config.exo_range as i32, MAX_RANGE);

        stat[Stat::ResistanceNeutralPercent] =
            std::cmp::min(stat[Stat::ResistanceNeutralPercent], 50);
        stat[Stat::ResistanceEarthPercent] = std::cmp::min(stat[Stat::ResistanceEarthPercent], 50);
        stat[Stat::ResistanceFirePercent] = std::cmp::min(stat[Stat::ResistanceFirePercent], 50);
        stat[Stat::ResistanceWaterPercent] = std::cmp::min(stat[Stat::ResistanceWaterPercent], 50);
        stat[Stat::ResistanceAirPercent] = std::cmp::min(stat[Stat::ResistanceAirPercent], 50);

        stat
    }
}

fn calculate_points_for_stat(points_in: i32) -> i32 {
    points_in.min(100)
        + (points_in - 100).clamp(0, 200) / 2
        + (points_in - 300).clamp(0, 300) / 3
        + (points_in - 600).max(0) / 4
}

fn level_initial_ap(level: i32) -> i32 {
    if level >= 100 {
        7
    } else {
        6
    }
}

pub struct Optimiser<'a> {
    config: &'a config::Config,
    items: &'a Items,
    initial_state: State,
    item_list: AllowedItemCache,
    temperature_initial: f64,
    temperature_time_constant: f64,
    temperature_quench: f64,
}

struct AllowedItemCache {
    items: [Vec<ItemIndex>; 10],
}

impl Index<ItemType> for AllowedItemCache {
    type Output = [ItemIndex];

    fn index(&self, index: ItemType) -> &Self::Output {
        &self.items[index as usize]
    }
}

impl<'a> Optimiser<'a> {
    pub fn new(
        config: &'a config::Config,
        initial_temperature: f64,
        items: &'a Items,
    ) -> Result<Optimiser<'a>, OptimiseError> {
        let initial_state: State =
            State::new_from_initial_equipment(config.initial_set.map(NicheItemIndex::get), items)?;

        let mut item_list: [Vec<ItemIndex>; 10] = Default::default();

        for (idx, item_list) in item_list.iter_mut().enumerate() {
            *item_list = items[ItemType::from(idx)]
                .iter()
                .filter(|&x| items[*x].level <= config.max_level)
                .filter(|&x| !config.ban_list.contains(x))
                .copied()
                .collect();
        }

        let temperature_initial = initial_temperature;
        let temperature_quench = 5.;
        let temperature_time_constant =
            (0.01f64 / temperature_initial).ln() / 0.95_f64.powf(temperature_quench);
        Ok(Optimiser {
            config,
            initial_state,
            item_list: AllowedItemCache { items: item_list },
            temperature_initial,
            temperature_time_constant,
            temperature_quench,
            items,
        })
    }

    pub fn optimise(self, iterations: i64) -> Result<State, OptimiseError> {
        if !self
            .config
            .changable
            .iter()
            .any(|&x| !self.item_list[slot_index_to_item_type(x)].is_empty())
        {
            return Ok(self.initial_state);
        }

        let sets = self.initial_state.sets(self.items);
        let energy = self.initial_state.energy(self.config, self.items, &sets);

        anneal::Anneal::optimise(&self, (self.initial_state.clone(), energy), iterations)
    }
}

#[derive(Debug, thiserror::Error, Serialize)]
pub enum OptimiseError {
    #[error("could not find neighbour after {0} attempts")]
    ExceededMaxAttempts(usize),
    #[error("item {item} could not fit in slot {attempted_slot:?}")]
    InvalidItem {
        item: String,
        attempted_slot: ItemType,
    },
    #[error("the given state is not valid even with leniency")]
    InvalidState,
}

impl anneal::Anneal<State> for Optimiser<'_> {
    type Error = OptimiseError;

    fn random(&self) -> f64 {
        rand::thread_rng().gen_range(0.0..1.0)
    }

    fn neighbour(&self, state: &State) -> Result<(State, f64), OptimiseError> {
        let mut rng = rand::thread_rng();

        let mut new_state = state.clone();
        let (item_slot, item) = loop {
            let item_slot = *self.config.changable.choose(&mut rng).unwrap();
            let item_type = &self.item_list[slot_index_to_item_type(item_slot)];
            if item_type.is_empty() {
                continue;
            }
            let idx = rng.gen_range(0..item_type.len() + 1);
            if idx != item_type.len() {
                let item_index = item_type[idx];
                break (item_slot, Some(item_index));
            } else {
                break (item_slot, None);
            }
        };

        if let Some(old_item) = new_state.set[item_slot].get() {
            new_state.remove_item(&self.items[old_item]);
        }
        if let Some(item) = item {
            new_state.add_item(&self.items[item]);
        }

        new_state.set[item_slot] = NicheItemIndex::new(item);
        let sets = new_state.sets(self.items);

        let energy = new_state.energy(self.config, self.items, &sets);
        Ok((new_state, energy))
    }

    fn temperature(&self, iteration: f64) -> f64 {
        self.temperature_initial
            * std::f64::consts::E
                .powf(self.temperature_time_constant * iteration.powf(self.temperature_quench))
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn check_characteristic_calculation() {
        assert_eq!(calculate_points_for_stat(50), 50);
        assert_eq!(calculate_points_for_stat(100), 100);

        assert_eq!(calculate_points_for_stat(150), 125);
        assert_eq!(calculate_points_for_stat(688), 322);
        assert_eq!(calculate_points_for_stat(1000), 400);
    }
}
