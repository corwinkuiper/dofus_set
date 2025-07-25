use dofus_characteristics::Characteristic;
use dofus_items::{Item, ItemIndex, Items, NicheItemIndex};
use dofus_set::{
    config::{Config, DamagingMove, DamagingMovesOptimisation},
    dofus_set::OptimiseError,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OptimiseRequest {
    weights: Vec<f64>,
    targets: Vec<Option<i32>>,
    max_level: i32,
    initial_items: Vec<Option<ItemIndex>>,
    fixed_items: Vec<usize>,
    banned_items: Vec<ItemIndex>,
    ap_exo: bool,
    mp_exo: bool,
    range_exo: bool,
    multi_element: bool,
    changed_item_weight: f64,
    damaging_moves_weights: Vec<DamagingMovesWeight>,
    iterations: i64,
    initial_temperature: f64,
    consider_characteristics: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct DamagingMovesWeight {
    weight: f64,
    base_damage: [f64; 5],
    base_crit_damage: [f64; 5],
    base_crit_percent: i32,
    crit_modifyable: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct OptimiseResponseSetBonus {
    name: &'static str,
    number_of_items: i32,
    characteristics: Characteristic,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OptimiseResponseItem {
    dofus_id: ItemIndex,
    characteristics: Characteristic,
    name: &'static str,
    item_type: &'static str,
    level: i32,
    image_url: &'static str,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OptimiseResponse {
    energy: f64,
    overall_characteristics: Characteristic,
    items: Vec<Option<OptimiseResponseItem>>,
    set_bonuses: Vec<OptimiseResponseSetBonus>,
    valid: bool,
    characteristics: Vec<i32>,
}

fn make_optimise_response(id: ItemIndex, item: &Item) -> OptimiseResponseItem {
    OptimiseResponseItem {
        dofus_id: id,
        characteristics: item.stats.clone(),
        name: item.name,
        item_type: item.item_type,
        level: item.level,
        image_url: item.image_url,
    }
}

fn item_list(list: &[ItemIndex], items: &Items) -> Vec<OptimiseResponseItem> {
    list.iter()
        .map(|&x| (x, &items[x]))
        .map(|(a, b)| make_optimise_response(a, b))
        .collect()
}

pub fn get_item_list_index(slot: usize, items: &Items) -> Option<Vec<OptimiseResponseItem>> {
    if slot >= 16 {
        return None;
    }

    let item_type = dofus_set::dofus_set::slot_index_to_item_type(slot);

    Some(item_list(&items[item_type], items))
}

pub fn get_all_items(items: &Items) -> Vec<OptimiseResponseItem> {
    items
        .iter()
        .map(|(a, b)| make_optimise_response(a, b))
        .collect()
}

pub fn create_optimised_set(
    config: &OptimiseRequest,
    items: &'static Items,
) -> Result<OptimiseResponse, OptimiseError> {
    if config.weights.len() != 51 {
        return Err(OptimiseError::InvalidState);
    }

    let mut weights: [f64; 51] = [0.0f64; 51];
    weights[..51].clone_from_slice(&config.weights[..51]);

    let mut targets: [Option<i32>; 51] = [None; 51];
    targets[..].clone_from_slice(&config.targets);

    let changable = (0..16)
        .filter(|x| !config.fixed_items.contains(x))
        .collect();

    let dofus_set_config = Config {
        max_level: config.max_level,
        weights,
        targets,
        changable,
        ban_list: config.banned_items.clone(),
        exo_ap: config.ap_exo,
        exo_mp: config.mp_exo,
        exo_range: config.range_exo,
        multi_element: config.multi_element,
        initial_set: config
            .initial_items
            .iter()
            .copied()
            .map(NicheItemIndex::new)
            .collect::<Vec<_>>()
            .try_into()
            .expect(
                "should be able to make 16 length initial items from provided initial items list",
            ),
        changed_item_weight: config.changed_item_weight,
        damaging_moves: config
            .damaging_moves_weights
            .iter()
            .map(|x| DamagingMovesOptimisation {
                weight: x.weight,
                damage: DamagingMove {
                    elemental_damage: x.base_damage,
                    crit_elemental_damage: x.base_crit_damage,
                    base_crit_ratio: x.base_crit_percent,
                    modifyable_crit: x.crit_modifyable,
                },
            })
            .collect(),
        consider_characteristics: config.consider_characteristics,
    };

    let optimiser =
        dofus_set::dofus_set::Optimiser::new(&dofus_set_config, config.initial_temperature, items)?;

    let final_state = optimiser.optimise(config.iterations)?;

    let sets = final_state.sets(items);

    let set_bonuses = sets
        .iter()
        .map(|set| OptimiseResponseSetBonus {
            name: set.name,
            number_of_items: set.number_of_items,
            characteristics: set.bonus.clone(),
        })
        .collect();

    let stats = final_state.stats(&dofus_set_config, &sets);

    Ok(OptimiseResponse {
        energy: -final_state.energy(&dofus_set_config, items, &sets),
        valid: final_state.is_valid(&dofus_set_config, &stats, items, &sets),
        overall_characteristics: stats,
        items: final_state
            .set()
            .map(|idx| {
                idx.map(|idx| {
                    let item = &items[idx];
                    OptimiseResponseItem {
                        dofus_id: idx,
                        characteristics: item.stats.clone(),
                        name: item.name,
                        item_type: item.item_type,
                        level: item.level,
                        image_url: item.image_url,
                    }
                })
            })
            .collect(),
        set_bonuses,
        characteristics: final_state.points().to_vec(),
    })
}
