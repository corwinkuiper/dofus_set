mod anneal;
mod config;
mod items;
mod set_build;
mod stats;

use set_build::State;
use stats::Stat;

#[macro_use]
extern crate lazy_static;

fn main() {
    let mut weights = [0.0; 51];
    weights[Stat::Power as usize] = 6.0;
    weights[Stat::Strength as usize] = 1.0;
    weights[Stat::Agility as usize] = 1.0;
    weights[Stat::Chance as usize] = 1.0;
    weights[Stat::Intelligence as usize] = 1.0;
    weights[Stat::AP as usize] = 400.0;
    weights[Stat::MP as usize] = 200.0;
    weights[Stat::Range as usize] = 100.0;

    let config = config::Config {
        max_level: 148,
        weights,
        changable: (0..16).collect(),
    };
    let optimiser = set_build::Optimiser { config: &config };

    let final_state = optimiser.optimise();
    print_state(&final_state, &config);
    println!("Set Energy: {}", -final_state.energy(&config));
}

pub fn print_state(state: &State, config: &config::Config) {
    let mut last_state_name = "";

    for item in state.set() {
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
    print_stats(&state.stats(config.max_level));
    println!("\nSet bonuses");
    println!("-----------------------------");
    for set_bonus in state.sets() {
        println!("{} - {} items", set_bonus.name, set_bonus.number_of_items);
        print_stats(&set_bonus.bonus);
    }
}

fn print_stats(stat: &stats::Characteristic) {
    for (characteristic, value) in stat.iter().enumerate() {
        let stat: stats::Stat = unsafe { std::mem::transmute(characteristic as u8) };
        if *value != 0 {
            println!("\t{:#?}: {}", stat, value);
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
