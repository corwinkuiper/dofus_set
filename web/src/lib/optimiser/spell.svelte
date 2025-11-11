<script>
  import Section from "$lib/component/section.svelte";
  import StatIcon from "./spell/stat-icon.svelte";
  import { dofusState } from "./state.svelte";
</script>

<Section title="Spells" open>
  <div class="list">
    {#each dofusState.rawSpells as damagingMove, idx}
      <div>
        <div class="box">
          <div class="element-grid">
            <span>Stat</span>
            <StatIcon name="Neutral Damage" />
            <StatIcon name="Air Damage" />
            <StatIcon name="Water Damage" />
            <StatIcon name="Earth Damage" />
            <StatIcon name="Fire Damage" />
            <span>Base</span>
            {#each damagingMove.baseDamage as dmg}
              <input class="damage-input" bind:value={dmg} type="number" />
            {/each}
            <span>Crit</span>
            {#each damagingMove.baseCritDamage as dmg}
              <input class="damage-input" bind:value={dmg} type="number" />
            {/each}
          </div>
          <label class="label">
            Crit chance
            <input
              class="sized-input"
              type="number"
              bind:value={damagingMove.baseCritPercent}
            />
          </label>
          <label class="label">
            Crit chance modifiable
            <input
              class="sized-input"
              type="checkbox"
              bind:checked={damagingMove.critModifyable}
            />
          </label>
          <label class="label">
            Damage weight
            <input
              class="sized-input"
              type="number"
              step="any"
              bind:value={damagingMove.weight}
            /></label
          >
        </div>
        <button
          type="button"
          onclick={() => {
            dofusState.rawSpells.splice(idx, 1);
          }}>Delete</button
        >
      </div>
    {/each}
  </div>
  <button
    type="button"
    onclick={() => {
      dofusState.rawSpells.push({
        weight: 1,
        baseDamage: new Array(5).fill(0),
        baseCritDamage: new Array(5).fill(0),
        baseCritPercent: 0,
        critModifyable: true,
      });
    }}>Add Spell</button
  >
</Section>

<style>
  .box {
    display: flex;
    flex-direction: column;
  }

  .element-grid {
    display: grid;
    grid-template-columns: auto repeat(5, 1fr);
  }

  .label {
    display: flex;
    gap: 4px;
  }

  .sized-input {
    width: 100%;
  }

  .damage-input {
    max-width: 32px;
  }

  .list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;

    & > * {
      width: min-content;
      white-space: nowrap;
    }
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
</style>
