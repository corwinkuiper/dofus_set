"use client";

import { StatNames } from "@/services/dofus/stats";
import { simpleWeightState, targetState, useImmerAtom } from "@/state/state";
import styled from "styled-components";
import { useImmer } from "use-immer";
import { Stack } from "../base/stack";
import { Button } from "../base/button";
import { InputDecimal, InputInteger } from "../base/input";

const Weights = styled.ul`
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(192px, 300px));
  gap: 16px;
`;

const Weight = styled.li`
  display: flex;
`;
const WeightStatInput = styled.select`
  min-width: 0;
`;
const WeightCountInput = styled(InputDecimal)``;

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

  const [targets, updateTargets] = useImmerAtom(targetState);

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
              value={weights[stat]}
              onChange={(evt) => {
                updateWeights((weights) => {
                  weights[stat] = evt;
                });
              }}
            />
            {targets[stat] !== undefined && (
              <InputInteger
                value={targets[stat]}
                onChange={(t) => {
                  updateTargets((targets) => {
                    targets[stat] = t;
                  });
                }}
              />
            )}
            <input
              type="checkbox"
              checked={targets[stat] !== undefined}
              onChange={(evt) => {
                updateTargets((targets) => {
                  targets[stat] = evt.target.checked ? 0 : undefined;
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
