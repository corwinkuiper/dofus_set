use ::dofus_set::config;
use ::dofus_set::dofus_set::{Optimiser, State};
use ::dofus_set::items;
use ::dofus_set::stats;
use ::dofus_set::stats::Stat;

fn main() {
    let mut weights = [0.0; 51];
    weights[Stat::Power as usize] = 1.0;
    weights[Stat::Strength as usize] = 1.0;
    weights[Stat::AP as usize] = 400.0;
    weights[Stat::MP as usize] = 300.0;
    weights[Stat::Range as usize] = 5.0;

    let config = config::Config {
        max_level: 148,
        weights,
        changable: (0..16).collect(),
    };
    let optimiser = Optimiser { config: &config };

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
