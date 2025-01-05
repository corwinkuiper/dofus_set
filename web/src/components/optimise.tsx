"use client";

import { StatWeightInput } from "./config/stat-weight-input";
import { css, styled } from "styled-components";
import { SetDisplay } from "./set-display";
import { OverallStats } from "./overall-stats";
import {
  maxLevelState,
  useCancelOptimisation,
  useDispatchOptimise,
  useOptimisationResult,
} from "@/state/state";
import { ExosInputs } from "./config/exos";
import { useAtom } from "jotai";

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

const ConfigHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

function LevelInput() {
  const [level, setLevel] = useAtom(maxLevelState);

  return (
    <label>
      <span>Max level: </span>
      <input
        type="number"
        value={level}
        onChange={(evt) => setLevel(Number(evt.target.value))}
      />
    </label>
  );
}

export function Optimise() {
  const optimal = useOptimisationResult();

  return (
    <Container>
      <Stack>
        <ConfigHeader>
          <LevelInput />
        </ConfigHeader>
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
