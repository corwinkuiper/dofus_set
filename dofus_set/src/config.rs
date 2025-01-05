use dofus_items::ItemIndex;

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
    pub initial_temperature: f64,
}
