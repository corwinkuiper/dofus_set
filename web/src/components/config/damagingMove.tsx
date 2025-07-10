import {
  OptimisationDamagingMove,
  SpellDamage,
  SpellSpell,
} from "@/services/dofus/optimiser";
import { getSpells, maxLevelState, useImmerAtom } from "@/state/state";
import { atom, PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { useCallback, useId } from "react";
import { Stack } from "../base/stack";
import { Button } from "../base/button";
import { InputDecimal } from "../base/input";
import { styled } from "styled-components";
import { makeUrl } from "../item";

interface OptimiseDamagingMoveString {
  weight: string;
  spell: SpellSpell | null;
}

const spellsAtom = atom(() => getSpells());
const classAtom = atom<string | null>(null);
const spellClasses = atom(async (get) =>
  (await get(spellsAtom)).map((x) => x.name)
);
const spellsForSelectedClass = atom(async (get) => {
  const _class = get(classAtom);
  if (!_class) return null;

  const spells = await get(spellsAtom);

  return spells.find((x) => x.name === _class);
});

const damagingMovesAtomAtom = atom<PrimitiveAtom<OptimiseDamagingMoveString>[]>(
  []
);

function damageToArray(damage: SpellDamage | null): number[] {
  if (!damage) return Array(5).fill(0);

  return [
    damage.neutral,
    damage.air,
    damage.water,
    damage.earth,
    damage.fire,
  ].map((x) => (x.min + x.max) / 2);
}

export const damagingMoves = atom<OptimisationDamagingMove[]>((get) => {
  const level = get(maxLevelState);

  return get(damagingMovesAtomAtom)
    .map(get)
    .flatMap((x) => {
      const effect = x.spell?.effects.findLast((x) => level >= x.level);

      if (!effect) return [];

      return [
        {
          weight: Number(x.weight),
          baseDamage: damageToArray(effect.normal),
          baseCritDamage: damageToArray(effect.critical),
          baseCritPercent: effect.base_crit ?? 0,
          critModifyable: effect.base_crit !== null,
        },
      ];
    });
});

const DamagingMoveGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-right: 16px;
`;

interface DamagingMoveProps {
  move: PrimitiveAtom<OptimiseDamagingMoveString>;
}

const SpellImage = styled.img`
  width: 64px;
  height: 64px;
  margin-right: 16px;
`;

function DamagingMove({ move }: DamagingMoveProps) {
  const [moveValue, setMove] = useImmerAtom(move);
  const spellsForClass = useAtomValue(spellsForSelectedClass);

  const weightId = useId();
  const spellId = useId();

  return (
    <Stack $dir="h">
      <DamagingMoveGrid>
        <label htmlFor={weightId}>Weight:</label>
        <InputDecimal
          id={weightId}
          value={moveValue.weight}
          onChange={(evt) =>
            setMove((move) => {
              move.weight = evt.target.value;
            })
          }
        />
        <label htmlFor={spellId}>Spell:</label>
        <select
          id={spellId}
          value={moveValue.spell?.name}
          onChange={(evt) =>
            setMove((move) => {
              move.spell =
                spellsForClass?.spells.find(
                  (x) => x.name === evt.target.value
                ) ?? null;
            })
          }
        >
          <option value="">Select a spall</option>
          {spellsForClass?.spells.map((x) => (
            <option key={x.name} value={x.name}>
              {x.name}
            </option>
          ))}
        </select>
      </DamagingMoveGrid>
      {moveValue.spell && (
        <SpellImage
          src={makeUrl(moveValue.spell?.image_url)}
          alt="Spell icon"
        />
      )}
    </Stack>
  );
}

function ChooseClass() {
  const [_class, setClass] = useAtom(classAtom);
  const classes = useAtomValue(spellClasses);

  return (
    <label>
      Select a class:
      <select
        value={_class ?? ""}
        onChange={(evt) => setClass(evt.target.value || null)}
      >
        <option value="">Select a class</option>
        {classes.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DamagingMoveInput() {
  const [damagingMoves, setDamagingMoves] = useAtom(damagingMovesAtomAtom);
  const addDamagingMove = useCallback(() => {
    const newDamagingMove = atom<OptimiseDamagingMoveString>({
      weight: "1",
      spell: null,
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
      <ChooseClass />
      <ul>
        {damagingMoves.map((x) => (
          <li key={x.toString()}>
            <Stack $dir="h">
              <DamagingMove move={x} />
              <Button onClick={() => removeDamagingMove(x)}>Delete</Button>
            </Stack>
          </li>
        ))}
      </ul>
      <Button onClick={addDamagingMove}>Add move</Button>
    </Stack>
  );
}
