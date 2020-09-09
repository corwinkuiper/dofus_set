const StatNames = [
    "Vitality",
    "Wisdom",
    "Strength",
    "Intelligence",
    "Chance",
    "Agility",

    "AP",
    "MP",
    "Initiative",
    "Prospecting",
    "Range",
    "Summons",
    "Pods",

    "APReduction",
    "APParry",
    "MPReduction",
    "MPParry",
    "Critical",
    "Heal",
    "Lock",
    "Dodge",

    "Damage",
    "Power",
    "DamageCritical",
    "DamageNeutral",
    "DamageEarth",
    "DamageFire",
    "DamageWater",
    "DamageAir",
    "Reflect",
    "DamageTrap",
    "PowerTrap",
    "DamagePushback",
    "DamageSpell",
    "DamageWeapon",
    "DamageRange",
    "DamageMelee",

    "ResistanceNeutralFixed",
    "ResistanceNeutralPercent",
    "ResistanceEarthFixed",
    "ResistanceEarthPercent",
    "ResistanceFireFixed",
    "ResistanceFirePercent",
    "ResistanceWaterFixed",
    "ResistanceWaterPercent",
    "ResistanceAirFixed",
    "ResistanceAirPercent",
    "ResistanceCritical",
    "ResistancePushback",
    "ResistanceRange",
    "ResistanceMelee",
];

const IdForStatName = (name: string) => StatNames.findIndex(statName => statName === name)

export {
    StatNames,
    IdForStatName
}