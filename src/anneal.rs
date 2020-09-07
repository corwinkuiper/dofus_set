pub trait Anneal<T> {
    fn accept_probability(energy_current: f64, energy_neighbour: f64, temperature: f64) -> f64 {
        if energy_neighbour < energy_current {
            1.0
        } else {
            core::f64::consts::E.powf(-(energy_neighbour - energy_current) / temperature)
        }
    }

    fn random() -> f64;

    fn temperature(iteration: f64, energy: f64) -> f64;
    fn energy(state: &T) -> f64;
    fn neighbour(state: &T) -> T;

    fn execute(num_iterations: i64, initial_state: T) -> T {
        let number_of_iterations = num_iterations as f64;
        let mut current_state = initial_state;
        let mut current_state_energy = Self::energy(&current_state);
        for iteration in 0..num_iterations {
            let iteration = iteration as f64;
            let temperature = Self::temperature(
                (iteration + 1.0) / number_of_iterations,
                current_state_energy,
            );
            let neighbour = Self::neighbour(&current_state);
            let neighbour_energy = Self::energy(&neighbour);
            let acceptance_rate =
                Self::accept_probability(current_state_energy, neighbour_energy, temperature);
            if acceptance_rate >= Self::random() {
                current_state = neighbour;
                current_state_energy = neighbour_energy;
            }
        }

        current_state
    }
}
