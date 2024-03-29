#![deny(clippy::all)]

use ::dofus_set::config;
use ::dofus_set::dofus_set::{Optimiser, State};
use ::dofus_set::items;
use ::dofus_set::stats;
use ::dofus_set::stats::Stat;
use dofus_set::items::Items;

use std::convert::TryInto;

fn main() {
    let items = Items::new();

    let mut weights = [0.0; 51];
    weights[Stat::Power as usize] = 1.0;
    weights[Stat::Strength as usize] = 1.0;
    weights[Stat::AP as usize] = 400.0;
    weights[Stat::MP as usize] = 300.0;
    weights[Stat::Range as usize] = 5.0;

    let config = config::Config {
        max_level: 148,
        weights,
        targets: [None; 51],
        changable: (1..16).collect(),
        ban_list: Vec::new(),
        exo_ap: false,
        exo_mp: false,
        exo_range: false,
        multi_element: false,
    };

    let initial_set: [Option<_>; 16] = [None; 16];

    let optimiser = Optimiser::new(&config, initial_set, &items).unwrap();

    let final_state = optimiser.optimise().unwrap();
    print_state(&final_state, &config, &items);
    println!("Set Energy: {}", -final_state.energy(&config, &items));
}

pub fn print_state(state: &State, config: &config::Config, items: &Items) {
    let mut last_state_name = "";

    for item in state.set().flatten().map(|idx| &items[idx]) {
        let state_name = &item.item_type;
        if state_name != last_state_name {
            println!("{}", state_name);
            println!("-----------------------------");
        }

        last_state_name = state_name;
        print_item(item);
    }
    println!("Stats");
    println!("-----------------------------");
    print_stats(&state.stats(config, items));
    println!("\nSet bonuses");
    println!("-----------------------------");
    for set_bonus in state.sets(items) {
        println!("{} - {} items", set_bonus.name, set_bonus.number_of_items);
        print_stats(&set_bonus.bonus);
    }
}

fn print_stats(stat: &stats::Characteristic) {
    for (characteristic, value) in stat.iter().enumerate() {
        let stat: Stat = characteristic.try_into().unwrap();
        if *value != 0 {
            println!("\t{}: {}", stat, value);
        }
    }
}

fn print_item(item: &items::Item) {
    println!("Name: {}", item.name);
    println!("Level: {}", item.level);
    println!("Stats:");
    print_stats(&item.stats);
    println!("==============================");
}
