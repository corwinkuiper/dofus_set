"use client";

import { StatNames } from "@/services/dofus/stats";
import { useState } from "react";
import styled from "styled-components";

interface StatWeightInputProps {
  weights: number[];
  setWeights: (weights: number[]) => void;
}

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

export function StatWeightInput({ weights, setWeights }: StatWeightInputProps) {
  const [enabledWeights, setEnabledWeights] = useState<number[]>([0]);

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
                const newEnabledWeights = [...enabledWeights];
                newEnabledWeights[idx] = newStat;
                const newWeights = [...weights];
                newWeights[newStat] = weights[stat];
                newWeights[stat] = 0;
                setEnabledWeights(newEnabledWeights);
                setWeights(newWeights);
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
                const newWeights = [...weights];
                newWeights[stat] = Number(evt.target.value);
                setWeights(newWeights);
              }}
            />
          </Weight>
        ))}
      </Weights>
      <AddWeightButton
        disabled={remainingStatNames.length === 0}
        onClick={() => {
          const newEnabledWeights = [...enabledWeights];
          newEnabledWeights.push(remainingStatNames[0][1]);
          setEnabledWeights(newEnabledWeights);
        }}
      >
        Add Weight
      </AddWeightButton>
    </Stack>
  );
}
