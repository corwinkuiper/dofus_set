mod anneal;
mod items;
mod stats;

use anyhow;

#[macro_use]
extern crate lazy_static;

fn main() -> Result<(), anyhow::Error> {
    print_items(&ITEMS);
    print_items(&WEAPONS);
    Ok(())
}

fn print_items(items: &Vec<items::Item>) {
    for item in items.iter() {
        println!("============");
        println!("Name: {}", item.name);
        println!("Level: {}", item.level);
        println!("Stats:");
        for (characteristic, value) in item.stats.iter().enumerate() {
            let stat: stats::Stat = unsafe { std::mem::transmute(characteristic as u8) };
            if *value != 0 {
                println!("\t{:#?}: {}", stat, value);
            }
        }
    }
}

lazy_static! {
    static ref ITEMS: Vec<items::Item> = items::parse_items(include_bytes!("../data/items.json"));
    static ref WEAPONS: Vec<items::Item> =
        items::parse_items(include_bytes!("../data/weapons.json"));
}
