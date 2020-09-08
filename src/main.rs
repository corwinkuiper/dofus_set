mod anneal;
use anneal::Anneal;
mod dofus_set;
mod items;
mod stats;

#[macro_use]
extern crate lazy_static;

fn main() {
    let initial_state = dofus_set::State::default();
    let final_state = initial_state.optimise(1_000_000);
    final_state.print();
    println!("Set Energy: {}", -final_state.energy());
}
