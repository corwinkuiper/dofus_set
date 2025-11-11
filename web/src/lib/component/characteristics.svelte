<script lang="ts">
  import { getUrlForStatIcon, StatNames } from "$lib/dofus/stat-names";
  import type { DofusCharacteristics } from "$lib/dofus/types";

  let { characteristics }: { characteristics: DofusCharacteristics } = $props();
</script>

<ul class="block">
  {#each characteristics as characteristic, idx}
    {#if characteristic != 0}
      <li class="stat">
        <img class="icon" src={getUrlForStatIcon(StatNames[idx])} alt="" />
        <span>{characteristic}</span>
        <span class="name">{StatNames[idx]}</span>
      </li>
    {/if}
  {/each}
</ul>

<style>
  .block {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: auto auto 1fr auto auto 1fr;
    @media screen and (max-width: 600px) {
      grid-template-columns: auto auto 1fr;
    }
    gap: 4px;
  }

  .stat {
    display: grid;
    grid-column: span 3;
    grid-template-columns: subgrid;
    align-items: center;
  }

  .icon {
    height: 15px;
    width: 15px;
  }

  .name {
    padding-left: 12px;
  }
</style>
