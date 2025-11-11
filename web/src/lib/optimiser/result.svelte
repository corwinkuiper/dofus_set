<script lang="ts">
  import Characteristics from "$lib/component/characteristics.svelte";
  import ItemActions from "$lib/component/item-actions.svelte";
  import Item from "$lib/component/item.svelte";
  import Localised from "$lib/component/localised.svelte";
  import Tooltip from "$lib/component/tooltip.svelte";
  import type { DofusItem, DofusOptimiserResult } from "$lib/dofus/types";
  import CharacteristicPoints from "./result/characteristic-points.svelte";
  import { dofusState } from "./state.svelte";

  let { result }: { result: DofusOptimiserResult } = $props();

  function togglePin(item: DofusItem | undefined, slot: number) {
    if (!item) return;
    return () => {
      dofusState.initialItems[slot] = item;
    };
  }

  function bin(item: DofusItem | undefined) {
    if (!item) return;
    return () => {
      const index = dofusState.bannedItems.findIndex(
        (a) => a.dofusId === item.dofusId
      );
      if (index < 0) {
        dofusState.bannedItems.push(item);
      }
    };
  }

  function isBinned(item: DofusItem | undefined) {
    if (!item) return;
    return !!dofusState.bannedItems.find((a) => a.dofusId === item.dofusId);
  }
</script>

<div class="wrapper">
  <div class="grow">
    <div class="item">
      {#each result.items as item, idx}
        <Item {item} itemSlot={idx}>
          {#snippet actions()}
            <ItemActions
              pin={togglePin(item, idx)}
              bin={bin(item)}
              binActive={isBinned(item)}
            />
          {/snippet}
        </Item>
      {/each}
    </div>
    <div>
      {#each result.setBonuses as bonus}
        <Tooltip>
          {#snippet tooltip()}
            <Characteristics characteristics={bonus.characteristics} />
          {/snippet}
          <div class="item-box">
            <Localised text={bonus.name} /> ({bonus.numberOfItems})
          </div>
        </Tooltip>
      {/each}
    </div>
    <div>
      <CharacteristicPoints points={result.characteristics} />
    </div>
  </div>
  <div>
    <span>Energy: {result.energy.toFixed(2)}</span>
    {#if result.damagingMoveAverageBaseDamage.length > 0}
      <div>
        Average base damage:
        <ul class="list">
          {#each result.damagingMoveAverageBaseDamage as baseDamage}
            {baseDamage.toFixed(1)}
          {/each}
        </ul>
      </div>
    {/if}
    <Characteristics characteristics={result.overallCharacteristics} />
  </div>
</div>

<style>
  .item {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(192px, 1fr));
  }

  .grow {
    flex-grow: 1;
  }

  .wrapper {
    display: flex;
  }

  .list {
    list-style: none;
    margin: 0;
  }

  .item-box {
    display: flex;
    border-radius: 4px;
    background-color: lightgray;
    margin: 8px;
    padding-right: 8px;
    align-items: center;
    gap: 8px;
  }
</style>
