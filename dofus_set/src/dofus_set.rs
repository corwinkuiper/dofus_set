use std::ops::Index;

use crate::anneal;
use crate::config;
use crate::items;
use crate::items::Item;
use crate::items::ItemIndex;
use crate::items::ItemType;
use crate::items::Items;
use crate::items::SetIndex;
use crate::stats;
use crate::stats::Characteristic;

use rand::prelude::Rng;
use rand::seq::SliceRandom;
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
    set: [Option<ItemIndex>; 16],
    cached_totals: stats::Characteristic,
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
                        item: items[*equipment].name.clone(),
                        attempted_slot: slot_index_to_item_type(index),
                    });
                }
                set[index] = Some(*equipment);
            }
        }

        let state = State {
            set,
            cached_totals: Characteristic::new(),
        };
        let totals = state.item_stat_from_nothing(items);
        Ok(State {
            set,
            cached_totals: totals,
        })
    }
}

pub struct SetBonus<'a> {
    pub name: &'a str,
    pub bonus: &'a Characteristic,
    pub number_of_items: i32,
}

const MAX_SETS: usize = 12;

impl State {
    pub fn set(&'_ self) -> impl std::iter::Iterator<Item = Option<ItemIndex>> + '_ {
        self.set.iter().copied()
    }

    pub fn sets<'a>(&self, items: &'a Items) -> heapless::Vec<SetBonus<'a>, MAX_SETS> {
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

                set.bonuses[number_of_items as usize]
                    .as_ref()
                    .map(|bonus| SetBonus {
                        name: &set.name,
                        bonus,
                        number_of_items,
                    })
            })
            .collect()
    }

    fn valid(&self, config: &config::Config, items: &Items, leniency: i32) -> bool {
        let mut total_set_bonuses = 0;
        let sets = self.sets(items);

        for set_bonus in &sets {
            total_set_bonuses += set_bonus.number_of_items - 1;
        }

        let stats = self.stats(config, &sets);

        for item in self.items(items) {
            if item.level > config.max_level {
                return false;
            }

            if !item
                .restriction
                .accepts(&stats, total_set_bonuses, leniency)
            {
                return false;
            }
        }

        let dofus = &self.set[9..=14];
        for (i, singular_dofus) in dofus.iter().enumerate() {
            if i == dofus.len() || singular_dofus.is_none() {
                continue;
            }

            if dofus[i + 1..].contains(singular_dofus) {
                return false;
            }
        }

        // forbid two rings from the same set
        let rings = &self.set[3..=4];
        if rings[0].is_some() && rings[1].is_some() {
            let ring0_set = items[rings[0].unwrap()].set_id;
            let ring1_set = items[rings[1].unwrap()].set_id;
            if let (Some(ring0_set), Some(ring1_set)) = (ring0_set, ring1_set) {
                if ring0_set == ring1_set {
                    return false;
                }
            }
        }

        true
    }

    pub fn energy(
        &self,
        config: &config::Config,
        sets: &heapless::Vec<SetBonus<'_>, MAX_SETS>,
    ) -> f64 {
        let stats = self.stats(config, sets);
        // need to take the negative due to being a minimiser
        let energy_non_element = stats
            .iter()
            .zip(config.weights.iter())
            .zip(config.targets.iter())
            .enumerate()
            .filter(|(x, _)| !stats::stat_is_element(*x))
            .map(|(_, x)| x)
            .map(|((&stat, &weight), &target)| {
                let stat = target.map_or_else(|| stat, |target| std::cmp::min(target, stat));
                stat as f64 * weight
            })
            .sum::<f64>();

        let element_iter = stats::STAT_ELEMENT
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

        -energy_non_element - energy_element
    }

    fn items<'a>(&'a self, items: &'a Items) -> impl std::iter::Iterator<Item = &items::Item> + 'a {
        self.set
            .iter()
            .filter_map(move |item_id| item_id.map(|item_id| &items[item_id]))
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

        stat[stats::Stat::AP] = std::cmp::min(
            stat[stats::Stat::AP] + level_initial_ap(config.max_level) + config.exo_ap as i32,
            MAX_AP,
        );
        stat[stats::Stat::MP] =
            std::cmp::min(stat[stats::Stat::MP] + 3 + config.exo_mp as i32, MAX_MP);
        stat[stats::Stat::Range] = std::cmp::min(
            stat[stats::Stat::Range] + config.exo_range as i32,
            MAX_RANGE,
        );

        stat[stats::Stat::ResistanceNeutralPercent] =
            std::cmp::min(stat[stats::Stat::ResistanceNeutralPercent], 50);
        stat[stats::Stat::ResistanceEarthPercent] =
            std::cmp::min(stat[stats::Stat::ResistanceEarthPercent], 50);
        stat[stats::Stat::ResistanceFirePercent] =
            std::cmp::min(stat[stats::Stat::ResistanceFirePercent], 50);
        stat[stats::Stat::ResistanceWaterPercent] =
            std::cmp::min(stat[stats::Stat::ResistanceWaterPercent], 50);
        stat[stats::Stat::ResistanceAirPercent] =
            std::cmp::min(stat[stats::Stat::ResistanceAirPercent], 50);

        stat
    }
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
    items: &'a items::Items,
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
        initial_set: [Option<ItemIndex>; 16],
        items: &'a Items,
    ) -> Result<Optimiser<'a>, OptimiseError> {
        let initial_state: State = State::new_from_initial_equipment(initial_set, items)?;
        if !initial_state.valid(config, items, 1000) {
            return Err(OptimiseError::InvalidState);
        }

        let mut item_list: [Vec<ItemIndex>; 10] = Default::default();

        for (idx, item_list) in item_list.iter_mut().enumerate() {
            *item_list = items[ItemType::from(idx)]
                .iter()
                .filter(|&x| items[*x].level <= config.max_level)
                .filter(|&x| !config.ban_list.contains(x))
                .copied()
                .collect();
        }

        let temperature_initial = 1000.;
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

    pub fn optimise(self) -> Result<State, OptimiseError> {
        if !self
            .config
            .changable
            .iter()
            .any(|&x| !self.item_list[slot_index_to_item_type(x)].is_empty())
        {
            return Ok(self.initial_state);
        }
        anneal::Anneal::optimise(&self, self.initial_state.clone(), 1_000_000)
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

impl<'a> anneal::Anneal<State> for Optimiser<'a> {
    type Error = OptimiseError;

    fn random(&self) -> f64 {
        rand::thread_rng().gen_range(0.0..1.0)
    }

    fn neighbour(&self, state: &State, temperature: f64) -> Result<State, OptimiseError> {
        let mut attempts = 0;
        let mut rng = rand::thread_rng();
        loop {
            let mut new_state = state.clone();
            let (item_slot, item) = loop {
                let item_slot = *self.config.changable.choose(&mut rng).unwrap();
                let item_type = &self.item_list[slot_index_to_item_type(item_slot)];
                if item_type.is_empty() {
                    continue;
                }
                let item_index = item_type[rng.gen_range(0..item_type.len())];
                break (item_slot, item_index);
            };

            if let Some(old_item) = new_state.set[item_slot] {
                new_state.remove_item(&self.items[old_item]);
            }
            new_state.add_item(&self.items[item]);

            new_state.set[item_slot] = Some(item);
            if new_state.valid(self.config, self.items, temperature as i32) {
                return Ok(new_state);
            }
            attempts += 1;
            if attempts > 1000 {
                return Err(OptimiseError::ExceededMaxAttempts(1000));
            }
        }
    }

    fn energy(&self, state: &State) -> f64 {
        let sets = state.sets(self.items);
        state.energy(self.config, &sets)
    }

    fn temperature(&self, iteration: f64, _energy: f64) -> f64 {
        self.temperature_initial
            * std::f64::consts::E
                .powf(self.temperature_time_constant * iteration.powf(self.temperature_quench))
    }
}
