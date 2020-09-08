use super::anneal;
use super::config;
use super::items;
use super::stats;

use rand::prelude::Rng;

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

impl State {
    pub fn set(&self) -> impl std::iter::Iterator<Item = &items::Item> {
        self.set
            .iter()
            .enumerate()
            .filter_map(|(index, item_id)| item_id.map(|i| state_index_to_item(index)[i]))
    }

    fn valid(&self, config: &config::Config) -> bool {
        for (index, item_id) in self.set.iter().enumerate() {
            if let Some(item_id) = item_id {
                if state_index_to_item(index)[*item_id].level > config.max_level {
                    return false;
                }
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
            if ring0_set.is_some() && ring1_set.is_some() {
                if ring0_set.unwrap() == ring1_set.unwrap() {
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
            stats[stats::Stat::Power as usize] as f64 * 6.0
                + stats[stats::Stat::Intelligence as usize] as f64 * 1.0
                + stats[stats::Stat::Strength as usize] as f64 * 1.0
                + stats[stats::Stat::Chance as usize] as f64 * 1.0
                + stats[stats::Stat::Agility as usize] as f64 * 1.0
                + stats[stats::Stat::AP as usize] as f64 * 300.0
                + stats[stats::Stat::MP as usize] as f64 * 200.0
                + stats[stats::Stat::Range as usize] as f64 * 100.0
                + stats[stats::Stat::Vitality as usize] as f64 / 100.0
                + std::cmp::min(stats[stats::Stat::Critical as usize], 0) as f64 * 20.0
        }
    }

    pub fn stats(&self, current_level: i32) -> stats::Characteristic {
        let mut stat = stats::new_characteristics();
        for (index, item_id) in self.set.iter().enumerate() {
            if let Some(item_id) = item_id {
                let item_stats = state_index_to_item(index)[*item_id].stats;
                stats::characteristic_add(&mut stat, &item_stats);
            }
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
            let random_number = rand::thread_rng().gen_range(0, state.set.len());
            let item_type = state_index_to_item(random_number);
            new_state.set[random_number] = Some(rand::thread_rng().gen_range(0, item_type.len()));
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
            || x.item_type == "Prysmaradite").collect();
}
