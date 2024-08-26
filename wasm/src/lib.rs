use wasm_bindgen::prelude::*;

mod benchmark;

#[wasm_bindgen]
pub fn benchmark() -> f64 {
    benchmark::bench()
}
