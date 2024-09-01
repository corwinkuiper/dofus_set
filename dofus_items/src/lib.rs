use std::ops::Index;

use dofus_characteristics::*;
use serde::{Deserialize, Serialize};

#[derive(Debug)]
pub struct Item {
    pub name: &'static str,
    pub item_type: &'static str,
    pub stats: Characteristic,
    pub level: i32,
    pub set_id: Option<SetIndex>,
    pub restriction: &'static (dyn Restriction + Sync + Send),
    pub image_url: &'static str,
}

impl Index<ItemIndex> for Items {
    type Output = Item;

    fn index(&self, index: ItemIndex) -> &Self::Output {
        &self.items[index.0]
    }
}

impl Index<ItemType> for Items {
    type Output = [ItemIndex];

    fn index(&self, index: ItemType) -> &Self::Output {
        self.item_types[index as usize]
    }
}

impl Index<SetIndex> for Items {
    type Output = Set;

    fn index(&self, index: SetIndex) -> &Self::Output {
        &self.sets[index.0]
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct ItemIndex(usize);

#[derive(Debug, PartialEq, Eq, Clone, Copy, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct SetIndex(usize);

impl ItemIndex {
    pub fn new_from_id(id: usize) -> Self {
        ItemIndex(id)
    }
}

#[derive(Debug)]
pub struct Items {
    items: &'static [Item],
    sets: &'static [Set],
    item_types: &'static [&'static [ItemIndex]],
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ItemType {
    Mount,
    Weapon,
    Hat,
    Cloak,
    Amulet,
    Ring,
    Belt,
    Boot,
    Shield,
    Dofus,
}

impl From<usize> for ItemType {
    fn from(value: usize) -> Self {
        match value {
            0 => ItemType::Mount,
            1 => ItemType::Weapon,
            2 => ItemType::Hat,
            3 => ItemType::Cloak,
            4 => ItemType::Amulet,
            5 => ItemType::Ring,
            6 => ItemType::Belt,
            7 => ItemType::Boot,
            8 => ItemType::Shield,
            9 => ItemType::Dofus,
            _ => panic!("Not valid!!!!"),
        }
    }
}

#[derive(Debug)]
pub struct Set {
    pub name: &'static str,
    start_at: usize,
    bonuses: &'static [Characteristic],
}

impl Set {
    pub fn get(&self, number_of_items: usize) -> Option<&Characteristic> {
        let idx = self.start_at.checked_sub(number_of_items)?;

        Some(
            self.bonuses
                .get(idx)
                .unwrap_or_else(|| self.bonuses.last().unwrap()),
        )
    }
}

// pub static ITEMS: Items = Items {
//     items: &[],
//     sets: &[],
//     item_types: &[&[], &[], &[], &[], &[], &[], &[], &[], &[], &[]],
// };

pub static ITEMS: Items = include!(concat!(env!("OUT_DIR"), "/compiled_items.rs"));
