"use client";

import {
  OptimiseApiResponse,
  Optimiser,
  OptimiseRequest,
} from "@/services/dofus/optimiser";
import { useState } from "react";
import { StatWeightInput } from "./stat-weight-input";
import { styled } from "styled-components";
import { SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";

const optimiser = new Optimiser();

const Container = styled.div`
  display: flex;
  flex-direction: row;
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
`;

const OptimiseButton = styled.button``;

export type OptimisationConfig = Omit<OptimiseRequest, "iterations">;
function emptyOptimisationConfig(): OptimisationConfig {
  return {
    weights: new Array(51).fill(0),
    maxLevel: 149,
    initialItems: new Array(16).fill(undefined),
    fixedItems: [],
    bannedItems: [],
    apExo: false,
    mpExo: false,
    rangeExo: false,
    multiElement: false,
  };
}

export function Optimise() {
  const [currentOptimal, setCurrentOptimal] =
    useState<OptimiseApiResponse | null>(null);
  const [runningOptimisation, setRunningOptimisation] =
    useState<AbortController | null>(null);
  const [config, setConfig] = useState(emptyOptimisationConfig());

  async function triggerOptimisation(
    iterations: number,
    config: OptimisationConfig
  ) {
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
    setCurrentOptimal(max);
  }

  return (
    <Container>
      <Stack>
        <StatWeightInput
          weights={config.weights}
          setWeights={(weights) => {
            const newConfig = { ...config, weights };
            setConfig(newConfig);
            triggerOptimisation(100000, newConfig);
          }}
        />
        {runningOptimisation && (
          <OptimiseButton
            onClick={() => runningOptimisation.abort("cancelled by user")}
          >
            Cancel
          </OptimiseButton>
        )}
        {!!runningOptimisation || (
          <OptimiseButton onClick={() => triggerOptimisation(1000000, config)}>
            Optimise
          </OptimiseButton>
        )}
      </Stack>
      <Stack>
        {currentOptimal && <SetDisplay set={currentOptimal.items} />}
      </Stack>
      <Stack>
        {currentOptimal && (
          <OverallStats stats={currentOptimal.overallCharacteristics} />
        )}
      </Stack>
    </Container>
  );
}
