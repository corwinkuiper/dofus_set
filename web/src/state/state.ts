import { produce, Draft } from "immer";
import { useCallback } from "react";
import {
  OptimiseApiResponse,
  Optimiser,
  OptimiseApiResponseItem,
  OptimisationRequest,
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
  item: OptimiseApiResponseItem | null;
  pinned: boolean;
}

export const initialItemsState = atom<InitialItemState[]>(
  new Array(16).fill({ pinned: false, item: null })
);

export const differentEquipmentWeightState = atom(0);

export const numberOfIterationsAtom = atom(1000000);
export const initialTemperatureAtom = atom(1000);

export const continuousOptimisationAtom = atom(false);

export const optimisationConfig = atom<Promise<OptimisationRequest>>(
  async (get) => {
    return {
      weights: get(simpleWeightState),
      maxLevel: get(maxLevelState),
      bannedItems: await get(bannedItemsState),
      initialItems: get(initialItemsState).map(
        (x) => x.item?.dofusId ?? undefined
      ),
      fixedItems: get(initialItemsState).flatMap((x, idx) =>
        x.pinned ? [idx] : []
      ),
      ...get(exosState),
      damagingMovesWeights: get(damagingMoves),
      changedItemWeight: get(differentEquipmentWeightState),
      iterations: get(numberOfIterationsAtom),
      initialTemperature: get(initialTemperatureAtom),
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

export const optimisationProgressAtom = atom({ current: 0, dispatched: 0 });

export function useDispatchOptimise() {
  const setRunningOptimisation = useSetAtom(runningOptimisationState);
  const optimiseConfigAtom = useClientAtom(optimisationConfig, null);
  const config = useAtomValue(optimiseConfigAtom);
  const setOptimiseResponse = useSetAtom(optimialResponseState);
  const shouldUseContinuousOptimisation = useAtomValue(
    continuousOptimisationAtom
  );

  const setProgress = useSetAtom(optimisationProgressAtom);

  return useCallback(
    async function triggerOptimisation() {
      if (!config) return;
      const abort = new AbortController();
      setRunningOptimisation(abort);

      if (!shouldUseContinuousOptimisation) {
        const optimiseRequests = [];
        const freeWorkers = optimiser.freeWorkerCount() || 1;
        setProgress({ current: 0, dispatched: freeWorkers });
        while (optimiseRequests.length < freeWorkers)
          optimiseRequests.push(
            (async () => {
              const response = await optimiser.optimise(config, {
                abort: abort.signal,
              });
              setProgress((current) => ({
                ...current,
                current: current.current + 1,
              }));
              return response;
            })()
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
      } else {
        setOptimiseResponse(null);
        const numberOfThreads = Math.max(navigator.hardwareConcurrency ?? 1, 1);
        const optimiseRequests = [];

        setProgress({ current: 0, dispatched: numberOfThreads });

        while (optimiseRequests.length < numberOfThreads)
          optimiseRequests.push(
            (async () => {
              while (!abort.signal.aborted) {
                const result = await optimiser.optimise(config, {
                  abort: abort.signal,
                });
                setProgress((current) => ({
                  dispatched: current.dispatched + 1,
                  current: current.current + 1,
                }));
                setOptimiseResponse((current) => {
                  if (!current) return result;
                  if (current.energy < result.energy) return result;
                  return current;
                });
              }
            })()
          );
        await Promise.allSettled(optimiseRequests);

        setRunningOptimisation(null);
      }
    },
    [
      config,
      setOptimiseResponse,
      setRunningOptimisation,
      shouldUseContinuousOptimisation,
      setProgress,
    ]
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
