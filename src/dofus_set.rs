use crate::anneal;
use crate::config;
use crate::items;
use crate::stats;

use rand::prelude::Rng;
use rand::seq::SliceRandom;
use std::collections::HashMap;

pub fn state_index_to_item<'a>(index: usize) -> &'a [usize] {
    match index {
        0 => &items::HATS,
        1 => &items::CLOAKS,
        2 => &items::AMULETS,
        3..=4 => &items::RINGS,
        5 => &items::BELTS,
        6 => &items::BOOTS,
        7 => &items::WEAPONS,
        8 => &items::SHIELDS,
        9..=14 => &items::DOFUS,
        15 => &items::MOUNTS,
        _ => panic!("Index out of range"),
    }
}

const MAX_ADDITIONAL_MP: i32 = 3;
const MAX_ADDITIONAL_RANGE: i32 = 6;

#[derive(Clone, Debug, Default)]
pub struct State {
    set: [Option<usize>; 16],
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn new_state_invalid_id() {
        let mut set = [None; 16];
        set[0] = Some(21474836);

        assert_eq!(
            State::new_from_initial_equipment(set).unwrap_err(),
            "Dofus ID does not exist"
        );
    }

    #[test]
    fn new_state_wrong_slot() {
        let mut set = [None; 16];
        set[0] = Some(8231); // red piwi cape in hat slot

        assert_eq!(
            State::new_from_initial_equipment(set).unwrap_err(),
            "Equipment in wrong slot"
        );
    }
}

impl State {
    fn new_from_initial_equipment(equipment: [Option<i32>; 16]) -> Result<State, &'static str> {
        let mut set = [None; 16];
        for (index, equipment) in equipment.iter().enumerate() {
            if let Some(equipment) = equipment {
                if let Some(item_index) = items::dofus_id_to_index(*equipment) {
                    if state_index_to_item(index).contains(&item_index) {
                        set[index] = Some(item_index);
                    } else {
                        return Err("Equipment in wrong slot");
                    }
                } else {
                    return Err("Dofus ID does not exist");
                }
            }
        }
        Ok(State { set })
    }
}

pub struct SetBonus {
    pub name: String,
    pub bonus: stats::Characteristic,
    pub number_of_items: i32,
}

impl State {
    pub fn set(&self) -> impl std::iter::Iterator<Item = &items::Item> {
        self.set
            .iter()
            .filter_map(|item_id| item_id.map(|item_id| &items::ITEMS[item_id]))
    }

    pub fn sets(&self) -> impl std::iter::Iterator<Item = SetBonus> {
        let mut sets = HashMap::<i32, i32>::new(); // map of set ids to number of items in that set

        for item in self.items() {
            if let Some(set_id) = item.set_id {
                sets.entry(set_id).and_modify(|i| *i += 1).or_insert(1);
            }
        }

        sets.into_iter().filter_map(|(set, number_of_items)| {
            let set = &items::SETS[&set];

            set.bonuses.get(&number_of_items).map(|bonus| SetBonus {
                name: set.name.clone(),
                bonus: *bonus,
                number_of_items,
            })
        })
    }

    fn valid(&self, config: &config::Config) -> bool {
        let mut total_set_bonuses = 0;
        for set_bonus in self.sets() {
            total_set_bonuses += set_bonus.number_of_items - 1;
        }

        let stats = self.stats(config.max_level);

        for item in self.items() {
            if item.level > config.max_level {
                return false;
            }

            if !item.restriction.accepts(&stats, total_set_bonuses) {
                return false;
            }
        }

        let dofus = &self.set[9..=14];
        let mut unique = std::collections::BTreeSet::new();
        if !dofus
            .iter()
            .filter_map(|x| x.as_ref())
            .all(move |x| unique.insert(x))
        {
            return false;
        }

        // forbid two rings from the same set
        let rings = &self.set[3..=4];
        if rings[0].is_some() && rings[1].is_some() {
            let ring0_set = items::ITEMS[rings[0].unwrap()].set_id;
            let ring1_set = items::ITEMS[rings[1].unwrap()].set_id;
            if let (Some(ring0_set), Some(ring1_set)) = (ring0_set, ring1_set) {
                if ring0_set == ring1_set {
                    return false;
                }
            }
        }

        true
    }

    pub fn energy(&self, config: &config::Config) -> f64 {
        let stats = self.stats(config.max_level);
        // need to take the negative due to being a minimiser
        -stats
            .iter()
            .zip(config.weights.iter())
            .fold(0.0, |accumulate, (stat, weight)| {
                accumulate + *stat as f64 * weight
            })
    }

    fn items(&self) -> impl std::iter::Iterator<Item = &items::Item> {
        self.set
            .iter()
            .filter_map(|item_id| item_id.map(|item_id| &items::ITEMS[item_id]))
    }

    pub fn stats(&self, current_level: i32) -> stats::Characteristic {
        let mut stat = stats::new_characteristics();

        for item in self.items() {
            stats::characteristic_add(&mut stat, &item.stats);
        }

        for set_bonus in self.sets() {
            stats::characteristic_add(&mut stat, &set_bonus.bonus);
        }

        stat[stats::Stat::AP as usize] = std::cmp::min(
            stat[stats::Stat::AP as usize],
            max_additional_ap(current_level),
        );
        stat[stats::Stat::MP as usize] =
            std::cmp::min(stat[stats::Stat::MP as usize], MAX_ADDITIONAL_MP);
        stat[stats::Stat::Range as usize] =
            std::cmp::min(stat[stats::Stat::Range as usize], MAX_ADDITIONAL_RANGE);

        stat[stats::Stat::ResistanceNeutralPercent as usize] =
            std::cmp::min(stat[stats::Stat::ResistanceNeutralPercent as usize], 50);
        stat[stats::Stat::ResistanceEarthPercent as usize] =
            std::cmp::min(stat[stats::Stat::ResistanceEarthPercent as usize], 50);
        stat[stats::Stat::ResistanceFirePercent as usize] =
            std::cmp::min(stat[stats::Stat::ResistanceFirePercent as usize], 50);
        stat[stats::Stat::ResistanceWaterPercent as usize] =
            std::cmp::min(stat[stats::Stat::ResistanceWaterPercent as usize], 50);
        stat[stats::Stat::ResistanceAirPercent as usize] =
            std::cmp::min(stat[stats::Stat::ResistanceAirPercent as usize], 50);

        stat
    }
}

fn max_additional_ap(level: i32) -> i32 {
    if level >= 100 {
        5
    } else {
        6
    }
}

pub struct Optimiser<'a> {
    config: &'a config::Config,
    initial_state: State,
}

impl<'a> Optimiser<'a> {
    pub fn new(
        config: &'a config::Config,
        initial_set: [Option<i32>; 16],
    ) -> Result<Optimiser<'a>, &'static str> {
        let initial_state: State = State::new_from_initial_equipment(initial_set)?;
        if !initial_state.valid(config) {
            return Err("Initial state is not valid");
        }
        Ok(Optimiser {
            config,
            initial_state,
        })
    }

    pub fn optimise(self) -> State {
        anneal::Anneal::optimise(&self, self.initial_state.clone(), 1_000_000)
    }
}

impl<'a> anneal::Anneal<State> for Optimiser<'a> {
    fn random(&self) -> f64 {
        rand::thread_rng().gen_range(0.0, 1.0)
    }

    fn neighbour(&self, state: &State) -> State {
        loop {
            let mut new_state = state.clone();
            let (item_slot, item) = loop {
                let item_slot = *self
                    .config
                    .changable
                    .choose(&mut rand::thread_rng())
                    .unwrap();
                let item_type = state_index_to_item(item_slot);
                let item_index = item_type[rand::thread_rng().gen_range(0, item_type.len())];
                let item = &items::ITEMS[item_index];
                if item.level <= self.config.max_level
                    && !self.config.ban_list.contains(&item.dofus_id)
                {
                    break (item_slot, item_index);
                }
            };

            new_state.set[item_slot] = Some(item);
            if new_state.valid(self.config) {
                return new_state;
            }
        }
    }

    fn energy(&self, state: &State) -> f64 {
        state.energy(self.config)
    }

    fn temperature(&self, iteration: f64, _energy: f64) -> f64 {
        30000.0 * std::f64::consts::E.powf(-16.0 * iteration)
    }
}
