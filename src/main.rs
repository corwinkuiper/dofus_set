mod anneal;
mod item;
mod parse;
mod stats;

use anyhow;

#[macro_use]
extern crate lazy_static;

fn main() -> Result<(), anyhow::Error> {
    Ok(())
}


lazy_static! {
    static ref ITEMS: Vec<Item> = {
        let items = vec!();

        

        items
    };
}

struct Item {
    name: String,
    stats: stats::Stats,
    level: i64,
}
