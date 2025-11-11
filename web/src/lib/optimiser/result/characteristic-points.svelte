<script lang="ts">
  import { getUrlForStatIcon, type StatName } from "$lib/dofus/stat-names";

  let { points }: { points: number[] } = $props();

  const ORDER: [StatName, (x: number) => number][] = [
    ["Vitality", (x: number) => x],
    ["Wisdom", (x: number) => Math.floor(x / 3)],
    ["Agility", convertPointsForStat],
    ["Chance", convertPointsForStat],
    ["Strength", convertPointsForStat],
    ["Intelligence", convertPointsForStat],
  ];
  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  function convertPointsForStat(points: number): number {
    return (
      Math.min(points, 100) +
      Math.floor(clamp(points - 100, 0, 200) / 2) +
      Math.floor(clamp(points - 300, 0, 300) / 3) +
      Math.floor(Math.max(points - 600, 0) / 4)
    );
  }
</script>

<div class="grid">
  {#each points as point, idx}
    <div class="stat">
      <img src={getUrlForStatIcon(ORDER[idx][0])} alt="" />
      <span>{ORDER[idx][1](point)}</span>
      <stat class="name">{ORDER[idx][0]}</stat>
    </div>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto 1fr;
    @media screen and (max-width: 600px) {
      grid-template-columns: auto auto 1fr;
    }
    gap: 4px;
  }
  .stat {
    display: grid;
    grid-column: span 3;
    grid-template-columns: subgrid;
    align-items: center;
  }
  .name {
    padding-left: 12px;
  }

  img {
    height: 15px;
    width: 15px;
  }
</style>
