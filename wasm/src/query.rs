use dofus_characteristics::Characteristic;
use dofus_items::{ItemIndex, Items};
use dofus_set::{config::Config, dofus_set::OptimiseError};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct OptimiseRequest {
    weights: Vec<f64>,
    max_level: i32,
    fixed_items: Vec<Option<ItemIndex>>,
    banned_items: Vec<ItemIndex>,
    exo_ap: bool,
    exo_mp: bool,
    exo_range: bool,
    multi_element: bool,
    iterations: i64,
}

#[derive(Serialize, Debug)]
struct OptimiseResponseSetBonus {
    name: &'static str,
    number_of_items: i32,
    characteristics: Characteristic,
}

#[derive(Serialize, Debug)]
pub struct OptimiseResponseItem {
    dofus_id: ItemIndex,
    characteristics: Characteristic,
    name: &'static str,
    item_type: &'static str,
    level: i32,
    image_url: &'static str,
}

#[derive(Serialize, Debug)]
pub struct OptimiseResponse {
    energy: f64,
    overall_characteristics: Characteristic,
    items: Vec<Option<OptimiseResponseItem>>,
    set_bonuses: Vec<OptimiseResponseSetBonus>,
}

fn item_list(list: &[ItemIndex], items: &Items) -> Vec<OptimiseResponseItem> {
    list.iter()
        .map(|x| (x, &items[*x]))
        .map(|(id, x)| OptimiseResponseItem {
            dofus_id: *id,
            characteristics: x.stats.clone(),
            name: x.name,
            item_type: x.item_type,
            level: x.level,
            image_url: x.image_url,
        })
        .collect()
}

pub fn get_item_list_index(slot: usize, items: &Items) -> Option<Vec<OptimiseResponseItem>> {
    if slot >= 16 {
        return None;
    }

    let item_type = dofus_set::dofus_set::slot_index_to_item_type(slot);

    Some(item_list(&items[item_type], items))
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

    let mut fixed_items = [None; 16];
    fixed_items[..16].clone_from_slice(&config.fixed_items[..16]);

    let dofus_set_config = Config {
        max_level: config.max_level,
        weights,
        targets: [None; 51],
        changable: fixed_items
            .iter()
            .enumerate()
            .filter_map(|(index, item)| match item {
                None => Some(index),
                _ => None,
            })
            .collect(),
        ban_list: config.banned_items.clone(),
        exo_ap: config.exo_ap,
        exo_mp: config.exo_mp,
        exo_range: config.exo_range,
        multi_element: config.multi_element,
    };

    let optimiser = dofus_set::dofus_set::Optimiser::new(&dofus_set_config, fixed_items, items)?;

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

    Ok(OptimiseResponse {
        energy: -final_state.energy(&dofus_set_config, items, &sets),
        overall_characteristics: final_state.stats(&dofus_set_config, &sets).clone(),
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
    })
}