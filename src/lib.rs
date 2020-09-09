extern crate wasm_bindgen;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

mod anneal;
mod config;
mod items;
mod set_build;
mod stats;

#[macro_use]
extern crate lazy_static;

#[wasm_bindgen]
pub fn fit(level: i32, weights: &wasm_bindgen::JsValue) -> wasm_bindgen::JsValue {
    let weights: HashMap<String, f64> = weights.into_serde().unwrap();
    let weights: [f64; 51] = {
        let mut characteristic_weights = [0.0; 51];
        for (stat, value) in weights
            .iter()
            .map(|(key, value)| stats::stat_from_str(key).map(|stat| (stat, value)))
            .filter_map(|x| x)
        {
            characteristic_weights[stat as usize] = *value;
        }
        characteristic_weights
    };

    let config = config::Config {
        max_level: level,
        weights: weights,
        changable: (0..16).collect(),
    };

    let optimiser = set_build::Optimiser { config: &config };
    let final_state = optimiser.optimise();

    let item_names: Vec<String> = final_state.set().map(|item| item.name.clone()).collect();
    wasm_bindgen::JsValue::from_serde(&item_names).unwrap()
}
