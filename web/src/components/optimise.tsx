"use client";

import { StatWeightInput } from "./stat-weight-input";
import { styled } from "styled-components";
import { SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
import {
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";

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
  const cancel = useCancelOptimisation();
  const trigger = useDispatchOptimise();
  const optimal = useOptimisationResult();

  return (
    <Container>
      <Stack>
        <StatWeightInput />
        {(cancel && (
          <OptimiseButton onClick={() => cancel("cancelled by user")}>
            Cancel
          </OptimiseButton>
        )) || (
          <OptimiseButton onClick={() => trigger(1000000)}>
            Optimise
          </OptimiseButton>
        )}
      </Stack>
      <Stack>{optimal && <SetDisplay set={optimal.items} />}</Stack>
      <Stack>
        {optimal && <OverallStats stats={optimal.overallCharacteristics} />}
      </Stack>
    </Container>
  );
}
