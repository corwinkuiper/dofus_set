<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }

  :global(body) {
    font: 1em/1.62 sans-serif;
    background-color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
  }

  :global(h1, h2, h3) {
    line-height: 1.2;
  }
</style>
