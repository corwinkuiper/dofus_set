"use client";

import { OptimiseApiResponse, Optimiser } from "@/services/dofus/optimiser";
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

export function Optimise() {
  const [currentOptimal, setCurrentOptimal] =
    useState<OptimiseApiResponse | null>(null);
  const [runningOptimisation, setRunningOptimisation] =
    useState<AbortController | null>(null);
  const [weights, setWeights] = useState(new Array(51).fill(0));

  async function triggerOptimisation(iterations: number, weights: number[]) {
    const abort = new AbortController();
    setRunningOptimisation(abort);

    const optimiseRequests = [];
    const freeWorkers = optimiser.freeWorkerCount() || 1;
    const request = {
      weights,
      maxLevel: 149,
      fixedItems: new Array(16).fill(null),
      bannedItems: [],
      apExo: false,
      mpExo: false,
      rangeExo: false,
      multiElement: false,
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
          weights={weights}
          setWeights={(weights) => {
            setWeights(weights);
            triggerOptimisation(1000, weights);
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
          <OptimiseButton onClick={() => triggerOptimisation(1000000, weights)}>
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
