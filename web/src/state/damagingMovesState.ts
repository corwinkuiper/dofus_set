import {
  SpellDamage,
  OptimisationDamagingMove,
  SpellSpell,
} from "@/services/dofus/optimiser";
import { maxLevelState } from "@/state/state";
import { atom, PrimitiveAtom } from "jotai";

export const damagingMovesSpellAtomAtom = atom<
  PrimitiveAtom<OptimiseDamagingMoveString>[]
>([]);
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

export const damagingMovesRawInputAtomAtom = atom<
  PrimitiveAtom<OptimisationDamagingMove>[]
>([]);

export const damagingMoves = atom<OptimisationDamagingMove[]>((get) => {
  const level = get(maxLevelState);

  const spellInput = get(damagingMovesSpellAtomAtom)
    .map(get)
    .flatMap((x) => {
      const effect = x.spell?.effects.findLast((x) => level >= x.level);

      if (!effect) return [];

      return [
        {
          weight: x.weight,
          baseDamage: damageToArray(effect.normal),
          baseCritDamage: damageToArray(effect.critical),
          baseCritPercent: effect.base_crit ?? 0,
          critModifyable: effect.base_crit !== null,
        },
      ];
    });

  const rawInput = get(damagingMovesRawInputAtomAtom).map(get);

  return [...spellInput, ...rawInput];
});

export interface OptimiseDamagingMoveString {
  weight: number;
  spell: SpellSpell | null;
}
