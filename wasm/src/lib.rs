use dofus_items::ITEMS;
use dofus_set::dofus_set::OptimiseError;
use query::OptimiseRequest;
use thiserror::Error;
use wasm_bindgen::prelude::*;

mod benchmark;
mod query;

#[wasm_bindgen]
pub fn setup() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn benchmark() -> f64 {
    benchmark::bench(&ITEMS)
}

#[derive(Error, Debug)]
pub enum QueryError {
    #[error("Optimisation failed: {0}")]
    Optimise(#[from] OptimiseError),
    #[error("Could not parse query, {0}")]
    Decode(#[from] serde_wasm_bindgen::Error),
}

impl From<QueryError> for JsValue {
    fn from(value: QueryError) -> Self {
        JsValue::from_str(&value.to_string())
    }
}

#[wasm_bindgen]
pub fn query(request: JsValue) -> Result<JsValue, QueryError> {
    let request: OptimiseRequest = serde_wasm_bindgen::from_value(request)?;
    let response = query::create_optimised_set(&request, &ITEMS)?;

    Ok(serde_wasm_bindgen::to_value(&response)?)
}

#[derive(Error, Debug)]
pub enum ItemsSlotError {
    #[error("Requested slot is out of range")]
    SlotOutOfRange,
}

impl From<ItemsSlotError> for JsValue {
    fn from(value: ItemsSlotError) -> Self {
        JsValue::from_str(&value.to_string())
    }
}

#[wasm_bindgen]
pub fn items_in_slot(slot: usize) -> Result<JsValue, ItemsSlotError> {
    let response =
        query::get_item_list_index(slot, &ITEMS).ok_or(ItemsSlotError::SlotOutOfRange)?;

    Ok(serde_wasm_bindgen::to_value(&response).expect("Known format"))
}
