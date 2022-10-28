#![deny(clippy::all)]
use ::dofus_set::config;
use ::dofus_set::dofus_set;
use ::dofus_set::dofus_set::OptimiseError;
use ::dofus_set::items::ItemIndex;
use ::dofus_set::items::Items;
use serde::{Deserialize, Serialize};
use std::error::Error;

use std::fs::File;
use std::sync::Condvar;
use std::sync::Mutex;

#[derive(Deserialize, Debug)]
struct OptimiseRequest {
    weights: Vec<f64>,
    max_level: i32,
    fixed_items: Vec<Option<ItemIndex>>,
    banned_items: Vec<ItemIndex>,
    exo_ap: bool,
    exo_mp: bool,
    exo_range: bool,
    multi_element: bool,
}

#[derive(Serialize, Debug)]
struct OptimiseResponseSetBonus {
    name: String,
    number_of_items: i32,
    characteristics: Vec<i32>,
}

#[derive(Serialize, Debug)]
struct OptimiseResponseItem {
    dofus_id: ItemIndex,
    characteristics: Vec<i32>,
    name: String,
    item_type: String,
    level: i32,
    image_url: Option<String>,
}

#[derive(Serialize, Debug)]
struct OptimiseResponse {
    overall_characteristics: Vec<i32>,
    items: Vec<Option<OptimiseResponseItem>>,
    set_bonuses: Vec<OptimiseResponseSetBonus>,
}

fn item_list(list: &[ItemIndex], items: &Items) -> Vec<OptimiseResponseItem> {
    list.iter()
        .map(|x| (x, &items[*x]))
        .map(|(id, x)| OptimiseResponseItem {
            dofus_id: *id,
            characteristics: x.stats.to_vec(),
            name: x.name.clone(),
            item_type: x.item_type.clone(),
            level: x.level,
            image_url: x.image_url.clone(),
        })
        .collect()
}

// GET /item/slot/<slot>
fn get_item_list_index(slot: usize, items: &Items) -> Option<Vec<OptimiseResponseItem>> {
    if slot >= 16 {
        return None;
    }

    let item_type = dofus_set::slot_index_to_item_type(slot);

    Some(item_list(&items[item_type], items))
}

// POST /optimise
fn create_optimised_set(
    config: &OptimiseRequest,
    items: &Items,
) -> Result<OptimiseResponse, OptimiseError> {
    if config.weights.len() != 51 {
        return Err(OptimiseError::InvalidState);
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
        multi_element: config.multi_element,
    };

    let optimiser = dofus_set::Optimiser::new(&dofus_set_config, fixed_items, items)?;

    let final_state = optimiser.optimise()?;

    let set_bonuses = final_state
        .sets(items)
        .map(|set| OptimiseResponseSetBonus {
            name: set.name.clone(),
            number_of_items: set.number_of_items,
            characteristics: set.bonus.to_vec(),
        })
        .collect();

    Ok(OptimiseResponse {
        overall_characteristics: final_state.stats(&dofus_set_config, items).to_vec(),
        items: final_state
            .set()
            .map(|idx| {
                idx.map(|idx| {
                    let item = &items[idx];
                    OptimiseResponseItem {
                        dofus_id: idx,
                        characteristics: item.stats.to_vec(),
                        name: item.name.clone(),
                        item_type: item.item_type.clone(),
                        level: item.level,
                        image_url: item.image_url.clone(),
                    }
                })
            })
            .collect(),
        set_bonuses,
    })
}

fn main() -> Result<(), Box<dyn Error>> {
    simple_logger::SimpleLogger::new().env().init().unwrap();

    let items = Items::new();

    let port: String = std::env::var("PORT")
        .unwrap_or_else(|_| "8000".to_string())
        .parse()
        .unwrap();

    let avail = match std::thread::available_parallelism() {
        Ok(avail) => {
            let a = (avail.get() - 1).max(1);
            log::info!(
                "Parallelism available is {}, therefore limiting concurrent optimisations to {}",
                avail.get(),
                a
            );
            a
        }
        Err(e) => {
            log::error!(
                "Could not get available parallelism: {}. Will limit to a single thread",
                e
            );
            1
        }
    };

    let sem = Semaphore::new(avail);

    rouille::start_server(format!("0.0.0.0:{}", port), move |request| {
        let log_ok =
            |req: &rouille::Request, resp: &rouille::Response, elap: std::time::Duration| {
                log::info!(
                    "{} {} {} - {}s",
                    resp.status_code,
                    req.method(),
                    req.raw_url(),
                    elap.as_secs_f64()
                );
            };
        let log_err = |req: &rouille::Request, _elap: std::time::Duration| {
            log::error!("Handler panicked: {} {}", req.method(), req.raw_url());
        };
        rouille::log_custom(request, log_ok, log_err, || {
            rouille::router!(request,
                (GET) (/api/item/slot/{id: usize}) => {
                    rouille::Response::json(&get_item_list_index(id, &items))
                },
                (POST) (/api/optimise) => {
                    let query = rouille::try_or_400!(rouille::input::json_input(request));
                    let optimise = sem.execute(|| {
                        let now = std::time::Instant::now();
                        let opt = create_optimised_set(&query, &items);
                        let elapsed = now.elapsed();
                        log::info!("Optimisation took {}ms", elapsed.as_millis());
                        opt
                    });
                    match &optimise {
                        Ok(result) => rouille::Response::json(result),
                        Err(error) => {
                            log::error!("Error optimising with: {}. Given query: {:?}", error, &query);
                            rouille::Response::text(format!("{}", error)).with_status_code(400)
                        }
                    }
                },
                (GET) (/) => {
                    rouille::Response::from_file(rouille::extension_to_mime("html"), File::open("./web/build/index.html").unwrap())
                },
                _ => {
                    rouille::match_assets(request, "./web/build")
                }
            )
        })
    });
}

struct Semaphore {
    mutex: Mutex<usize>,
    cond: Condvar,
}

impl Semaphore {
    fn new(max_count: usize) -> Self {
        Semaphore {
            mutex: Mutex::new(max_count),
            cond: Condvar::new(),
        }
    }

    fn execute<F, R>(&self, f: F) -> R
    where
        F: Fn() -> R,
    {
        {
            let mut inner = self.mutex.lock().unwrap();
            while *inner == 0 {
                inner = self.cond.wait(inner).unwrap();
            }
            *inner -= 1;
        }

        let r = f();

        *self.mutex.lock().unwrap() += 1;

        self.cond.notify_one();
        r
    }
}
