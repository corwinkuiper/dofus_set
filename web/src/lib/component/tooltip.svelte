<script lang="ts">
  import type { Snippet } from "svelte";
  import { fade } from "svelte/transition";

  let pos = $state<{ x: number; y: number } | null>(null);

  let targetElement = $state<Element>();
  let tooltipElement = $state<Element>();
  let visible = $state(false);

  function onpointermove(event: PointerEvent) {
    visible = true;
    if (!tooltipElement || !targetElement) return;

    const body = document.body.getBoundingClientRect();
    const box = targetElement.getBoundingClientRect();
    const tip = tooltipElement.getBoundingClientRect();

    let x = box.x + box.width / 2 - tip.width / 2 - body.x;
    let y = box.y - tip.height - body.y;

    x = Math.max(-body.x, Math.min(x, window.innerWidth - tip.width - body.x));
    y = Math.max(
      -body.y,
      Math.min(y, window.innerHeight - tip.height - body.y)
    );

    pos = { x, y };
  }

  let { children, tooltip }: { children: Snippet; tooltip?: Snippet } =
    $props();
</script>

<div
  {onpointermove}
  onpointerleave={() => (visible = false)}
  bind:this={targetElement}
>
  {@render children()}

  {#if visible && tooltip}
    <div
      class="tooltip"
      bind:this={tooltipElement}
      transition:fade={{ duration: 200 }}
      style:top={pos && `${pos.y}px`}
      style:left={pos && `${pos.x}px`}
    >
      {@render tooltip()}
    </div>
  {/if}
</div>

<style>
  .tooltip {
    position: absolute;
    pointer-events: none;
    background-color: white;
    border-radius: 8px;
    border: solid black 1px;
    padding: 8px;
  }
</style>
