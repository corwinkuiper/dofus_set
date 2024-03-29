use super::stats;

use rustc_hash::FxHashMap;
use serde::{Deserialize, Serialize};
use std::{convert::TryInto, ops::Index};

#[derive(Debug)]
pub struct Item {
    pub name: String,
    pub item_type: String,
    pub stats: stats::Characteristic,
    pub level: i32,
    pub set_id: Option<SetIndex>,
    pub restriction: Box<dyn stats::Restriction + Sync + Send>,
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
) -> Box<dyn stats::Restriction + Sync + Send> {
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

fn parse_items(data: &[&[u8]], set_mappings: &FxHashMap<String, SetIndex>) -> Vec<Item> {
    let data: Vec<DofusLabItem> = data
        .iter()
        .flat_map(|data| serde_json::from_slice::<Vec<DofusLabItem>>(data).unwrap())
        .collect();

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
                set_id: item
                    .setID
                    .as_ref()
                    .and_then(|id| set_mappings.get(id).copied()),
                restriction,
                image_url: item.imageUrl.clone(),
            }
        })
        .collect()
}

#[derive(Debug)]
pub struct Set {
    pub name: String,
    pub bonuses: FxHashMap<i32, stats::Characteristic>,
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
    bonuses: FxHashMap<String, Vec<DofusLabSetStat>>,
}

fn parse_sets(data: &[u8]) -> (FxHashMap<String, SetIndex>, Vec<Set>) {
    let data: Vec<DofusLabSet> = serde_json::from_slice(data).unwrap();

    let mut dofus_id_to_internal_id_mapping = FxHashMap::default();

    let sets: Vec<Set> = data
        .iter()
        .enumerate()
        .map(|(idx, set)| {
            let bonuses: FxHashMap<_, _> = set
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

            dofus_id_to_internal_id_mapping.insert(set.id.clone(), SetIndex(idx));

            Set {
                name: set.name.en.to_owned(),
                bonuses,
            }
        })
        .collect();

    (dofus_id_to_internal_id_mapping, sets)
}

fn item_filter<'a>(
    items: &'a [Item],
    filter: &'a [&str],
) -> impl std::iter::Iterator<Item = ItemIndex> + 'a {
    items
        .iter()
        .enumerate()
        .filter(move |(_, x)| filter.contains(&x.item_type.as_str()))
        .map(|(index, _)| ItemIndex(index))
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct ItemIndex(usize);

#[derive(Debug, PartialEq, Eq, Clone, Copy, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct SetIndex(usize);

impl ItemIndex {
    pub fn new_from_id(id: usize) -> Self {
        ItemIndex(id)
    }
}

#[derive(Debug)]
pub struct Items {
    items: Vec<Item>,
    sets: Vec<Set>,
    item_types: [Vec<ItemIndex>; 10],
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemType {
    Mount,
    Weapon,
    Hat,
    Cloak,
    Amulet,
    Ring,
    Belt,
    Boot,
    Shield,
    Dofus,
}

impl From<usize> for ItemType {
    fn from(value: usize) -> Self {
        match value {
            0 => ItemType::Mount,
            1 => ItemType::Weapon,
            2 => ItemType::Hat,
            3 => ItemType::Cloak,
            4 => ItemType::Amulet,
            5 => ItemType::Ring,
            6 => ItemType::Belt,
            7 => ItemType::Boot,
            8 => ItemType::Shield,
            9 => ItemType::Dofus,
            _ => panic!("Not valid!!!!"),
        }
    }
}

impl Index<ItemIndex> for Items {
    type Output = Item;

    fn index(&self, index: ItemIndex) -> &Self::Output {
        &self.items[index.0]
    }
}

impl Index<ItemType> for Items {
    type Output = [ItemIndex];

    fn index(&self, index: ItemType) -> &Self::Output {
        &self.item_types[index as usize]
    }
}

impl Index<SetIndex> for Items {
    type Output = Set;

    fn index(&self, index: SetIndex) -> &Self::Output {
        &self.sets[index.0]
    }
}

impl Items {
    pub fn new() -> Self {
        let sets: (FxHashMap<String, SetIndex>, Vec<Set>) =
            parse_sets(include_bytes!("../data/sets.json"));
        let items: Vec<Item> = parse_items(
            &[
                include_bytes!("../data/items.json"),
                include_bytes!("../data/weapons.json"),
                include_bytes!("../data/mounts.json"),
                include_bytes!("../data/pets.json"),
                include_bytes!("../data/rhineetles.json"),
            ],
            &sets.0,
        );

        let mounts = item_filter(&items, &["Pet", "Petsmount", "Mount"]).collect();
        let weapons = item_filter(
            &items,
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
            ],
        )
        .collect();
        let hats = item_filter(&items, &["Hat"]).collect();
        let cloaks = item_filter(&items, &["Cloak", "Backpack"]).collect();
        let amulets = item_filter(&items, &["Amulet"]).collect();
        let rings = item_filter(&items, &["Ring"]).collect();
        let belts = item_filter(&items, &["Belt"]).collect();
        let boots = item_filter(&items, &["Boots"]).collect();
        let shields = item_filter(&items, &["Shield"]).collect();
        let dofus = item_filter(&items, &["Dofus", "Trophy", "Prysmaradite"]).collect();

        Items {
            items,
            sets: sets.1,
            item_types: [
                mounts, weapons, hats, cloaks, amulets, rings, belts, boots, shields, dofus,
            ],
        }
    }
}

impl Default for Items {
    fn default() -> Self {
        Self::new()
    }
}
