pub trait Anneal<T> {
    type Error;

    fn accept_probability(energy_current: f64, energy_neighbour: f64, temperature: f64) -> f64 {
        if energy_neighbour < energy_current {
            1.0
        } else {
            core::f64::consts::E.powf(-(energy_neighbour - energy_current) / temperature)
        }
    }

    fn random(&self) -> f64;

    fn temperature(&self, iteration: f64, energy: f64) -> f64;
    fn neighbour(&self, state: &T) -> Result<(T, f64), Self::Error>;

    fn optimise(&self, initial_state: (T, f64), num_iterations: i64) -> Result<T, Self::Error> {
        let number_of_iterations = num_iterations as f64;
        let mut current_state = initial_state.0;
        let mut current_state_energy = initial_state.1;
        for iteration in 0..num_iterations {
            let iteration = iteration as f64;
            let temperature = self.temperature(
                (iteration + 1.0) / number_of_iterations,
                current_state_energy,
            );
            let (neighbour, neighbour_energy) = self.neighbour(&current_state)?;
            let acceptance_rate =
                Self::accept_probability(current_state_energy, neighbour_energy, temperature);
            if acceptance_rate >= self.random() {
                current_state = neighbour;
                current_state_energy = neighbour_energy;
            }
        }

        Ok(current_state)
    }
}
