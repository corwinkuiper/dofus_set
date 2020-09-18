pub struct Config {
    pub max_level: i32,
    pub weights: [f64; 51],
    pub changable: Vec<usize>,
    pub ban_list: Vec<i32>,
    pub exo_ap: bool,
    pub exo_mp: bool,
    pub exo_range: bool,
}
