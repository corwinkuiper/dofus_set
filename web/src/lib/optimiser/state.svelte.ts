import { getStatIndexForName } from "$lib/dofus/stat-names";
import type { DofusDamagingMove, DofusItem } from "$lib/dofus/types";

function initialBasicStats() {
  const initialBasicStats: number[] = new Array(51).fill(0);
  initialBasicStats[getStatIndexForName("AP")] = 100;
  initialBasicStats[getStatIndexForName("MP")] = 100;
  initialBasicStats[getStatIndexForName("Range")] = 50;
  initialBasicStats[getStatIndexForName("Vitality")] = 0.01;

  return initialBasicStats;
}

interface DofusState {
  level: number;
  basicStat: number[];
  targetStat: (number | null)[];
  rawSpells: DofusDamagingMove[];
  initialItems: (DofusItem | null)[];
  fixedItems: number[];
  bannedItems: DofusItem[];
  banKhardboard: boolean;
  banPetsmount: boolean;
  banPet: boolean;
  banDragoturkey: boolean;
  banRhineetle: boolean;
  banSeemyool: boolean;
  apExo: boolean;
  mpExo: boolean;
  rangeExo: boolean;
  multiElement: boolean;
  considerCharacteristicPoints: boolean;
}

export function initialDofusState(): DofusState {
  return {
    level: 149,
    basicStat: initialBasicStats(),
    targetStat: new Array(51).fill(null),
    rawSpells: [],
    initialItems: new Array(16).fill(null),
    fixedItems: [],
    bannedItems: [],
    banKhardboard: true,
    banPetsmount: false,
    banPet: false,
    banDragoturkey: false,
    banRhineetle: false,
    banSeemyool: false,
    apExo: false,
    mpExo: false,
    rangeExo: false,
    multiElement: false,
    considerCharacteristicPoints: true,
  };
}

export let dofusState = $state<DofusState>(initialDofusState());

interface OptimiserConfig {
  numberOfIterations: number;
  initialTemperature: number;
  continuous: boolean;
}

export let optimiserConfig = $state<OptimiserConfig>({
  numberOfIterations: 10_000_000,
  initialTemperature: 10_000_000,
  continuous: false,
});
