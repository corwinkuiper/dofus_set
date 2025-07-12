/// Level
/// <AP-MP-RANGE>
/// Damaging moves
/// Resistances (not sure what the interface here is).
/// Initial equipment (w/ pinnning)
/// Differing equipment weight
/// Conditional / unconditional exos
/// Raw weights
/// Banned items (w/ default bans (eg. cardboard))
/// Advanced optimisation settings
///    * Initial temperature
///    * Number of iterations
///    * Simultaneous threads

import { statIndex, StatName } from "@/services/dofus/stats";
import { maxLevelState, simpleWeightState, useImmerAtom } from "@/state/state";
import { useAtom } from "jotai";
import { DamagingMoveInput } from "./damagingMove";
import { Stack } from "../base/stack";
import { InitialItems } from "./initialEquipment";
import { Section } from "../base/section";
import styled from "styled-components";
import { ExosInputs } from "./exos";
import { BannedItems } from "./bannedItems";

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

const BaseInputItem = styled.label`
  display: flex;
  border: 1px solid black;
  border-radius: 4px;
  overflow: hidden;
  & > span {
    background-color: #b5b5b5;
    padding: 4px;
  }
`;

function BaseStatInput({ statName }: { statName: StatName }) {
  const [statWeight, updateStatWeight] = useImmerAtom(simpleWeightState);

  return (
    <li>
      <BaseInputItem>
        <span>{statName}</span>
        <input
          type="number"
          value={statWeight[statIndex(statName)]}
          onChange={(e) =>
            updateStatWeight((x) => {
              x[statIndex(statName)] = Number(e.target.value);
            })
          }
        />
      </BaseInputItem>
    </li>
  );
}

const BasicList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  gap: 16px;
`;

function ApMpRangeWeightInput() {
  return (
    <BasicList>
      <BaseStatInput statName="AP" />
      <BaseStatInput statName="MP" />
      <BaseStatInput statName="Range" />
    </BasicList>
  );
}

export function OptimisationConfig() {
  return (
    <Stack>
      <Section title="Level">
        <LevelInput />
      </Section>
      <Section title="Basic">
        <ApMpRangeWeightInput />
      </Section>
      <Section title="Spells">
        <DamagingMoveInput />
      </Section>
      <Section title="Initial items">
        <InitialItems />
      </Section>
      <Section title="Exos">
        <ExosInputs />
      </Section>
      <Section title="Banned items">
        <BannedItems />
      </Section>
    </Stack>
  );
}
