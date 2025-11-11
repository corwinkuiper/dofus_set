<script lang="ts">
  import type { DofusItem } from "$lib/dofus/types";
  import type { Snippet } from "svelte";
  import Localised from "./localised.svelte";
  import Tooltip from "./tooltip.svelte";
  import Characteristics from "./characteristics.svelte";
  import { makeImageUrl } from "$lib/dofus/image-url";

  const slotToItemType = [
    "Hat",
    "Cloak",
    "Amulet",
    "Ring",
    "Ring",
    "Belt",
    "Boots",
    "Weapon",
    "Shield",
    "Dofus",
    "Dofus",
    "Dofus",
    "Dofus",
    "Dofus",
    "Dofus",
    "Pet",
  ];

  let {
    item,
    actions,
    itemSlot,
  }: { item?: DofusItem; actions?: Snippet; itemSlot: number } = $props();

  let itemType = $derived(slotToItemType.at(itemSlot));
</script>

{#if !item}
  <div class="box">
    <img class="item-image" src={makeImageUrl(`icon/${itemType}.svg`)} alt="" />
    <div class="grow">
      <div class="action">
        <div class="item-text"></div>
        <div class="actions">{@render actions?.()}</div>
      </div>
      <div class="item-text">
        {itemType}
      </div>
    </div>
  </div>
{:else}
  {#snippet tooltip()}
    <Characteristics characteristics={item.characteristics} />
  {/snippet}
  <Tooltip {tooltip}>
    <div class="box">
      <img
        loading="lazy"
        class="item-image"
        src={makeImageUrl(item.imageUrl)}
        alt=""
      />
      <div class="grow">
        <div class="action">
          <div class="item-text">{item.level}</div>
          <div class="actions">{@render actions?.()}</div>
        </div>
        <div class="item-text">
          <Localised text={item.name} />
        </div>
      </div>
    </div>
  </Tooltip>
{/if}

<style>
  .box {
    display: flex;
    border-radius: 4px;
    background-color: lightgray;
    margin: 8px;
    padding-right: 8px;
    align-items: center;
    gap: 8px;
  }

  .grow {
    flex-grow: 1;
  }

  .action {
    display: flex;
    justify-content: space-between;
    flex-grow: 1;
  }

  .item-image {
    width: 50px;
    height: 50px;
  }

  .item-text {
    font-size: 0.8rem;
  }

  .actions {
    display: flex;
  }
</style>
