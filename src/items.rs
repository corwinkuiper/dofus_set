use super::stats;

use serde::Deserialize;
use std::collections::HashMap;

pub struct Item {
    pub name: String,
    pub item_type: String,
    pub stats: stats::Characteristic,
    pub level: i32,
    pub set_id: Option<i32>,
    pub restriction: Box<dyn stats::Restriction + Sync>,
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
    if value.len() == 0 {
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
                operator: operator,
            })
        } else {
            Box::new(stats::RestrictionLeaf {
                value: stat.value,
                operator: operator,
                stat: stats::stat_from_str(&stat.stat).unwrap(),
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
                    let characteristic_index = stats::stat_from_str(&stat.stat).unwrap() as usize;
                    stats[characteristic_index] = stat.maxStat;
                }
            }

            Item {
                name: item.name.en.clone(),
                item_type: item.itemType.clone(),
                stats: stats,
                level: item.level,
                set_id: item.setID.as_ref().map(|id| id.parse().ok()).flatten(),
                restriction: Box::new(stats::NullRestriction {}),
            }
        }).collect()
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
                            let characteristic_index =
                                stats::stat_from_str(&stat).unwrap() as usize;
                            stats[characteristic_index] = value;
                        }
                    }

                    (number_of_items.parse().unwrap(), stats)
                }).collect();

            (
                set.id.parse().unwrap(),
                Set {
                    name: set.name.en.to_owned(),
                    bonuses: bonuses,
                },
            )
        }).collect()
}
