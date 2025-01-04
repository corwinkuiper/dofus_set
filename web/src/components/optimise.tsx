"use client";

import { StatWeightInput } from "./stat-weight-input";
import { css, styled } from "styled-components";
import { SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
import {
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";
import { ExosInputs } from "./exos";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Stack = styled.div<{ $grow?: boolean }>`
  display: flex;
  flex-direction: column;
  ${(props) =>
    props.$grow &&
    css`
      flex-grow: 1;
    `}
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
        <StatWeightInput />
        <ExosInputs />
        <OptimiseButton />
      </Stack>
      <Stack $grow>{optimal && <SetDisplay set={optimal.items} />}</Stack>
      <Stack>
        {optimal && <OverallStats stats={optimal.overallCharacteristics} />}
      </Stack>
    </Container>
  );
}
