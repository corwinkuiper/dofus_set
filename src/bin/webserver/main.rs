#![feature(proc_macro_hygiene, decl_macro)]
#![deny(clippy::all)]
#![allow(clippy::unit_arg)] // because create_optimised_set_options had an error

use ::dofus_set::config;
use ::dofus_set::dofus_set;
use ::dofus_set::items;

use serde::{Deserialize, Serialize};

#[macro_use]
extern crate rocket;

use rocket_contrib::json::Json;
use rocket_contrib::serve::StaticFiles;

use rocket::fairing;

#[derive(Deserialize)]
struct OptimiseRequest {
    weights: Vec<f64>,
    max_level: i32,
    fixed_items: Vec<Option<i32>>,
    banned_items: Vec<i32>,
    exo_ap: bool,
    exo_mp: bool,
    exo_range: bool,
}

#[derive(Serialize)]
struct OptimiseResponseSetBonus {
    name: String,
    number_of_items: i32,
    characteristics: Vec<i32>,
}

#[derive(Serialize)]
struct OptimiseResponseItem {
    dofus_id: i32,
    characteristics: Vec<i32>,
    name: String,
    item_type: String,
    level: i32,
    image_url: Option<String>,
}

#[derive(Serialize)]
struct OptimiseResponse {
    overall_characteristics: Vec<i32>,
    items: Vec<Option<OptimiseResponseItem>>,
    set_bonuses: Vec<OptimiseResponseSetBonus>,
}

fn item_list(items: &[usize]) -> Json<Vec<OptimiseResponseItem>> {
    Json(
        items
            .iter()
            .map(|x| &items::ITEMS[*x])
            .map(|x| OptimiseResponseItem {
                dofus_id: x.dofus_id,
                characteristics: x.stats.to_vec(),
                name: x.name.clone(),
                item_type: x.item_type.clone(),
                level: x.level,
                image_url: x.image_url.clone(),
            })
            .collect(),
    )
}

#[get("/item/type/<item>")]
fn get_item_list(item: String) -> Option<Json<Vec<OptimiseResponseItem>>> {
    let item = item.as_str();
    Some(match item {
        "hats" => item_list(&items::HATS),
        "cloaks" => item_list(&items::CLOAKS),
        "amulets" => item_list(&items::AMULETS),
        "rings" => item_list(&items::RINGS),
        "belts" => item_list(&items::BELTS),
        "boots" => item_list(&items::BOOTS),
        "weapons" => item_list(&items::WEAPONS),
        "shields" => item_list(&items::SHIELDS),
        "dofus" => item_list(&items::DOFUS),
        "mounts" => item_list(&items::MOUNTS),
        _ => return None,
    })
}

#[get("/item/slot/<slot>")]
fn get_item_list_index(slot: usize) -> Option<Json<Vec<OptimiseResponseItem>>> {
    if slot >= 16 {
        return None;
    }
    Some(item_list(dofus_set::item_type_to_item_list(
        dofus_set::slot_index_to_item_type(slot),
    )))
}

#[options("/optimise")]
fn create_optimised_set_options() {}

#[post("/optimise", data = "<config>")]
fn create_optimised_set(config: Json<OptimiseRequest>) -> Option<Json<OptimiseResponse>> {
    if config.weights.len() != 51 {
        return None;
    }

    let mut weights = [0.0f64; 51];
    weights[..51].clone_from_slice(&config.weights[..51]);

    let mut fixed_items = [None; 16];
    fixed_items[..16].clone_from_slice(&config.fixed_items[..16]);

    let dofus_set_config = config::Config {
        max_level: config.max_level,
        weights,
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
    };

    let optimiser = dofus_set::Optimiser::new(&dofus_set_config, fixed_items).unwrap();

    let final_state = optimiser.optimise();

    let set_bonuses = final_state
        .sets()
        .map(|set| OptimiseResponseSetBonus {
            name: set.name.clone(),
            number_of_items: set.number_of_items,
            characteristics: set.bonus.to_vec(),
        })
        .collect();

    Some(Json(OptimiseResponse {
        overall_characteristics: final_state.stats(&dofus_set_config).to_vec(),
        items: final_state
            .set()
            .map(|item| {
                item.map(|item| OptimiseResponseItem {
                    dofus_id: item.dofus_id,
                    characteristics: item.stats.to_vec(),
                    name: item.name.clone(),
                    item_type: item.item_type.clone(),
                    level: item.level,
                    image_url: item.image_url.clone(),
                })
            })
            .collect(),
        set_bonuses,
    }))
}

fn main() {
    rocket::ignite()
        .attach(fairing::AdHoc::on_response(
            "Add CORS headers",
            |_: &rocket::Request, response: &mut rocket::Response| {
                response.adjoin_raw_header("Access-Control-Allow-Origin", "*");
                response.adjoin_raw_header("Access-Control-Allow-Headers", "Content-Type");
            },
        ))
        .mount(
            "/api",
            routes![
                create_optimised_set,
                create_optimised_set_options,
                get_item_list,
                get_item_list_index
            ],
        )
        .mount(
            "/",
            StaticFiles::from(concat!(env!("CARGO_MANIFEST_DIR"), "/web/build")),
        )
        .launch();
}
