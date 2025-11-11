<script lang="ts">
  const ITEM_REGEX = /(\d+)\s[x×]\s\[([^\]]+)\]\s\(([\d,\s]+)\skamas\)/g;

  let input = $state("");
  let totalCost = $derived(
    input
      .matchAll(ITEM_REGEX)
      .map((x) => Number(x[3].replaceAll(/[, ]/g, "")))
      .reduce((a, b) => a + b, 0)
  );
</script>

<div class="outer">
  <h1>Item cost totaller</h1>
  <div class="inner">
    <span>
      Paste in chat log containing when you bought some items to see how much it
      cost you
    </span>
    <textarea bind:value={input}></textarea>
    <span>Total cost: {totalCost.toLocaleString("en")} kamas</span>
  </div>
</div>

<style>
  .outer {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center;
  }

  .inner {
    display: flex;
    flex-direction: column;
    width: 80%;
    flex-grow: 1;
  }

  textarea {
    min-height: 12rem;
  }
</style>
