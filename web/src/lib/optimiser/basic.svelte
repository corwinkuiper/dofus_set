<script>
  import Section from "$lib/component/section.svelte";
  import { getStatIndexForName } from "$lib/dofus/stat-names";
  import { dofusState } from "./state.svelte";
</script>

<Section title="Basic" open>
  <label>
    AP <input
      type="number"
      step="any"
      bind:value={dofusState.basicStat[getStatIndexForName("AP")]}
    />
  </label>
  <label>
    MP <input
      type="number"
      step="any"
      bind:value={dofusState.basicStat[getStatIndexForName("MP")]}
    />
  </label>
  <label>
    Range <input
      type="number"
      step="any"
      bind:value={dofusState.basicStat[getStatIndexForName("Range")]}
    />
  </label>
  <label>
    Vitality <input
      type="number"
      step="any"
      bind:value={dofusState.basicStat[getStatIndexForName("Vitality")]}
    />
  </label>
</Section>
