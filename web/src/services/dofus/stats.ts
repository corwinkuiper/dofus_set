const StatNamesConst = [
  "AP",
  "MP",
  "Range",
  "Vitality",
  "Agility",
  "Chance",
  "Strength",
  "Intelligence",
  "Power",
  "Critical",
  "Wisdom",
  "AP Reduction",
  "AP Parry",
  "MP Reduction",
  "MP Parry",
  "Heals",
  "Lock",
  "Dodge",
  "Initiative",
  "Summons",
  "Prospecting",
  "Pods",
  "Damage",
  "Critical Damage",
  "Neutral Damage",
  "Earth Damage",
  "Fire Damage",
  "Water Damage",
  "Air Damage",
  "Reflect",
  "Trap Damage",
  "Power (traps)",
  "Pushback Damage",
  "% Spell Damage",
  "% Weapon Damage",
  "% Ranged Damage",
  "% Melee Damage",
  "Neutral Resistance",
  "% Neutral Resistance",
  "Earth Resistance",
  "% Earth Resistance",
  "Fire Resistance",
  "% Fire Resistance",
  "Water Resistance",
  "% Water Resistance",
  "Air Resistance",
  "% Air Resistance",
  "Critical Resistance",
  "Pushback Resistance",
  "% Ranged Resistance",
  "% Melee Resistance",
] as const;

// https://github.com/dofuslab/dofuslab/blob/c511a527c5bc4a256dc9fad6009e7b7a750035c3/client/common/constants.ts#L9
const StatIcons = [
  "icon/Action_Point.svg",
  "icon/Movement_Point.svg",
  "icon/Range.svg",
  "icon/Vitality.svg",
  "icon/Agility.svg",
  "icon/Chance.svg",
  "icon/Strength.svg",
  "icon/Intelligence.svg",
  "icon/Power.svg",
  "icon/Critical_Hit.svg",
  "icon/Wisdom.svg",
  "icon/AP_Reduction.svg",
  "icon/AP_Parry.svg",
  "icon/MP_Reduction.svg",
  "icon/MP_Parry.svg",
  "icon/Heals.svg",
  "icon/Lock.svg",
  "icon/Dodge.svg",
  "icon/Initiative.svg",
  "icon/Summon.svg",
  "icon/Prospecting.svg",
  "icon/Pods.svg",
  "icon/Damage.svg",
  "icon/Critical_Damage.svg",
  "icon/Neutral.svg",
  "icon/Strength.svg",
  "icon/Intelligence.svg",
  "icon/Chance.svg",
  "icon/Agility.svg",
  "icon/Reflect.svg",
  "icon/Trap_Damage.svg",
  "icon/Trap_Power.svg",
  "icon/Pushback_Damage.svg",
  "icon/Spell_Damage.svg",
  "icon/Weapon_Damage.svg",
  "icon/Ranged_Damage.svg",
  "icon/Melee_Damage.svg",
  "icon/Neutral_square.svg",
  "icon/Neutral_square.svg",
  "icon/Earth_square.svg",
  "icon/Earth_square.svg",
  "icon/Fire_square.svg",
  "icon/Fire_square.svg",
  "icon/Water_square.svg",
  "icon/Water_square.svg",
  "icon/Air_square.svg",
  "icon/Air_square.svg",
  "icon/Critical_Resistance.svg",
  "icon/Pushback_Resistance.svg",
  "icon/Ranged_Resistance.svg",
  "icon/Melee_Resistance.svg",
];

const statNameIndexLookup = new Map(
  StatNamesConst.map((value, idx) => [value, idx])
);

export type StatName = (typeof StatNamesConst)[number];

function getStatIconUrlFromIndex(stat_index: number): string {
  return `https://d2iuiayak06k8j.cloudfront.net/${StatIcons[stat_index]}`;
}

export function getStatIconUrl(stat: StatName): string {
  return getStatIconUrlFromIndex(statNameIndexLookup.get(stat)!);
}

export function statIndex(stat: StatName): number {
  return statNameIndexLookup.get(stat)!;
}

export const StatNames: readonly StatName[] = StatNamesConst;
