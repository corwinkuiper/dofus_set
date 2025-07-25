#![deny(clippy::all)]

use dofus_characteristics::Stat;
use dofus_items::{NicheItemIndex, ITEMS};
use dofus_set::{config, dofus_set::Optimiser};

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
        consider_characteristics: false,
    };

    for _ in 0..10 {
        let optimiser = Optimiser::new(&config, 1000., items).unwrap();

        let final_state = optimiser.optimise(1_000_000).unwrap();
        let sets = final_state.sets(items);
        println!("Set Energy: {}", -final_state.energy(&config, items, &sets));
    }
}

#[cfg(not(target_env = "msvc"))]
use tikv_jemallocator::Jemalloc;

#[cfg(not(target_env = "msvc"))]
#[global_allocator]
static GLOBAL: Jemalloc = Jemalloc;
