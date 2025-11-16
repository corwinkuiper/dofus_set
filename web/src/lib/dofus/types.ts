export type DofusCharacteristics = number[];

export interface LocalisedString {
  en: string;
  fr: string;
}

export interface DofusItem {
  name: LocalisedString;
  itemType: string;
  level: number;
  imageUrl: string;
  dofusId: number;
  characteristics: DofusCharacteristics;
}

export interface DofusOptimiserConfig {
  weights: number[];
  targets: (number | null)[];
  maxLevel: number;
  initialItems: (number | null)[];
  fixedItems: number[];
  bannedItems: number[];
  apExo: boolean;
  mpExo: boolean;
  rangeExo: boolean;
  multiElement: boolean;
  changedItemWeight: number;
  damagingMovesWeights: DofusDamagingMove[];
  considerCharacteristics: boolean;
}

export interface DofusSetBonus {
  name: LocalisedString;
  numberOfItems: number;
  characteristics: number[];
}

export interface DofusDamagingMove {
  weight: number;
  baseDamage: number[];
  baseCritDamage: number[];
  baseCritPercent: number;
  critModifyable: boolean;
}

export interface DofusOptimiserSettings {
  iterations: number;
  initialTemperature: number;
}

export interface DofusSpellElementDamage {
  min: number;
  max: number;
}

export interface DofusSpellDamage {
  neutral: DofusSpellElementDamage;
  air: DofusSpellElementDamage;
  water: DofusSpellElementDamage;
  earth: DofusSpellElementDamage;
  fire: DofusSpellElementDamage;
}

export interface DofusSpellEffect {
  level: number;
  base_crit: number | undefined;
  normal: DofusSpellDamage | undefined;
  critical: DofusSpellDamage | undefined;
}

export interface DofusSpell {
  name: LocalisedString;
  level: number;
  description: LocalisedString;
  image_url: string;
  effects: DofusSpellEffect[];
}

export interface DofusSpellClass {
  name: LocalisedString;
  spells: DofusSpell[];
}

export interface DofusOptimiserResult {
  energy: number;
  overallCharacteristics: number[];
  items: (DofusItem | undefined)[];
  setBonuses: DofusSetBonus[];
  characteristics: number[];
  valid: boolean;
  damagingMoveAverageBaseDamage: number[];
}
