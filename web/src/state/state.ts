import { atom, selector, useRecoilValue, useSetRecoilState } from "recoil";

import { RecoilState, useRecoilState } from "recoil";
import { produce, Draft } from "immer";
import { useCallback } from "react";
import {
  OptimiseApiResponse,
  Optimiser,
  OptimiseRequest,
} from "@/services/dofus/optimiser";

type DraftFunction<T> = (draft: Draft<T>) => void;

export const useRecoilImmerState = <T>(atom: RecoilState<T>) => {
  const [state, setState] = useRecoilState(atom);

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

export const simpleWeightState = atom({
  key: "simple-weights",
  default: new Array(51).fill(0),
});

export const maxLevelState = atom({
  key: "max-level",
  default: 149,
});

export const bannedItemsState = atom({
  key: "banned-items",
  default: [],
});

export type OptimisationConfig = Omit<OptimiseRequest, "iterations">;

export const optimisationConfig = selector<OptimisationConfig>({
  key: "optimisation-configuration",
  get: ({ get }) => {
    return {
      weights: get(simpleWeightState),
      maxLevel: get(maxLevelState),
      bannedItems: get(bannedItemsState),
      initialItems:
        get(optimialResponseState)?.items.map((x) => x?.dofusId) ??
        new Array(16).fill(undefined),
      fixedItems: [],
      apExo: false,
      mpExo: false,
      rangeExo: false,
      multiElement: false,
    };
  },
});

export const runningOptimisationState = atom<AbortController | null>({
  key: "running-optimisation",
  default: null,
});

export const optimialResponseState = atom<OptimiseApiResponse | null>({
  key: "optimisation-result",
  default: null,
});

const optimiser = new Optimiser();

export function useCancelOptimisation() {
  const [running, setRunning] = useRecoilState(runningOptimisationState);

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
  return useRecoilValue(optimialResponseState);
}

export function useDispatchOptimise() {
  const setRunningOptimisation = useSetRecoilState(runningOptimisationState);
  const config = useRecoilValue(optimisationConfig);
  const setOptimiseResponse = useSetRecoilState(optimialResponseState);

  return useCallback(
    async function triggerOptimisation(iterations: number) {
      const abort = new AbortController();
      setRunningOptimisation(abort);

      const optimiseRequests = [];
      const freeWorkers = optimiser.freeWorkerCount() || 1;
      const request = {
        ...config,
        iterations,
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
