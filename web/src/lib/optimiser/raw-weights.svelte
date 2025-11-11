<script lang="ts">
  import Section from "$lib/component/section.svelte";
  import { StatNames } from "$lib/dofus/stat-names";
  import { dofusState } from "./state.svelte";

  let enabledWeights = $state(
    dofusState.basicStat.flatMap((x, idx) => (x != 0 ? [idx] : []))
  );

  let remainingStatNames = $derived(
    StatNames.map((x, idx) => [x, idx] as const).filter(
      (_, idx) => !enabledWeights.includes(idx)
    )
  );

  function addStat() {
    if (remainingStatNames.length > 0) {
      enabledWeights.push(remainingStatNames[0][1]);
    }
  }

  let addWeightEnabled = $derived(remainingStatNames.length > 0);
</script>

<Section title="Raw input">
  <div class="inputs">
    {#each enabledWeights as statIdx}
      <div class="input">
        <select>
          <option value={statIdx}>{StatNames[statIdx]}</option>
          {#each remainingStatNames as stat}
            <option value={stat[1]}>{stat[0]}</option>
          {/each}
        </select>
        <input
          type="number"
          bind:value={dofusState.basicStat[statIdx]}
          step="any"
        />
        {#if dofusState.targetStat[statIdx] !== undefined}
          <input type="number" bind:value={dofusState.targetStat[statIdx]} />
        {/if}
        <input
          type="checkbox"
          value={dofusState.targetStat[statIdx] !== undefined}
          oninput={(evt) => {
            dofusState.targetStat[statIdx] = (evt.target as HTMLInputElement)
              .checked
              ? 0
              : undefined;
          }}
        />
      </div>
    {/each}
  </div>
  <button type="button" onclick={addStat} disabled={!addWeightEnabled}
    >Add weight</button
  >
</Section>

<style>
  .inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(192px, 300px));
    gap: 16px;
  }

  .input {
    display: flex;
  }

  input[type="number"],
  select {
    min-width: 0;
  }
</style>
