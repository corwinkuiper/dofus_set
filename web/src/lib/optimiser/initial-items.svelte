<script lang="ts">
  import ItemActions from "$lib/component/item-actions.svelte";
  import Item from "$lib/component/item.svelte";
  import Search from "$lib/component/search.svelte";
  import Section from "$lib/component/section.svelte";
  import type { DofusItem } from "$lib/dofus/types";
  import { dofusState } from "./state.svelte";

  let slotToSearch = $state<number>();

  function pick(item: DofusItem) {
    if (slotToSearch === undefined) return;
    dofusState.initialItems[slotToSearch] = item;
  }

  function togglePin(slot: number) {
    if (dofusState.fixedItems.includes(slot)) {
      dofusState.fixedItems = dofusState.fixedItems.filter((x) => x !== slot);
    } else {
      dofusState.fixedItems.push(slot);
    }
  }
</script>

<Section title="Initial items" open>
  <div class="split">
    <div>
      {#if slotToSearch !== null}
        <Search itemSlot={slotToSearch} {pick} />
      {/if}
    </div>

    <div class="wrapper">
      <div class="item">
        {#each dofusState.initialItems as item, idx}
          {#snippet actions()}
            <ItemActions
              search={() => {
                slotToSearch = idx;
              }}
              searchActive={slotToSearch === idx}
              pin={() => {
                togglePin(idx);
              }}
              pinActive={dofusState.fixedItems.includes(idx)}
              bin={item !== null
                ? () => {
                    dofusState.initialItems[idx] = null;
                    dofusState.fixedItems = dofusState.fixedItems.filter(
                      (x) => x !== idx
                    );
                  }
                : undefined}
            />
          {/snippet}
          <Item itemSlot={idx} {item} {actions} />
        {/each}
      </div>
    </div>
  </div>
</Section>

<style>
  .split {
    display: flex;
  }

  .wrapper {
    flex-grow: 1;
  }

  .item {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(192px, 1fr));
  }
</style>
