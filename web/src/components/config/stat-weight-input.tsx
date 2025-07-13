"use client";

import { StatNames } from "@/services/dofus/stats";
import { simpleWeightState, useImmerAtom } from "@/state/state";
import styled from "styled-components";
import { useImmer } from "use-immer";
import { Stack } from "../base/stack";
import { Button } from "../base/button";

const Weights = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, 300px));
  gap: 16px;
`;

const Weight = styled.li`
  display: flex;

  > * {
    flex-grow: 1;
  }
`;
const WeightStatInput = styled.select`
  max-width: 50%;
`;
const WeightCountInput = styled.input`
  max-width: 50%;
`;

const AddWeightButton = Button;

function deriveEnabledWeights(weights: number[]) {
  const derived = weights.flatMap((c, idx) => (c !== 0 ? [idx] : []));
  if (derived.length === 0) return [0];
  return derived;
}

export function StatWeightInput() {
  const [weights, updateWeights] = useImmerAtom(simpleWeightState);
  const [enabledWeights, updateEnabledWeights] = useImmer<number[]>(() =>
    deriveEnabledWeights(weights)
  );

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
