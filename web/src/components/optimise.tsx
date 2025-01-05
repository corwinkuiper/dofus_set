"use client";

import { styled } from "styled-components";
import { SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
import {
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";
import { Stack } from "./base/stack";
import { OptimisationConfig } from "./config/config";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const OptimiseButtonElement = styled.button``;

function OptimiseButton() {
  const cancel = useCancelOptimisation();
  const trigger = useDispatchOptimise();
  if (cancel) {
    return (
      <OptimiseButtonElement onClick={() => cancel("cancelled by user")}>
        Cancel
      </OptimiseButtonElement>
    );
  }
  return (
    <OptimiseButtonElement onClick={() => trigger(1000000)}>
      Optimise
    </OptimiseButtonElement>
  );
}

export function Optimise() {
  const optimal = useOptimisationResult();

  return (
    <Container>
      <Stack>
        <OptimisationConfig />
        <OptimiseButton />
      </Stack>
      <Stack $grow>{optimal && <SetDisplay set={optimal.items} />}</Stack>
      <Stack>
        {optimal && <OverallStats stats={optimal.overallCharacteristics} />}
      </Stack>
    </Container>
  );
}
