#![feature(proc_macro_hygiene, decl_macro)]

use ::dofus_set::config;
use ::dofus_set::dofus_set;

use serde::{Deserialize, Serialize};

#[macro_use]
extern crate rocket;

use rocket_contrib::json::Json;

#[derive(Deserialize)]
struct OptimiseRequest {
    weights: Vec<f64>,
    max_level: i32,
}

#[derive(Serialize)]
struct OptimiseResponse {
    characteristics: Vec<i32>,
}

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
    };

    let optimiser = dofus_set::Optimiser {
        config: &dofus_set_config,
    };

    let final_state = optimiser.optimise();

    Some(Json(OptimiseResponse {
        characteristics: final_state.stats(config.max_level).to_vec(),
    }))
}

fn main() {
    rocket::ignite()
        .mount("/", routes![create_optimised_set])
        .launch();
}
