<script lang="ts">
  import ItemActions from "$lib/component/item-actions.svelte";
  import Item from "$lib/component/item.svelte";
  import Search from "$lib/component/search.svelte";
  import Section from "$lib/component/section.svelte";
  import type { DofusItem } from "$lib/dofus/types";
  import { dofusState } from "./state.svelte";

  function pick(item: DofusItem) {
    const idx = dofusState.bannedItems.findIndex(
      (a) => item.dofusId === a.dofusId
    );
    if (idx < 0) {
      dofusState.bannedItems.push(item);
    } else {
      dofusState.bannedItems.splice(idx, 1);
    }
  }
</script>

<Section title="Banned items" open>
  <div class="split">
    <div>
      <Search {pick} />
    </div>

    <div class="wrapper">
      <div class="item">
        {#each dofusState.bannedItems as item, idx}
          {#snippet actions()}
            <ItemActions
              bin={() => {
                dofusState.bannedItems.splice(idx, 1);
              }}
            />
          {/snippet}
          <Item itemSlot={idx} {item} {actions} />
        {/each}
      </div>
      <div class="categories">
        <label>
          Khardboard <input
            type="checkbox"
            bind:checked={dofusState.banKhardboard}
          />
        </label>
        <label>
          Petsmount <input
            type="checkbox"
            bind:checked={dofusState.banPetsmount}
          />
        </label>
        <label>
          Pet <input type="checkbox" bind:checked={dofusState.banPet} />
        </label>
        <label>
          Dragoturkey <input
            type="checkbox"
            bind:checked={dofusState.banDragoturkey}
          />
        </label>
        <label>
          Rhineetle <input
            type="checkbox"
            bind:checked={dofusState.banRhineetle}
          />
        </label>
        <label>
          Seemyool <input
            type="checkbox"
            bind:checked={dofusState.banSeemyool}
          />
        </label>
      </div>
    </div>
  </div>
</Section>

<style>
  .split {
    display: flex;
    gap: 4px;
  }

  .wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(192px, 1fr));
  }

  .categories {
    display: flex;
    gap: 32px;
  }
</style>
