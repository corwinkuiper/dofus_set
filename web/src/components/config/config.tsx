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

function BaseStatInput({ statName }: { statName: StatName }) {
  const [statWeight, updateStatWeight] = useImmerAtom(simpleWeightState);

  return (
    <label>
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
    </label>
  );
}

function ApMpRangeWeightInput() {
  return (
    <ul>
      <BaseStatInput statName="AP" />
      <BaseStatInput statName="MP" />
      <BaseStatInput statName="Range" />
    </ul>
  );
}

export function OptimisationConfig() {
  return (
    <Stack>
      <LevelInput />
      <ApMpRangeWeightInput />
      <DamagingMoveInput />
    </Stack>
  );
}
