import { OptimisationDamagingMove } from "@/services/dofus/optimiser";
import { getStatIconUrl, StatName } from "@/services/dofus/stats";
import { useImmerAtom } from "@/state/state";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import { useCallback } from "react";
import { styled } from "styled-components";
import { Stack } from "../base/stack";
import { Button } from "../base/button";

interface OptimiseDamagingMoveString {
  weight: string;
  baseDamage: string[];
  baseCritDamage: string[];
  baseCritPercent: string;
  critModifyable: boolean;
}

const damagingMovesAtomAtom = atom<PrimitiveAtom<OptimiseDamagingMoveString>[]>(
  []
);

export const damagingMoves = atom<OptimisationDamagingMove[]>((get) =>
  get(damagingMovesAtomAtom)
    .map(get)
    .map((x) => ({
      weight: Number(x.weight),
      baseDamage: x.baseDamage.map(Number),
      baseCritDamage: x.baseCritDamage.map(Number),
      baseCritPercent: Number(x.baseCritPercent),
      critModifyable: x.critModifyable,
    }))
);

const StatIconImg = styled.img`
  height: 15px;
  width: 15px;
`;

function StatIcon({ stat }: { stat: StatName }) {
  return <StatIconImg alt={stat} src={getStatIconUrl(stat)} />;
}

const DamageInput = styled.input`
  max-width: 32px;
`;

const ElementDamageGrid = styled.div`
  display: grid;
  grid-template-columns: auto repeat(5, 1fr);
`;

function DamagingMove({
  move,
}: {
  move: PrimitiveAtom<OptimiseDamagingMoveString>;
}) {
  const [dMove, updateMove] = useImmerAtom(move);

  return (
    <Stack>
      <ElementDamageGrid>
        <span>Stat</span>
        <StatIcon stat="Neutral Damage" />
        <StatIcon stat="Air Damage" />
        <StatIcon stat="Water Damage" />
        <StatIcon stat="Earth Damage" />
        <StatIcon stat="Fire Damage" />
        <span>Base</span>
        {dMove.baseDamage.map((dmg, idx) => (
          <DamageInput
            type="text"
            inputMode="decimal"
            pattern="[0-9]*(.[0-9]*)?"
            key={idx}
            value={dmg}
            onChange={(e) =>
              updateMove((dMove) => {
                dMove.baseDamage[idx] = e.target.value;
              })
            }
          />
        ))}
        <span>Crit</span>
        {dMove.baseCritDamage.map((dmg, idx) => (
          <DamageInput
            type="text"
            inputMode="decimal"
            pattern="[0-9]*(.[0-9]*)?"
            key={idx}
            value={dmg}
            onChange={(e) =>
              updateMove((dMove) => {
                dMove.baseCritDamage[idx] = e.target.value;
              })
            }
          />
        ))}
      </ElementDamageGrid>
      <label>
        Crit chance{" "}
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*(.[0-9]*)?"
          value={dMove.baseCritPercent}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.baseCritPercent = e.target.value;
            })
          }
        />
      </label>
      <label>
        Crit chance modifyable{" "}
        <input
          type="checkbox"
          checked={dMove.critModifyable}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.critModifyable = e.target.checked;
            })
          }
        />
      </label>
      <label>
        Damage weight{" "}
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*(.[0-9]*)?"
          value={dMove.weight}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.weight = e.target.value;
            })
          }
        />
      </label>
    </Stack>
  );
}

export function DamagingMoveInput() {
  const [damagingMoves, setDamagingMoves] = useAtom(damagingMovesAtomAtom);
  const addDamagingMove = useCallback(() => {
    const newDamagingMove = atom<OptimiseDamagingMoveString>({
      weight: "0",
      baseDamage: new Array(5).fill("0"),
      baseCritDamage: new Array(5).fill("0"),
      baseCritPercent: "0",
      critModifyable: true,
    });
    setDamagingMoves((moves) => [...moves, newDamagingMove]);
  }, [setDamagingMoves]);

  const removeDamagingMove = useCallback(
    (atom: PrimitiveAtom<OptimiseDamagingMoveString>) => {
      setDamagingMoves((moves) => moves.filter((x) => x !== atom));
    },
    [setDamagingMoves]
  );

  return (
    <Stack>
      {damagingMoves.map((x) => (
        <Stack $dir="h" key={x.toString()}>
          <DamagingMove move={x} />
          <Button onClick={() => removeDamagingMove(x)}>Delete</Button>
        </Stack>
      ))}
      <Button onClick={addDamagingMove}>Add move</Button>
    </Stack>
  );
}
