use dofus_items::ITEMS;
use wasm_bindgen::prelude::*;

mod benchmark;

#[wasm_bindgen]
pub fn setup() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn benchmark() -> f64 {
    benchmark::bench(&ITEMS)
}
