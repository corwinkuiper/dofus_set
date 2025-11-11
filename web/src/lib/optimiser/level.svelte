<script lang="ts">
  import Section from "$lib/component/section.svelte";
  import { dofusState } from "./state.svelte";
</script>

<Section title="Level" open>
  <label
    >Max level: <input
      type="number"
      step="1"
      min="0"
      max="200"
      bind:value={dofusState.level}
    /></label
  >
</Section>
