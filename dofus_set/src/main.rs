#![deny(clippy::all)]

use ::dofus_set::config;
use ::dofus_set::dofus_set::{Optimiser, State};
use dofus_characteristics::{Characteristic, Stat};
use dofus_items::{Item, Items, NicheItemIndex, ITEMS};

fn main() {
    let items = &ITEMS;

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
        initial_set: [NicheItemIndex::new(None); 16],
        changed_item_weight: 0.,
        damaging_moves: Vec::new(),
    };

    let optimiser = Optimiser::new(&config, 1000., items).unwrap();

    let final_state = optimiser.optimise(1_000_000).unwrap();
    print_state(&final_state, &config, items);
    let sets = final_state.sets(items);
    println!("Set Energy: {}", -final_state.energy(&config, items, &sets));
}

pub fn print_state(state: &State, config: &config::Config, items: &Items) {
    let mut last_state_name = "";

    for item in state.set().flatten().map(|idx| &items[idx]) {
        let state_name = item.item_type;
        if state_name != last_state_name {
            println!("{state_name}");
            println!("-----------------------------");
        }

        last_state_name = state_name;
        print_item(item);
    }
    println!("Stats");
    println!("-----------------------------");
    let sets = state.sets(items);
    print_stats(&state.stats(config, &sets));
    println!("\nSet bonuses");
    println!("-----------------------------");
    for set_bonus in state.sets(items) {
        println!("{} - {} items", set_bonus.name, set_bonus.number_of_items);
        print_stats(set_bonus.bonus);
    }
}

fn print_stats(stat: &Characteristic) {
    for (characteristic, value) in stat.iter().enumerate() {
        let stat = Stat::from_repr(characteristic).unwrap();
        if *value != 0 {
            println!("\t{stat}: {value}");
        }
    }
}

fn print_item(item: &Item) {
    println!("Name: {}", item.name);
    println!("Level: {}", item.level);
    println!("Stats:");
    print_stats(&item.stats);
    println!("==============================");
}
