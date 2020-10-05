#![deny(clippy::all)]

use ::dofus_set::config;
use ::dofus_set::dofus_set;
use ::dofus_set::items;

use rouille::{Request, Response};
use serde::{Deserialize, Serialize};

use std::time::Duration;

#[macro_use]
extern crate rouille;

mod rate_limit;
mod static_files;

use rate_limit::RateLimiter;

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

fn item_list(items: &[usize]) -> Vec<OptimiseResponseItem> {
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
        .collect()
}

// GET /item/slot/<slot>
fn get_item_list_index(slot: usize) -> Option<Vec<OptimiseResponseItem>> {
    if slot >= 16 {
        return None;
    }
    Some(item_list(dofus_set::item_type_to_item_list(
        dofus_set::slot_index_to_item_type(slot),
    )))
}

// POST /optimise
fn create_optimised_set(config: OptimiseRequest) -> Option<OptimiseResponse> {
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

    Some(OptimiseResponse {
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
    })
}

fn handle_api_request(request: Request, rate_limiter: &RateLimiter) -> Response {
    router!(request,
        (POST) (/optimise) => {
            rate_limiter.rate_limit(&request, |request|
                Response::json(&create_optimised_set(try_or_400!(
                    rouille::input::json_input(request)
                )))
            )
        },
        (OPTIONS) (/optimise) => {
            Response::empty_204()
        },
        (GET) (/item/slot/{slot: usize}) => {
            Response::json(&get_item_list_index(slot))
        },
        _ => {
            Response::empty_404()
        }
    )
}

fn add_access_control_headers(response: Response) -> Response {
    response
        .with_additional_header("Access-Control-Allow-Origin", "*")
        .with_additional_header("Access-Control-Allow-Headers", "Content-Type")
}

fn main() {
    let rate_limiter = RateLimiter::new(num_cpus::get(), Duration::from_secs(2));

    let port = std::env::var("PORT").unwrap_or_else(|_| "8000".to_string());

    rouille::start_server_with_pool(format!("{}:{}", "0.0.0.0", port), Some(num_cpus::get() * 2), move |request| {
        let response = static_files::static_file(request);
        if response.is_success() {
            return add_access_control_headers(response);
        }

        if let Some(request) = request.remove_prefix("/api") {
            add_access_control_headers(handle_api_request(request, &rate_limiter))
        } else {
            Response::empty_404()
        }
    })
}
