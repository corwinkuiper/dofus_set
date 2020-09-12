#![feature(proc_macro_hygiene, decl_macro)]
#![deny(clippy::all)]

use ::dofus_set::config;
use ::dofus_set::dofus_set;

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
}

#[derive(Serialize)]
struct OptimiseResponseItem {
    characteristics: Vec<i32>,
    name: String,
    item_type: String,
    level: i32,
    image_url: Option<String>,
}

#[derive(Serialize)]
struct OptimiseResponse {
    overall_characteristics: Vec<i32>,
    items: Vec<OptimiseResponseItem>,
}

#[options("/optimise")]
fn create_optimised_set_options() {}

#[post("/optimise", data = "<config>")]
fn create_optimised_set(config: Json<OptimiseRequest>) -> Option<Json<OptimiseResponse>> {
    if config.weights.len() != 51 {
        return None;
    }

    let mut weights = [0.0f64; 51];
    for i in 0..51 {
        weights[i] = config.weights[i];
    }

    let dofus_set_config = config::Config {
        max_level: config.max_level,
        weights: weights,
        changable: (0..16).collect(),
        ban_list: Vec::new(),
    };

    let optimiser = dofus_set::Optimiser {
        config: &dofus_set_config,
    };

    let final_state = optimiser.optimise();

    Some(Json(OptimiseResponse {
        overall_characteristics: final_state.stats(config.max_level).to_vec(),
        items: final_state
            .set()
            .map(|item| OptimiseResponseItem {
                characteristics: item.stats.to_vec(),
                name: item.name.clone(),
                item_type: item.item_type.clone(),
                level: item.level,
                image_url: item.image_url.clone(),
            })
            .collect(),
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
            routes![create_optimised_set, create_optimised_set_options],
        )
        .mount(
            "/",
            StaticFiles::from(concat!(env!("CARGO_MANIFEST_DIR"), "/web/build")),
        )
        .launch();
}
