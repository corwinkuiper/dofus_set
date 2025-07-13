import { produce, Draft } from "immer";
import { useCallback } from "react";
import {
  OptimiseApiResponse,
  Optimiser,
  OptimisationConfig,
  OptimiseApiResponseItem,
} from "@/services/dofus/optimiser";
import {
  atom,
  SetStateAction,
  useAtom,
  useAtomValue,
  useSetAtom,
  WritableAtom,
} from "jotai";
import { damagingMoves } from "@/state/damagingMovesState";
import { bannedItemsAtom } from "./bannedItemsState";
import { useClientAtom } from "@/hooks/useClientAtom";
import { statIndex } from "@/services/dofus/stats";

type DraftFunction<T> = (draft: Draft<T>) => void;

export const useImmerAtom = <T, V, R>(
  atom: WritableAtom<T, [SetStateAction<V>], R>
) => {
  const [state, setState] = useAtom(atom);

  return [
    state,
    useCallback(
      (update: DraftFunction<V> | V) => {
        setState((current) =>
          typeof update === "function"
            ? produce(current, update as DraftFunction<V>)
            : (update as V)
        );
      },
      [setState]
    ),
  ] as const;
};

function generateSampleStats() {
  const stats = new Array(51).fill(0);

  stats[0] = 100;
  stats[1] = 100;
  stats[2] = 50;

  stats[statIndex("Vitality")] = 0.0001;

  return stats;
}

export const simpleWeightState = atom<number[]>(generateSampleStats());

export const maxLevelState = atom(149);

const bannedItemsState = atom(async (get) => [
  ...(await get(bannedItemsAtom)).values().map((x) => x.dofusId),
]);

export interface InitialItemState {
  item: OptimiseApiResponseItem;
  pinned: boolean;
}

export const initialItemsState = atom<(InitialItemState | null)[]>(
  new Array(16).fill(null)
);

export const optimisationConfig = atom<Promise<OptimisationConfig>>(
  async (get) => {
    return {
      weights: get(simpleWeightState),
      maxLevel: get(maxLevelState),
      bannedItems: await get(bannedItemsState),
      initialItems: get(initialItemsState).map(
        (x) => x?.item.dofusId ?? undefined
      ),
      fixedItems: get(initialItemsState).flatMap((x, idx) =>
        x?.pinned ? [idx] : []
      ),
      ...get(exosState),
      damagingMovesWeights: get(damagingMoves),
      changedItemWeight: 0,
    };
  }
);

export const exosState = atom({
  apExo: false,
  mpExo: false,
  rangeExo: false,
  multiElement: false,
});

export const runningOptimisationState = atom<AbortController | null>(null);
export const optimialResponseState = atom<OptimiseApiResponse | null>(null);

const optimiser = new Optimiser();

export function useCancelOptimisation() {
  const [running, setRunning] = useAtom(runningOptimisationState);

  const callback = useCallback(
    (reason: string) => {
      running?.abort(reason);
      setRunning(null);
    },
    [running, setRunning]
  );
  if (!running) return null;
  return callback;
}

export function useOptimisationResult() {
  return useAtomValue(optimialResponseState);
}

export function useDispatchOptimise() {
  const setRunningOptimisation = useSetAtom(runningOptimisationState);
  const optimiseConfigAtom = useClientAtom(optimisationConfig, null);
  const config = useAtomValue(optimiseConfigAtom);
  const setOptimiseResponse = useSetAtom(optimialResponseState);

  return useCallback(
    async function triggerOptimisation(iterations: number) {
      if (!config) return;
      const abort = new AbortController();
      setRunningOptimisation(abort);

      const optimiseRequests = [];
      const freeWorkers = optimiser.freeWorkerCount() || 1;
      const request = {
        ...config,
        iterations,
        initialTemperature: 1000,
      };
      while (optimiseRequests.length < freeWorkers)
        optimiseRequests.push(
          optimiser.optimise(request, { abort: abort.signal })
        );

      const settled = await Promise.allSettled(optimiseRequests);

      setRunningOptimisation(null);

      const success = settled.flatMap((x) =>
        x.status === "fulfilled" ? [x.value] : []
      );
      if (success.length === 0) {
        return;
      }

      let max = success[0];
      success.forEach((x) => {
        if (x.energy > max.energy) max = x;
      });
      setOptimiseResponse(max);
    },
    [config, setOptimiseResponse, setRunningOptimisation]
  );
}

export function getItemsInSlot(slot: number) {
  return optimiser.get_items_in_slot(slot);
}

export function getSpells() {
  return optimiser.get_spells();
}

export function getAllItems() {
  return optimiser.get_all_items();
}
