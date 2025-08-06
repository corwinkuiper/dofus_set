import { useOptimisationResult } from "@/state/state";
import { styled } from "styled-components";
import { Stack } from "./base/stack";
import { CharacteristicsPoints, OverallStats } from "./overall-stats";
import { SetDisplay, SetBonusesDisplay } from "./set-display";

interface DisplayNumberAppropriatelyProps {
  number: number;
}

function DisplayNumberAppropriately({
  number,
}: DisplayNumberAppropriatelyProps) {
  if (Math.abs(number) >= 1) {
    return number.toFixed(2);
  }

  return number;
}

const DamagingMoveList = styled.ul`
  list-style: none;
  margin: 0;
`;

function DamagingMovesDisplay() {
  const optimal = useOptimisationResult();

  if (!optimal) return null;

  if (optimal.damagingMoveAverageBaseDamage.length === 0) return null;

  return (
    <Stack>
      <div>Average base damage:</div>
      <DamagingMoveList>
        {optimal.damagingMoveAverageBaseDamage.map((x, idx) => (
          <li key={idx}>{x.toFixed(1)}</li>
        ))}
      </DamagingMoveList>
    </Stack>
  );
}

const Warning = styled.div`
  color: red;
`;

export function CurrentOptimalResult() {
  const optimal = useOptimisationResult();

  if (!optimal) return null;

  return (
    <Stack>
      {!optimal.valid && (
        <Warning>
          This set isn&apos;t valid, this is likely because your weights are too
          high making it energetically preferable to make invalid sets.
        </Warning>
      )}
      <Stack $dir="h">
        <Stack $grow>
          <SetDisplay set={optimal.items} />
          <SetBonusesDisplay bonuses={optimal.setBonuses} />
          {optimal.characteristics.filter((x) => x !== 0).length > 0 && (
            <CharacteristicsPoints points={optimal.characteristics} />
          )}
        </Stack>
        <Stack>
          <div>
            Energy: <DisplayNumberAppropriately number={optimal.energy} />
          </div>
          <DamagingMovesDisplay />
          <OverallStats stats={optimal.overallCharacteristics} />
        </Stack>
      </Stack>
    </Stack>
  );
}
