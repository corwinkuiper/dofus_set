import { getSpells, useImmerAtom } from "@/state/state";
import { atom, PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { useCallback, useId } from "react";
import { Stack } from "../base/stack";
import { Button } from "../base/button";
import { InputDecimal } from "../base/input";
import { styled } from "styled-components";
import { makeUrl } from "../../services/makeUrl";
import {
  damagingMovesAtomAtom,
  OptimiseDamagingMoveString,
} from "../../state/damagingMovesState";
import { useClientAtom } from "@/hooks/useClientAtom";

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
  const spellForSelectedClassAtom = useClientAtom(spellsForSelectedClass, null);
  const spellsForClass = useAtomValue(spellForSelectedClassAtom);

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
          value={spellsForClass?.spells.findIndex((x) => x == moveValue.spell)}
          onChange={(evt) =>
            setMove((move) => {
              const selectedSpell = Number(evt.target.value);
              move.spell = spellsForClass?.spells.at(selectedSpell) ?? null;
            })
          }
        >
          <option value="">Select a spell</option>
          {spellsForClass?.spells.map((x, idx) => (
            <option key={`${x.name} - ${idx}`} value={idx}>
              {x.name} ({x.effects.map((x) => x.level).join(", ")})
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
  const spellClassesAtom = useClientAtom(spellClasses, []);
  const classes = useAtomValue(spellClassesAtom);

  return (
    <label>
      Select a class:{" "}
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
