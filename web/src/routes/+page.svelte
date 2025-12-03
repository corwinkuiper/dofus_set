<script lang="ts">
  import { optimiser } from "$lib/dofus/optimiser-service";
  import type { DofusOptimiserResult } from "$lib/dofus/types";
  import Advanced from "$lib/optimiser/advanced.svelte";
  import BannedItems from "$lib/optimiser/banned-items.svelte";
  import Basic from "$lib/optimiser/basic.svelte";
  import Exos from "$lib/optimiser/exos.svelte";
  import InitialItems from "$lib/optimiser/initial-items.svelte";
  import Level from "$lib/optimiser/level.svelte";
  import RawWeights from "$lib/optimiser/raw-weights.svelte";
  import Result from "$lib/optimiser/result.svelte";
  import Spell from "$lib/optimiser/spell.svelte";
  import { dofusState, optimiserConfig } from "$lib/optimiser/state.svelte";
  import { language } from "$lib/state/lang.svelte";
  import { persistState } from "$lib/util/persist.svelte";

  let optimal = $state<DofusOptimiserResult>();
  let progress = $state<{ complete: number; total: number }>();
  let cancelRunning = $state<AbortController>();
  let allItemsPromise = $state(optimiser.get_all_items());

  persistState("optimise", dofusState);
  persistState("optimise_settings", optimiserConfig);
  persistState("lang", language);

  function cancel() {
    if (cancelRunning) {
      cancelRunning.abort();
    }
  }

  async function optimise() {
    const snapshot = $state.snapshot(dofusState);
    const config = $state.snapshot(optimiserConfig);

    cancelRunning = new AbortController();

    const allItems = await allItemsPromise;

    cancelRunning?.signal.throwIfAborted();

    const bannedItemTypes = new Set();
    if (snapshot.banPetsmount) bannedItemTypes.add("Petsmount");
    if (snapshot.banPet) bannedItemTypes.add("Pet");
    if (snapshot.banDragoturkey) bannedItemTypes.add("Dragoturkey");
    if (snapshot.banRhineetle) bannedItemTypes.add("Rhineetle");
    if (snapshot.banSeemyool) bannedItemTypes.add("Seemyool");

    const bannedItems = [
      ...allItems
        .filter(
          (x) =>
            bannedItemTypes.has(x.itemType) ||
            (snapshot.banKhardboard && x.name.en.startsWith("Khardboard"))
        )
        .map((x) => x.dofusId),
      ...snapshot.bannedItems.map((x) => x.dofusId),
    ];

    const optimiserProfile = {
      weights: snapshot.basicStat,
      maxLevel: snapshot.level,
      targets: snapshot.targetStat,
      initialItems: snapshot.initialItems.map((x) => x?.dofusId ?? null),
      fixedItems: snapshot.fixedItems,
      bannedItems,
      apExo: dofusState.apExo,
      mpExo: dofusState.mpExo,
      rangeExo: dofusState.rangeExo,
      multiElement: dofusState.multiElement,
      changedItemWeight: 0,
      damagingMovesWeights: snapshot.rawSpells,
      considerCharacteristics: snapshot.considerCharacteristicPoints,
      iterations: config.numberOfIterations,
      initialTemperature: config.initialTemperature,
    };

    const parallelism = navigator.hardwareConcurrency ?? 1;
    if (!config.continuous) {
      progress = { total: parallelism, complete: 0 };

      const results = await Promise.allSettled(
        Array.from({ length: parallelism }, async () => {
          const result = await optimiser.optimise(optimiserProfile, {
            abort: cancelRunning?.signal,
          });
          progress!.complete++;
          return result;
        })
      );

      cancelRunning?.signal.throwIfAborted();

      const successful = results.flatMap((x) =>
        x.status === "fulfilled" ? [x.value] : []
      );

      if (successful.length === 0) {
        throw new Error("Optimiser failed to produce result");
      }

      let max = successful[0];

      for (const r of successful) {
        if (r.energy > max.energy) max = r;
      }

      optimal = max;
    } else {
      optimal = undefined;
      progress = { total: 0, complete: 0 };

      async function runWorker() {
        while (cancelRunning && !cancelRunning.signal.aborted) {
          progress!.total += 1;
          const result = await optimiser.optimise(optimiserProfile, {
            abort: cancelRunning?.signal,
          });
          if (optimal === undefined || result.energy > optimal.energy) {
            optimal = result;
          }
          progress!.complete += 1;
        }
      }

      await Promise.allSettled(Array.from({ length: parallelism }, runWorker));
    }
  }

  async function onsubmit() {
    if (cancelRunning) {
      cancel();
    } else {
      try {
        await optimise();
      } catch (e) {
        if (e instanceof DOMException && e.name == "AbortError") {
          return;
        }
        throw e;
      } finally {
        cancelRunning = undefined;
        progress = undefined;
      }
    }
  }
</script>

<svelte:head>
  <title>Dofus Optimiser</title>
</svelte:head>

<form {onsubmit}>
  <Level />
  <Basic />
  <Spell />
  <InitialItems />
  <Exos />
  <BannedItems />
  <RawWeights />
  <Advanced />
  <button
    type="submit"
    class={[
      "optimise-button",
      {
        "optimise-button-inactive": cancelRunning === undefined,
        "optimise-button-active": cancelRunning !== undefined,
      },
    ]}
    >Optimise {#if progress}({progress.complete} / {progress.total}){/if}</button
  >
</form>

{#if optimal}
  <Result result={optimal} />
{/if}

<style>
  .optimise-button {
    width: 100%;
    font-size: 1rem;
    height: 3rem;

    border-width: 2px;
    border-style: solid;
    border-radius: 8px;
  }

  .optimise-button-inactive {
    background-color: #bcd607;
    border-color: #ffff00;
  }

  .optimise-button-active {
    background-color: #fdb509;
    border-color: #a42805;
  }
</style>
