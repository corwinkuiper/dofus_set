use std::sync::OnceLock;

use dofus_set::items::Items;
use wasm_bindgen::prelude::*;

mod benchmark;

fn get_items() -> &'static Items {
    static ITEMS: OnceLock<Items> = OnceLock::new();
    ITEMS.get_or_init(Items::new)
}

#[wasm_bindgen]
pub fn setup() {
    get_items();
}

#[wasm_bindgen]
pub fn benchmark() -> f64 {
    benchmark::bench(get_items())
}
