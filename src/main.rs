mod anneal;
mod stats;

use anyhow;

#[macro_use]
extern crate lazy_static;

fn main() -> Result<(), anyhow::Error> {
    for item in ITEMS.iter() {
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
    Ok(())
}

lazy_static! {
    static ref ITEMS: Vec<Item> = {
        let mut items = vec![];
        let data: serde_json::Value =
            serde_json::from_slice(include_bytes!("../data/items.json")).unwrap();
        for item in data.as_array().unwrap() {
            let name = item
                .get("name")
                .unwrap()
                .get("en")
                .unwrap()
                .as_str()
                .unwrap()
                .to_string();
            let level = item.get("level").unwrap().as_i64().unwrap() as i32;
            let mut set_id = None;
            if let Some(set) = item.get("setID") {
                if let Some(set) = set.as_str() {
                    if let Ok(set) = set.parse() {
                        set_id = Some(set)
                    }
                }
            }

            let dofus_id: i32 = {
                let id = item.get("dofusID").unwrap();
                if let Some(id) = id.as_str() {
                    id.parse().unwrap()
                } else if let Some(id) = id.as_i64() {
                    id as i32
                } else {
                    panic!()
                }
            };
            let mut stats: stats::Characteristic = [0; 51];
            if let Some(stat) = item.get("stats") {
                for stat in stat.as_array().unwrap() {
                    let characteristic = stat.get("stat").unwrap().as_str().unwrap();
                    let value = stat.get("maxStat").unwrap().as_i64().unwrap() as stats::StatValue;
                    let characteristic_index =
                        stats::stat_from_str(characteristic).unwrap() as usize;
                    stats[characteristic_index] = value;
                }
            }

            let restrictions = None; //todo
            items.push(Item {
                name,
                level,
                set_id,
                dofus_id,
                stats,
                restrictions,
            });
        }
        items
    };
}

struct Item {
    name: String,
    stats: stats::Characteristic,
    level: i32,
    set_id: Option<i32>,
    dofus_id: i32,
    restrictions: Option<stats::Restriction>,
}
