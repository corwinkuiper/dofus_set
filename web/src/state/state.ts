import { produce, Draft } from "immer";
import { useCallback } from "react";
import {
  OptimiseApiResponse,
  Optimiser,
  OptimisationConfig,
} from "@/services/dofus/optimiser";
import { atom, PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { damagingMoves } from "@/components/config/damagingMove";

type DraftFunction<T> = (draft: Draft<T>) => void;

export const useImmerAtom = <T>(atom: PrimitiveAtom<T>) => {
  const [state, setState] = useAtom(atom);

  return [
    state,
    useCallback(
      (update: DraftFunction<T> | T) => {
        setState((current) =>
          typeof update === "function"
            ? produce(current, update as DraftFunction<T>)
            : (update as T)
        );
      },
      [setState]
    ),
  ] as const;
};

export const simpleWeightState = atom<number[]>(new Array(51).fill(0));

export const maxLevelState = atom(149);

export const bannedItemsState = atom([]);

export const initialItemsState = atom(new Array(16).fill(null));

export const optimisationConfig = atom<OptimisationConfig>((get) => {
  return {
    weights: get(simpleWeightState),
    maxLevel: get(maxLevelState),
    bannedItems: get(bannedItemsState),
    initialItems:
      get(optimialResponseState)?.items.map((x) => x?.dofusId) ??
      new Array(16).fill(undefined),
    fixedItems: [],
    ...get(exosState),
    damagingMovesWeights: get(damagingMoves),
    changedItemWeight: 0,
  };
});

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
  const config = useAtomValue(optimisationConfig);
  const setOptimiseResponse = useSetAtom(optimialResponseState);

  return useCallback(
    async function triggerOptimisation(iterations: number) {
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
