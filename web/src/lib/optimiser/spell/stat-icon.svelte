<script lang="ts">
  import { getUrlForStatIcon, type StatName } from "$lib/dofus/stat-names";

  let { name }: { name: StatName } = $props();
</script>

<img alt={name} src={getUrlForStatIcon(name)} />

<style>
  img {
    height: 15px;
    width: 15px;
  }
</style>
