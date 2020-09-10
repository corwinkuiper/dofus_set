use super::stats;

use serde::Deserialize;
use std::collections::HashMap;
use std::convert::TryInto;

pub struct Item {
    pub name: String,
    pub item_type: String,
    pub stats: stats::Characteristic,
    pub level: i32,
    pub set_id: Option<i32>,
    pub restriction: Box<dyn stats::Restriction + Sync>,
    pub image_url: Option<String>,
}

#[derive(Deserialize, Debug)]
struct DofusLabConditions {
    conditions: serde_json::Map<String, serde_json::value::Value>,
}

#[allow(non_snake_case)]
#[derive(Deserialize, Debug)]
struct DofusLabItemName {
    en: String,
}

#[allow(non_snake_case)]
#[derive(Deserialize, Debug)]
struct DofusLabItemStats {
    stat: String,
    minStat: Option<i32>,
    maxStat: i32,
}

#[allow(non_snake_case)]
#[derive(Deserialize, Debug)]
struct DofusLabItem {
    name: DofusLabItemName,
    itemType: String,
    setID: Option<String>,
    stats: Option<Vec<DofusLabItemStats>>,
    level: i32,
    conditions: Option<DofusLabConditions>,
    imageUrl: Option<String>,
}

#[derive(Deserialize)]
struct DofusLabStatRestriction {
    stat: String,
    operator: String,
    value: i32,
}

fn parse_restriction(
    value: &serde_json::Map<String, serde_json::value::Value>,
) -> Box<dyn stats::Restriction + Sync> {
    if value.is_empty() {
        return Box::new(stats::NullRestriction {});
    }

    if let Some(and_restriction) = value.get("and") {
        let and_restriction = and_restriction.as_array().unwrap();
        Box::new(stats::RestrictionSet {
            operator: stats::BooleanOperator::And,
            restrictions: and_restriction
                .iter()
                .map(|r| parse_restriction(r.as_object().unwrap()))
                .collect(),
        })
    } else if let Some(or_restriction) = value.get("or") {
        let or_restriction = or_restriction.as_array().unwrap();
        Box::new(stats::RestrictionSet {
            operator: stats::BooleanOperator::Or,
            restrictions: or_restriction
                .iter()
                .map(|r| parse_restriction(r.as_object().unwrap()))
                .collect(),
        })
    } else {
        let stat: DofusLabStatRestriction =
            serde_json::from_value(serde_json::Value::Object(value.clone())).unwrap();
        let operator = match stat.operator.as_str() {
            "<" => stats::Operator::LessThan,
            ">" => stats::Operator::GreaterThan,
            _ => panic!("Bad operator"),
        };

        if stat.stat == "SET_BONUS" {
            Box::new(stats::SetBonusRestriction {
                value: stat.value,
                operator,
            })
        } else {
            Box::new(stats::RestrictionLeaf {
                value: stat.value,
                operator,
                stat: stat.stat.as_str().try_into().unwrap(),
            })
        }
    }
}

pub fn parse_items(data: &[u8]) -> Vec<Item> {
    let data: Vec<DofusLabItem> = serde_json::from_slice(data).unwrap();

    data.iter()
        .map(|item| {
            let mut stats = stats::new_characteristics();
            if let Some(item_stats) = item.stats.as_ref() {
                for stat in item_stats {
                    let characteristic: stats::Stat = stat.stat.as_str().try_into().unwrap();
                    stats[characteristic as usize] = stat.maxStat;
                }
            }

            let restriction = item
                .conditions
                .as_ref()
                .map(|conditions| parse_restriction(&conditions.conditions))
                .unwrap_or_else(|| Box::new(stats::NullRestriction {}));

            Item {
                name: item.name.en.clone(),
                item_type: item.itemType.clone(),
                stats,
                level: item.level,
                set_id: item.setID.as_ref().map(|id| id.parse().ok()).flatten(),
                restriction,
                image_url: item.imageUrl.clone(),
            }
        })
        .collect()
}

pub struct Set {
    pub name: String,
    pub bonuses: HashMap<i32, stats::Characteristic>,
}

#[derive(Debug, Deserialize)]
struct DofusLabSetStat {
    stat: Option<String>,
    value: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct DofusLabSet {
    name: DofusLabItemName,
    id: String,
    bonuses: HashMap<String, Vec<DofusLabSetStat>>,
}

pub fn parse_sets(data: &[u8]) -> HashMap<i32, Set> {
    let data: Vec<DofusLabSet> = serde_json::from_slice(data).unwrap();

    data.iter()
        .map(|set| {
            let bonuses: HashMap<_, _> = set
                .bonuses
                .iter()
                .map(|(number_of_items, bonus)| {
                    let mut stats = stats::new_characteristics();
                    for stat in bonus {
                        if let (Some(stat), Some(value)) = (&stat.stat, stat.value) {
                            let characteristic: stats::Stat = stat.as_str().try_into().unwrap();
                            let characteristic_index = characteristic as usize;
                            stats[characteristic_index] = value;
                        }
                    }

                    (number_of_items.parse().unwrap(), stats)
                })
                .collect();

            (
                set.id.parse().unwrap(),
                Set {
                    name: set.name.en.to_owned(),
                    bonuses,
                },
            )
        })
        .collect()
}

fn item_filter(
    items: &'static [Item],
    filter: &'static [&str],
) -> impl std::iter::Iterator<Item = usize> {
    items
        .iter()
        .enumerate()
        .filter(move |(_, x)| filter.contains(&x.item_type.as_str()))
        .map(|(index, _)| index)
}

lazy_static! {
    pub static ref ITEMS: Vec<Item> = {
        let mut items = Vec::new();
        items.append(&mut parse_items(include_bytes!("../data/items.json")));
        items.append(&mut parse_items(include_bytes!("../data/weapons.json")));
        items.append(&mut parse_items(include_bytes!("../data/mounts.json")));
        items.append(&mut parse_items(include_bytes!("../data/pets.json")));
        items.append(&mut parse_items(include_bytes!("../data/rhineetles.json")));

        items
    };
    pub static ref MOUNTS: Vec<usize> =
        item_filter(&ITEMS, &["Pet", "Petsmount", "Mount"]).collect();
    pub static ref WEAPONS: Vec<usize> = item_filter(
        &ITEMS,
        &[
            "Axe",
            "Bow",
            "Dagger",
            "Hammer",
            "Pickaxe",
            "Scythe",
            "Shovel",
            "Soul stone",
            "Staff",
            "Sword",
            "Tool",
            "Wand",
        ]
    )
    .collect();
    pub static ref HATS: Vec<usize> = item_filter(&ITEMS, &["Hat"]).collect();
    pub static ref CLOAKS: Vec<usize> = item_filter(&ITEMS, &["Cloak", "Backpack"]).collect();
    pub static ref AMULETS: Vec<usize> = item_filter(&ITEMS, &["Amulet"]).collect();
    pub static ref RINGS: Vec<usize> = item_filter(&ITEMS, &["Ring"]).collect();
    pub static ref BELTS: Vec<usize> = item_filter(&ITEMS, &["Belt"]).collect();
    pub static ref BOOTS: Vec<usize> = item_filter(&ITEMS, &["Boots"]).collect();
    pub static ref SHIELDS: Vec<usize> = item_filter(&ITEMS, &["Shield"]).collect();
    pub static ref DOFUS: Vec<usize> =
        item_filter(&ITEMS, &["Dofus", "Trophy", "Prysmaradite"]).collect();
    pub static ref SETS: HashMap<i32, Set> = parse_sets(include_bytes!("../data/sets.json"));
}
