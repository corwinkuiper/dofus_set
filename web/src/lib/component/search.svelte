<script lang="ts">
  import type { DofusItem } from "$lib/dofus/types";
  import type { FuseResult } from "fuse.js";
  import Item from "./item.svelte";
  import { language } from "$lib/state/lang.svelte";
  import {
    makeSearcherForAllItems,
    makeSearcherForSlot,
  } from "$lib/dofus/search-service";
  import ItemActions from "./item-actions.svelte";

  let {
    itemSlot,
    pick,
  }: { itemSlot?: number; pick: (item: DofusItem) => void } = $props();

  let query = $state("");

  let searcher = $derived(
    itemSlot === undefined
      ? makeSearcherForAllItems($state.snapshot(language).lang)
      : makeSearcherForSlot(
          $state.snapshot(itemSlot),
          $state.snapshot(language).lang
        )
  );

  let results = $state<Promise<FuseResult<DofusItem>[]>>(Promise.resolve([]));
  let abort = $state(new AbortController());

  async function onInput() {
    abort.abort();
    const abortController = new AbortController();

    results = (await searcher).search($state.snapshot(query), {
      abort: abortController.signal,
    });
    abort = abortController;
  }
</script>

<div>
  <label>
    Search: <input type="text" bind:value={query} oninput={onInput} />
  </label>
  <div>
    {#await results}
      Searching...
    {:then searchResults}
      <div class="results">
        {#each searchResults.slice(0, 20) as item}
          {#snippet actions()}
            <ItemActions pin={() => pick(item.item)} />
          {/snippet}
          <Item item={item.item} itemSlot={-1} {actions} />
        {/each}
      </div>
    {/await}
  </div>
</div>

<style>
  .results {
    max-height: 400px;
    overflow-y: scroll;
    display: grid;
    grid-template-columns: 1fr;
  }
</style>
