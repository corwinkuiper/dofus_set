import { getStatIndexForName } from "$lib/dofus/stat-names";
import type { DofusDamagingMove, DofusItem } from "$lib/dofus/types";

const initialBasicStats: number[] = new Array(51).fill(0);
initialBasicStats[getStatIndexForName("AP")] = 100;
initialBasicStats[getStatIndexForName("MP")] = 100;
initialBasicStats[getStatIndexForName("Range")] = 50;
initialBasicStats[getStatIndexForName("Vitality")] = 0.01;

interface DofusState {
  level: number;
  basicStat: number[];
  targetStat: (number | undefined)[];
  rawSpells: DofusDamagingMove[];
  initialItems: (DofusItem | undefined)[];
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

export let dofusState = $state<DofusState>({
  level: 149,
  basicStat: initialBasicStats,
  targetStat: new Array(51).fill(undefined),
  rawSpells: [],
  initialItems: new Array(16).fill(undefined),
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
});

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
