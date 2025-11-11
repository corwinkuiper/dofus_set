<script lang="ts">
  import Section from "$lib/component/section.svelte";
  import { language } from "$lib/state/lang.svelte";
  import { dofusState, optimiserConfig } from "./state.svelte";
</script>

<Section title="Advanced">
  <div class="wrapper">
    <label>
      Number of iterations
      <input type="number" bind:value={optimiserConfig.numberOfIterations} />
    </label>
    <label>
      Initial temperature
      <input
        type="number"
        bind:value={optimiserConfig.initialTemperature}
        step="any"
      />
    </label>
    <label>
      Continuous optimisation
      <input type="checkbox" bind:checked={optimiserConfig.continuous} />
    </label>
    <label>
      Consider characteristics points
      <input
        type="checkbox"
        bind:checked={dofusState.considerCharacteristicPoints}
      />
    </label>
    <label>
      Language
      <select bind:value={language.lang}>
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </label>
  </div>
</Section>

<style>
  .wrapper {
    display: flex;
    gap: 16px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
