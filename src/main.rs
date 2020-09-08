mod anneal;
mod items;
mod stats;

use anyhow;

#[macro_use]
extern crate lazy_static;

fn main() -> Result<(), anyhow::Error> {
    print_items_ref(&DOFUS);
    Ok(())
}

fn print_item(item: &items::Item) {
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
fn print_items_ref(items: &[&items::Item]) {
    for item in items.iter() {
        print_item(item);
    }
}
fn print_items(items: &[items::Item]) {
    for item in items.iter() {
        print_item(item);
    }
}

lazy_static! {
    static ref ITEMS: Vec<items::Item> = items::parse_items(include_bytes!("../data/items.json"));
    static ref WEAPONS: Vec<items::Item> =
        items::parse_items(include_bytes!("../data/weapons.json"));
    static ref HATS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Hat").collect();
    static ref CLOAKS: Vec<&'static items::Item> = ITEMS
        .iter()
        .filter(|x| x.item_type == "Cloak" || x.item_type == "Backpack")
        .collect();
    static ref AMULETS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Amulet").collect();
    static ref RINGS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Ring").collect();
    static ref BELTS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Belt").collect();
    static ref BOOTS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Boots").collect();
    static ref SHIELDS: Vec<&'static items::Item> =
        ITEMS.iter().filter(|x| x.item_type == "Shield").collect();
    static ref DOFUS: Vec<&'static items::Item> = ITEMS
        .iter()
        .filter(|x| x.item_type == "Dofus"
            || x.item_type == "Trophy"
            || x.item_type == "Prysmaradite")
        .collect();
}
