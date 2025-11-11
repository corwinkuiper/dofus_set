<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    open = false,
    children,
  }: { title: string; open?: boolean; children: Snippet } = $props();
</script>

<details {open}>
  <summary><span class="title">{title}</span></summary>
  <div>
    {@render children()}
  </div>
</details>

<style>
  details {
    border: 1px solid black;
    margin: 2px;
    padding: 8px;
  }

  summary {
    margin: 0;
    margin-bottom: 4px;
    padding: 0;
  }

  .title {
    font-weight: bold;
    font-size: 1.4rem;
  }
</style>
