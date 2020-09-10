use crate::anneal;
use crate::config;
use crate::items;
use crate::stats;

use rand::prelude::Rng;
use rand::seq::SliceRandom;
use std::collections::HashMap;

fn state_index_to_item<'a>(index: usize) -> &'a [&'static items::Item] {
    match index {
        0 => &HATS,
        1 => &CLOAKS,
        2 => &AMULETS,
        3..=4 => &RINGS,
        5 => &BELTS,
        6 => &BOOTS,
        7 => &WEAPONS,
        8 => &SHIELDS,
        9..=14 => &DOFUS,
        15 => &MOUNTS,
        _ => panic!("Index out of range"),
    }
}

const MAX_ADDITIONAL_MP: i32 = 3;
const MAX_ADDITIONAL_RANGE: i32 = 6;

#[derive(Clone, Debug, Default)]
pub struct State {
    set: [Option<usize>; 16],
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
            .enumerate()
            .filter_map(|(index, item_id)| item_id.map(|i| state_index_to_item(index)[i]))
    }

    pub fn sets(&self) -> impl std::iter::Iterator<Item = SetBonus> {
        let mut sets = HashMap::<i32, i32>::new(); // map of set ids to number of items in that set

        for item in self.items() {
            if let Some(set_id) = item.set_id {
                sets.entry(set_id).and_modify(|i| *i += 1).or_insert(1);
            }
        }

        sets.into_iter().filter_map(|(set, number_of_items)| {
            let set = &SETS[&set];

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
            let ring0_set = RINGS[rings[0].unwrap()].set_id;
            let ring1_set = RINGS[rings[1].unwrap()].set_id;
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
        -{
            stats
                .iter()
                .zip(config.weights.iter())
                .fold(0.0, |accumulate, (stat, weight)| {
                    accumulate + *stat as f64 * weight
                })
        }
    }

    fn items(&self) -> impl std::iter::Iterator<Item = &items::Item> {
        self.set.iter().enumerate().filter_map(|(index, item_id)| {
            item_id.map(|item_id| state_index_to_item(index)[item_id])
        })
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
    pub config: &'a config::Config,
}

impl<'a> Optimiser<'a> {
    pub fn optimise(self) -> State {
        let initial_state = State::default();
        anneal::Anneal::optimise(&self, initial_state, 1_000_000)
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
                let item_index = rand::thread_rng().gen_range(0, item_type.len());
                if item_type[item_index].level <= self.config.max_level {
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

lazy_static! {
    static ref ITEMS: Vec<items::Item> = items::parse_items(include_bytes!("../data/items.json"));
    static ref WEAPONS_S: Vec<items::Item> =
        items::parse_items(include_bytes!("../data/weapons.json"));
    static ref MOUNTS_S: Vec<items::Item> = {
        let mut mounts = items::parse_items(include_bytes!("../data/mounts.json"));
        mounts.append(&mut items::parse_items(include_bytes!(
            "../data/mounts.json"
        )));
        mounts.append(&mut items::parse_items(include_bytes!(
            "../data/rhineetles.json"
        )));

        mounts
    };
    static ref MOUNTS: Vec<&'static items::Item> = MOUNTS_S.iter().collect();
    static ref WEAPONS: Vec<&'static items::Item> = WEAPONS_S.iter().collect();
    static ref HATS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Hat").collect();
    static ref CLOAKS: Vec<&'static items::Item> = ITEMS
        .iter()
        .filter(|x| x.item_type == "Cloak" || x.item_type == "Backpack")
        .collect();
    static ref AMULETS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Amulet").collect();
    static ref RINGS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Ring").collect();
    static ref BELTS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Belt").collect();
    static ref BOOTS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Boots").collect();
    static ref SHIELDS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Shield").collect();
    static ref DOFUS: Vec<&'static items::Item> = ITEMS
        .iter()
        .filter(|x| x.item_type == "Dofus"
            || x.item_type == "Trophy"
            || x.item_type == "Prysmaradite")
        .collect();
    static ref SETS: HashMap<i32, items::Set> =
        items::parse_sets(include_bytes!("../data/sets.json"));
}
