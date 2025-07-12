use std::{error::Error, fs::File, io::BufWriter};

use dofus_characteristics::{Characteristic, Stat, StatConversionError};
use proc_macro2::TokenStream;
use quote::{format_ident, quote, ToTokens};
use serde::Deserialize;
use serde_json::Value;
use std::{collections::HashMap, convert::TryInto, io::Write};

#[derive(Deserialize, Debug)]
struct DofusLabConditions {
    conditions: serde_json::Map<String, serde_json::value::Value>,
}

#[allow(non_snake_case)]
#[derive(Deserialize, Debug)]
struct DofusLabLocalised {
    en: String,
}

impl ToTokens for DofusLabLocalised {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        self.en.to_tokens(tokens)
    }
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
    name: DofusLabLocalised,
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

#[derive(Deserialize)]
struct DofusLabSpellClass {
    names: DofusLabLocalised,
    spells: Vec<Vec<DofusLabSpell>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DofusLabEffectElement {
    stat: String,
    min_stat: Option<i32>,
    max_stat: StringI32,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DofusLabEffect {
    modifiable_effect: Option<Vec<DofusLabEffectElement>>,
}

#[derive(Clone, Copy)]
struct StringI32(i32);

impl<'de> Deserialize<'de> for StringI32 {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(match Value::deserialize(deserializer)? {
            Value::String(s) => s.parse().map(StringI32).map_err(serde::de::Error::custom)?,
            Value::Number(n) => n
                .as_i64()
                .ok_or(serde::de::Error::custom("wrong type"))?
                .try_into()
                .map(StringI32)
                .map_err(serde::de::Error::custom)?,
            _ => return Err(serde::de::Error::custom("wrong type")),
        })
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DofusLabSpellEffect {
    level: StringI32,
    base_crit_rate: Option<StringI32>,
    normal_effects: DofusLabEffect,
    critical_effects: DofusLabEffect,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DofusLabSpell {
    name: DofusLabLocalised,
    description: DofusLabLocalised,
    image_url: String,
    effects: Vec<DofusLabSpellEffect>,
}

fn parse_restriction(value: &serde_json::Map<String, serde_json::value::Value>) -> TokenStream {
    if value.is_empty() {
        return quote! { &NullRestriction {}};
    }

    if let Some(and_restriction) = value.get("and") {
        let and_restriction = and_restriction.as_array().unwrap();
        let and_restriction = and_restriction
            .iter()
            .map(|r| parse_restriction(r.as_object().unwrap()));
        quote! { & RestrictionSet {
            operator: BooleanOperator::And,
            restrictions: &[#(#and_restriction),*],
        } }
    } else if let Some(or_restriction) = value.get("or") {
        let or_restriction = or_restriction.as_array().unwrap();
        let or_restriction = or_restriction
            .iter()
            .map(|r| parse_restriction(r.as_object().unwrap()));
        quote! { &RestrictionSet {
            operator: BooleanOperator::Or,
            restrictions: &[#(#or_restriction),*],
        } }
    } else {
        let stat: DofusLabStatRestriction =
            serde_json::from_value(serde_json::Value::Object(value.clone())).unwrap();
        let operator = match stat.operator.as_str() {
            "<" => quote! { Operator::LessThan },
            ">" => quote! { Operator::GreaterThan },
            _ => panic!("Bad operator"),
        };

        let value = stat.value;

        if stat.stat == "SET_BONUS" {
            quote! { &SetBonusRestriction {
                value: #value,
                operator: #operator,
            }}
        } else {
            match Stat::try_from(stat.stat.as_str()) {
                Ok(s) => {
                    let stat = s;

                    let stat = format_ident!("{}", stat.to_string());

                    quote! { &RestrictionLeaf {
                        value: #value,
                        operator: #operator,
                        stat: Stat::#stat,
                    }}
                }
                Err(StatConversionError::IntentionallyIgnored) => quote! { &NullRestriction {}},
                _ => panic!("Unsupported stat {}", stat.stat),
            }
        }
    }
}

fn parse_items(
    data: &[&[u8]],
    set_mappings: &HashMap<String, usize>,
) -> Vec<(TokenStream, String)> {
    let data: Vec<DofusLabItem> = data
        .iter()
        .flat_map(|data| serde_json::from_slice::<Vec<DofusLabItem>>(data).unwrap())
        .collect();

    data.iter()
        .map(|item| {
            let mut stats = Characteristic::new();
            if let Some(item_stats) = item.stats.as_ref() {
                for stat in item_stats {
                    let characteristic: Stat = stat.stat.as_str().try_into().unwrap();
                    stats[characteristic] = stat.maxStat;
                }
            }

            let restriction = item
                .conditions
                .as_ref()
                .map(|conditions| parse_restriction(&conditions.conditions))
                .unwrap_or_else(|| quote! {& NullRestriction {}});

            let name = &item.name;
            let item_type = &item.itemType;
            let level = item.level;
            let set_id = item
                .setID
                .as_ref()
                .and_then(|id| set_mappings.get(id).copied());
            let set_id = match set_id {
                Some(x) => quote! { Some(SetIndex(#x))},
                None => quote! {None},
            };
            let image_url = item.imageUrl.as_ref().unwrap();

            (
                quote! { Item {
                    name: #name,
                    item_type: #item_type,
                    stats: #stats,
                    level: #level,
                    set_id: #set_id,
                    restriction: #restriction,
                    image_url: #image_url,
                } },
                item_type.clone(),
            )
        })
        .collect()
}

#[derive(Debug)]
pub struct Set {
    pub name: String,
    pub bonus_start_at: usize,
    pub bonuses: Vec<Characteristic>,
}

#[derive(Debug, Deserialize)]
struct DofusLabSetStat {
    stat: Option<String>,
    value: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct DofusLabSet {
    name: DofusLabLocalised,
    id: String,
    bonuses: HashMap<String, Vec<DofusLabSetStat>>,
}

fn parse_sets(data: &[u8]) -> (HashMap<String, usize>, Vec<Set>) {
    let data: Vec<DofusLabSet> = serde_json::from_slice(data).unwrap();

    let mut dofus_id_to_internal_id_mapping = HashMap::default();

    let sets: Vec<Set> = data
        .iter()
        .enumerate()
        .map(|(idx, set)| {
            let item_count_to_bonus: Vec<(usize, _)> = set
                .bonuses
                .iter()
                .map(|(number_of_items, bonus)| {
                    let mut stats = Characteristic::new();
                    for stat in bonus {
                        if let (Some(stat), Some(value)) = (&stat.stat, stat.value) {
                            let characteristic: Stat = stat.as_str().try_into().unwrap();
                            stats[characteristic] = value;
                        }
                    }

                    (number_of_items.parse().unwrap(), stats)
                })
                .collect();

            let minimum_number_of_items = item_count_to_bonus.iter().map(|x| x.0).min().unwrap();

            let maximum_number_of_items = item_count_to_bonus.iter().map(|x| x.0).max().unwrap();

            let mut bonuses =
                vec![Characteristic::new(); maximum_number_of_items - minimum_number_of_items + 1];
            for (idx, bonus) in item_count_to_bonus.into_iter() {
                bonuses[idx - minimum_number_of_items] = bonus;
            }

            dofus_id_to_internal_id_mapping.insert(set.id.clone(), idx);

            Set {
                name: set.name.en.to_owned(),
                bonus_start_at: minimum_number_of_items,
                bonuses,
            }
        })
        .collect();

    (dofus_id_to_internal_id_mapping, sets)
}

fn item_filter(items: &[(TokenStream, String)], filter: &[&str]) -> TokenStream {
    let items = items
        .iter()
        .enumerate()
        .filter(move |(_, x)| filter.contains(&x.1.as_str()))
        .map(|(index, _)| quote! { ItemIndex(#index) });
    quote! { &[#(#items),*]}
}

fn create_items() -> TokenStream {
    let sets = parse_sets(include_bytes!("data/sets.json"));
    let items = parse_items(
        &[
            include_bytes!("data/items.json"),
            include_bytes!("data/weapons.json"),
            include_bytes!("data/mounts.json"),
            include_bytes!("data/pets.json"),
        ],
        &sets.0,
    );

    let mounts = item_filter(&items, &["Pet", "Petsmount", "Mount"]);
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
    );
    let hats = item_filter(&items, &["Hat"]);
    let cloaks = item_filter(&items, &["Cloak", "Backpack"]);
    let amulets = item_filter(&items, &["Amulet"]);
    let rings = item_filter(&items, &["Ring"]);
    let belts = item_filter(&items, &["Belt"]);
    let boots = item_filter(&items, &["Boots"]);
    let shields = item_filter(&items, &["Shield"]);
    let dofus = item_filter(&items, &["Dofus", "Trophy", "Prysmaradite"]);

    let items = items.iter().map(|x| &x.0);
    let sets = sets.1.iter().map(|set| {
        let name = &set.name;
        let bonuses = &set.bonuses;
        let start_at = set.bonus_start_at;

        quote! {
            Set {
                name: #name,
                start_at: #start_at,
                bonuses: &[#(#bonuses),*],

            }
        }
    });

    quote! {

        Items {
            items: &[#(#items),*],
            sets: &[#(#sets),*],
            item_types: &[
               #mounts, #weapons, #hats, #cloaks, #amulets, #rings, #belts, #boots, #shields, #dofus,
            ]
        }

    }
}

#[derive(Default)]
struct Damage {
    neutral: (i32, i32),
    air: (i32, i32),
    water: (i32, i32),
    earth: (i32, i32),
    fire: (i32, i32),
}

impl ToTokens for Damage {
    fn to_tokens(&self, tokens: &mut TokenStream) {
        let (n1, n2) = self.neutral;
        let (a1, a2) = self.air;
        let (w1, w2) = self.water;
        let (e1, e2) = self.earth;
        let (f1, f2) = self.fire;

        quote! { Damage {
            neutral: ElementDamage {
                min: #n1,
                max: #n2,
            },
            air: ElementDamage {
                min: #a1,
                max: #a2,
            },
            water: ElementDamage {
                min: #w1,
                max: #w2,
            },
            earth: ElementDamage {
                min: #e1,
                max: #e2,
            },
            fire: ElementDamage {
                min: #f1,
                max: #f2,
            },
        } }
        .to_tokens(tokens);
    }
}

fn get_effect(effect: &[DofusLabEffectElement]) -> Damage {
    let mut damage = Damage::default();
    effect.iter().for_each(|x| {
        let idx = match x.stat.as_str() {
            "Neutral damage" | "Neutral steal" => &mut damage.neutral,
            "Air damage" | "Air steal" => &mut damage.air,
            "Water damage" | "Water steal" => &mut damage.water,
            "Earth damage" | "Earth steal" => &mut damage.earth,
            "Fire damage" | "Fire steal" => &mut damage.fire,
            _ => return,
        };
        *idx = (x.min_stat.unwrap_or(x.max_stat.0), x.max_stat.0);
    });

    damage
}

fn quote_option<T>(a: Option<T>) -> TokenStream
where
    T: ToTokens,
{
    match a {
        Some(a) => quote! {Some(#a)},
        None => quote! {None},
    }
}

fn create_spells() -> TokenStream {
    let spells: Vec<DofusLabSpellClass> =
        serde_json::from_slice(include_bytes!("data/spells.json")).unwrap();

    let all = spells.iter().map(|x| {
        let spells = x.spells.iter().flatten().map(|x| {
            let name = &x.name;
            let description = &x.description;
            let image_url = &x.image_url;
            let effects = x.effects.iter().map(|x| {
                let base_crit = quote_option(x.base_crit_rate.map(|StringI32(x)| x));
                let level = x.level.0;

                let normal = quote_option(
                    x.normal_effects
                        .modifiable_effect
                        .as_deref()
                        .map(get_effect),
                );
                let critical = quote_option(
                    x.critical_effects
                        .modifiable_effect
                        .as_deref()
                        .map(get_effect),
                );

                quote! {
                    Effect {
                        level: #level,
                        base_crit: #base_crit,
                        normal: #normal,
                        critical: #critical,
                    }
                }
            });

            quote! { Spell {
                name: #name,
                description: #description,
                image_url: #image_url,
                effects: &[#(#effects),*],
            }}
        });
        let name = &x.names;

        quote! {
            Class {
                name: #name,
                spells: &[#(#spells),*]
            }
        }
    });

    quote! {  &[#(#all),*] }
}

fn main() -> Result<(), Box<dyn Error>> {
    let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR environment variable must be specified");

    let items = create_items();
    let spells = create_spells();

    let output_file = File::create(format!("{out_dir}/compiled_items.rs"))?;
    let mut writer = BufWriter::new(output_file);
    writeln!(writer, "{}", items)?;

    let output_file = File::create(format!("{out_dir}/compiled_spells.rs"))?;
    let mut writer = BufWriter::new(output_file);
    writeln!(writer, "{}", spells)?;

    Ok(())
}
