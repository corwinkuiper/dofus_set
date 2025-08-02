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
import { StatWeightInput } from "./stat-weight-input";
import { AdvancedConfig } from "./advanced";
import { InputDecimal, InputInteger } from "../base/input";

function LevelInput() {
  const [level, setLevel] = useAtom(maxLevelState);

  return (
    <label>
      <span>Max level: </span>
      <InputInteger value={level} onChange={setLevel} />
    </label>
  );
}

const BaseInputItem = styled.label`
  border: 1px solid black;
  border-radius: 4px;
  overflow: hidden;
  display: grid;
  grid-column: span 2;
  grid-template-columns: subgrid;
  & > span {
    background-color: #b5b5b5;
    padding: 4px;
  }
`;

const BaseInputLi = styled.li`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 2;
  gap: 0;
`;

function BaseStatInput({ statName }: { statName: StatName }) {
  const [statWeight, updateStatWeight] = useImmerAtom(simpleWeightState);

  return (
    <BaseInputLi>
      <BaseInputItem>
        <span>{statName}</span>
        <InputDecimal
          value={statWeight[statIndex(statName)]}
          onChange={(e) =>
            updateStatWeight((x) => {
              x[statIndex(statName)] = e;
            })
          }
        />
      </BaseInputItem>
    </BaseInputLi>
  );
}

const BasicList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(
    auto-fill,
    minmax(60px, 1fr) minmax(100px, 3fr)
  );
`;

function ApMpRangeWeightInput() {
  return (
    <BasicList>
      <BaseStatInput statName="AP" />
      <BaseStatInput statName="MP" />
      <BaseStatInput statName="Range" />
      <BaseStatInput statName="Vitality" />
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
      <Section title="Raw input" closed>
        <StatWeightInput />
      </Section>
      <Section title="Advanced" closed>
        <AdvancedConfig />
      </Section>
    </Stack>
  );
}
