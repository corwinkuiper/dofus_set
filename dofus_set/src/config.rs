use dofus_items::{ItemIndex, NicheItemIndex};

pub struct Config {
    pub max_level: i32,
    pub weights: [f64; 51],
    pub targets: [Option<i32>; 51],
    pub changable: Vec<usize>,
    pub ban_list: Vec<ItemIndex>,
    pub exo_ap: bool,
    pub exo_mp: bool,
    pub exo_range: bool,
    pub multi_element: bool,
    pub initial_set: [NicheItemIndex; 16],
    pub changed_item_weight: f64,
    pub damaging_moves: Vec<DamagingMovesOptimisation>,
}

pub struct DamagingMovesOptimisation {
    pub weight: f64,
    pub damage: DamagingMove,
}

pub struct DamagingMove {
    /// (min + max) / 2
    pub elemental_damage: [f64; 5],
    pub crit_elemental_damage: [f64; 5],
    pub base_crit_ratio: i32,
    pub modifyable_crit: bool,
}
