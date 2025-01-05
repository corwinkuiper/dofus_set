import { OptimisationDamagingMove } from "@/services/dofus/optimiser";
import { getStatIconUrl, StatName } from "@/services/dofus/stats";
import { useImmerAtom } from "@/state/state";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import { useCallback } from "react";
import { styled } from "styled-components";
import { Stack } from "../base/stack";
import { bin } from "@/assets/bin.svg";

export const damagingMovesAtomAtom = atom<
  PrimitiveAtom<OptimisationDamagingMove>[]
>([]);

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
  move: PrimitiveAtom<OptimisationDamagingMove>;
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
            key={idx}
            value={dmg}
            onChange={(e) =>
              updateMove((dMove) => {
                dMove.baseDamage[idx] = Number(e.target.value);
              })
            }
          />
        ))}
        <span>Crit</span>
        {dMove.baseCritDamage.map((dmg, idx) => (
          <DamageInput
            key={idx}
            value={dmg}
            onChange={(e) =>
              updateMove((dMove) => {
                dMove.baseCritDamage[idx] = Number(e.target.value);
              })
            }
          />
        ))}
      </ElementDamageGrid>
      <label>
        Crit chance{" "}
        <input
          type="number"
          value={dMove.baseCritPercent}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.baseCritPercent = Number(e.target.value);
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
          type="number"
          value={dMove.weight}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.weight = Number(e.target.value);
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
    const newDamagingMove = atom<OptimisationDamagingMove>({
      weight: 0,
      baseDamage: [0, 0, 0, 0, 0],
      baseCritDamage: [0, 0, 0, 0, 0],
      baseCritPercent: 0,
      critModifyable: true,
    });
    setDamagingMoves((moves) => [...moves, newDamagingMove]);
  }, [setDamagingMoves]);

  const removeDamagingMove = useCallback(
    (atom: PrimitiveAtom<OptimisationDamagingMove>) => {
      setDamagingMoves((moves) => moves.filter((x) => x !== atom));
    },
    [setDamagingMoves]
  );

  return (
    <Stack>
      {damagingMoves.map((x) => (
        <Stack $dir="h" key={x.toString()}>
          <DamagingMove move={x} />
          <button onClick={() => removeDamagingMove(x)}>Delete</button>
        </Stack>
      ))}
      <button onClick={addDamagingMove}>Add move</button>
    </Stack>
  );
}
