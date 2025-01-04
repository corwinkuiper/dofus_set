"use client";

import { StatNames } from "@/services/dofus/stats";
import { simpleWeightState, useRecoilImmerState } from "@/state/state";
import styled from "styled-components";
import { useImmer } from "use-immer";

const Weights = styled.ul`
  list-style: none;
  padding: 0;
`;

const Weight = styled.li`
  display: flex;

  > * {
    flex-grow: 1;
  }
`;
const WeightStatInput = styled.select``;
const WeightCountInput = styled.input``;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
`;

const AddWeightButton = styled.button``;

export function StatWeightInput() {
  const [weights, updateWeights] = useRecoilImmerState(simpleWeightState);
  const [enabledWeights, updateEnabledWeights] = useImmer<number[]>([0]);

  const remainingStatNames = StatNames.map(
    (x, idx) => [x, idx] as const
  ).filter((_, idx) => !enabledWeights.includes(idx));

  return (
    <Stack>
      <Weights>
        {enabledWeights.map((stat, idx) => (
          <Weight key={idx}>
            <WeightStatInput
              value={stat}
              onChange={(evt) => {
                const newStat = Number(evt.target.value);
                updateWeights((weights) => {
                  const current = weights[stat];
                  weights[stat] = 0;
                  weights[newStat] = current;
                });
                updateEnabledWeights((enabledWeights) => {
                  enabledWeights[idx] = newStat;
                });
              }}
            >
              <option value={stat}>{StatNames[stat]}</option>
              {remainingStatNames.map(([x, idx]) => (
                <option key={x} value={idx}>
                  {x}
                </option>
              ))}
            </WeightStatInput>
            <WeightCountInput
              type="number"
              value={weights[stat]}
              onChange={(evt) => {
                updateWeights((weights) => {
                  weights[stat] = Number(evt.target.value);
                });
              }}
            />
          </Weight>
        ))}
      </Weights>
      <AddWeightButton
        disabled={remainingStatNames.length === 0}
        onClick={() => {
          updateEnabledWeights((enabledWeights) => {
            enabledWeights.push(remainingStatNames[0][1]);
          });
        }}
      >
        Add Weight
      </AddWeightButton>
    </Stack>
  );
}
