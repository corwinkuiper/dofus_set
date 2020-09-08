mod anneal;
mod config;
mod dofus_set;
mod items;
mod stats;

#[macro_use]
extern crate lazy_static;

fn main() {
    let optimiser = dofus_set::Optimiser {
        config: config::Config { max_level: 125 },
    };

    let final_state = optimiser.optimise();
    final_state.print();
    println!("Set Energy: {}", -final_state.energy());
}
