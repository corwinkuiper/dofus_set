use super::*;

pub const ITEMS: Items = include!(concat!(env!("OUT_DIR"), "/compiled_items.rs"));
pub const SPELLS: &[Class] = include!(concat!(env!("OUT_DIR"), "/compiled_spells.rs"));
