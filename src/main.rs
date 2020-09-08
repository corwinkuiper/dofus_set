mod anneal;
mod config;
mod dofus_set;
mod items;
mod stats;

#[macro_use]
extern crate lazy_static;

fn main() {
    let config = config::Config { max_level: 125 };
    let optimiser = dofus_set::Optimiser { config: &config };

    let final_state = optimiser.optimise();
    final_state.print(&config);
    println!("Set Energy: {}", -final_state.energy(&config));
}
