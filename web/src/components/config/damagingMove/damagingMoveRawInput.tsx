import { Button } from "@/components/base/button";
import { InputDecimal } from "@/components/base/input";
import { Stack } from "@/components/base/stack";
import { OptimisationDamagingMove } from "@/services/dofus/optimiser";
import { getStatIconUrl, StatName } from "@/services/dofus/stats";
import { damagingMovesRawInputAtomAtom } from "@/state/damagingMovesState";
import { useImmerAtom } from "@/state/state";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import { useCallback } from "react";
import { styled } from "styled-components";

const StatIconImg = styled.img`
  height: 15px;
  width: 15px;
`;

function StatIcon({ stat }: { stat: StatName }) {
  return <StatIconImg alt={stat} src={getStatIconUrl(stat)} />;
}

const DamageInput = styled(InputDecimal)`
  max-width: 32px;
`;

const InputDecimalSized = styled(InputDecimal)`
  width: 100%;
`;

const ElementDamageGrid = styled.div`
  display: grid;
  grid-template-columns: auto repeat(5, 1fr);
`;

const LabelledInput = styled.label`
  display: flex;
  gap: 4px;
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
                dMove.baseDamage[idx] = e;
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
                dMove.baseCritDamage[idx] = e;
              })
            }
          />
        ))}
      </ElementDamageGrid>
      <LabelledInput>
        Crit chance{" "}
        <InputDecimalSized
          value={dMove.baseCritPercent}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.baseCritPercent = e;
            })
          }
        />
      </LabelledInput>
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
      <LabelledInput>
        Damage weight{" "}
        <InputDecimalSized
          value={dMove.weight}
          onChange={(e) =>
            updateMove((dMove) => {
              dMove.weight = e;
            })
          }
        />
      </LabelledInput>
    </Stack>
  );
}

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  gap: 16px;

  & > li {
    margin: 0;
    width: min-content;
    white-space: nowrap;
  }
`;

export function DamagingMoveRawInput() {
  const [damagingMoves, setDamagingMoves] = useAtom(
    damagingMovesRawInputAtomAtom
  );
  const addDamagingMove = useCallback(() => {
    const newDamagingMove = atom<OptimisationDamagingMove>({
      weight: 0,
      baseDamage: new Array(5).fill(0),
      baseCritDamage: new Array(5).fill(0),
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
      <Button onClick={addDamagingMove}>Add move</Button>
      <List>
        {damagingMoves.map((x) => (
          <li key={x.toString()}>
            <Stack $dir="h">
              <DamagingMove move={x} />
              <Button onClick={() => removeDamagingMove(x)}>Delete</Button>
            </Stack>
          </li>
        ))}
      </List>
    </Stack>
  );
}
