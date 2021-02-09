#![deny(clippy::all)]
use ::dofus_set::config;
use ::dofus_set::dofus_set;
use ::dofus_set::items;
use serde::{Deserialize, Serialize};
use simple_logger::SimpleLogger;
use std::convert::Infallible;
use warp::http::header::{HeaderMap, HeaderValue};
use warp::Filter;

use std::time::Instant;

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
        multi_element: false,
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

async fn create_optimised_set_async(
    semaphore: std::sync::Arc<tokio::sync::Semaphore>,
    config: OptimiseRequest,
) -> Result<impl warp::Reply, Infallible> {
    let _permit = semaphore.acquire().await.unwrap();
    let optimal = tokio::task::spawn_blocking(|| {
        let now = Instant::now();
        let optimum = create_optimised_set(config);
        log::info!(
            "Took {}ms to complete optimisation",
            now.elapsed().as_millis()
        );
        optimum
    })
    .await
    .unwrap();
    Ok(warp::reply::json(&optimal))
}

#[tokio::main]
async fn main() {
    SimpleLogger::new()
        .with_level(log::LevelFilter::Info)
        .init()
        .unwrap();

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse()
        .unwrap();
    let address = [0, 0, 0, 0];

    let optimiser_semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(num_cpus::get()));

    let optimise = warp::post()
        .and(warp::path("optimise"))
        .and(warp::any().map(move || optimiser_semaphore.clone()))
        .and(warp::body::json())
        .and_then(create_optimised_set_async);
    let optimise_options = warp::options()
        .and(warp::path("optimise"))
        .map(|| Ok(warp::http::StatusCode::NO_CONTENT));
    let item = warp::get()
        .and(warp::path!("item" / usize))
        .map(|slot: usize| Ok(warp::reply::json(&get_item_list_index(slot))));

    let mut access_control_headers = HeaderMap::new();
    access_control_headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));
    access_control_headers.insert(
        "Access-Control-Allow-Headers",
        HeaderValue::from_static("Content-Type"),
    );

    let static_files = warp::fs::dir("web/build");
    let api = warp::path("api")
        .and(optimise_options.or(optimise).or(item))
        .with(warp::reply::with::headers(access_control_headers));

    let routes = warp::any().and(api.or(static_files));

    warp::serve(routes).run((address, port)).await;
}
