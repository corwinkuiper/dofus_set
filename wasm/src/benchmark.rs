use dofus_characteristics::Stat;
use dofus_items::Items;
use dofus_set::config;
use dofus_set::dofus_set::Optimiser;

pub fn bench(items: &Items) -> f64 {
    let mut weights = [0.0; 51];
    weights[Stat::Power as usize] = 1.0;
    weights[Stat::Strength as usize] = 1.0;
    weights[Stat::AP as usize] = 400.0;
    weights[Stat::MP as usize] = 300.0;
    weights[Stat::Range as usize] = 5.0;

    let config = config::Config {
        max_level: 148,
        weights,
        targets: [None; 51],
        changable: (1..16).collect(),
        ban_list: Vec::new(),
        exo_ap: false,
        exo_mp: false,
        exo_range: false,
        multi_element: false,
    };

    let initial_set: [Option<_>; 16] = [None; 16];

    let optimiser = Optimiser::new(&config, initial_set, items).unwrap();

    let final_state = optimiser.optimise().unwrap();
    let sets = final_state.sets(items);

    -final_state.energy(&config, &sets)
}
