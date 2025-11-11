<script lang="ts">
  import Section from "$lib/component/section.svelte";
  import { getUrlForStatIcon, type StatName } from "$lib/dofus/stat-names";
  import { dofusState } from "./state.svelte";

  type ExoTypes = "apExo" | "mpExo" | "rangeExo" | "multiElement";
</script>

{#snippet Exo(name: string, id: ExoTypes, icon?: StatName)}
  <label class="exo">
    {#if icon}
      <img src={getUrlForStatIcon(icon)} alt="" />
    {/if}
    <span>{name}</span>
    <input type="checkbox" bind:checked={dofusState[id]} />
  </label>
{/snippet}

<Section title="Exos" open>
  <div class="wrapper">
    {@render Exo("AP Exo", "apExo", "AP")}
    {@render Exo("MP Exo", "mpExo", "MP")}
    {@render Exo("Range Exo", "rangeExo", "Range")}
    {@render Exo("Multi", "multiElement")}
  </div>
</Section>

<style>
  img {
    width: 15px;
    height: 15px;
  }

  .exo {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .wrapper {
    display: flex;
    gap: 8px;
  }
</style>
