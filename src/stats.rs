pub type StatValue = i32;
pub type Characteristic = [StatValue; 51];

pub fn new_characteristics() -> Characteristic {
    [0; 51]
}

pub fn characteristic_add(stats: &mut Characteristic, stat: &Characteristic) {
    for i in 0..stats.len() {
        stats[i] += stat[i];
    }
}

pub fn stat_from_str(s: &str) -> Option<Stat> {
    Some(match s {
        "Vitality" => Stat::Vitality,
        "Wisdom" => Stat::Wisdom,
        "Strength" => Stat::Strength,
        "Intelligence" => Stat::Intelligence,
        "Chance" => Stat::Chance,
        "Agility" => Stat::Agility,

        "AP" => Stat::AP,
        "MP" => Stat::MP,
        "Initiative" => Stat::Initiative,
        "Prospecting" => Stat::Prospecting,
        "Range" => Stat::Range,
        "Summons" => Stat::Summons,
        "pods" => Stat::Pods,

        "AP Reduction" => Stat::APReduction,
        "AP Parry" => Stat::APParry,
        "MP Reduction" => Stat::MPReduction,
        "MP Parry" => Stat::MPParry,
        "Critical" => Stat::Critical,
        "Heals" => Stat::Heal,
        "Lock" => Stat::Lock,
        "Dodge" => Stat::Dodge,

        "Damage" => Stat::Damage,
        "Power" => Stat::Power,
        "Critical Damage" => Stat::DamageCritical,
        "Neutral Damage" => Stat::DamageNeutral,
        "Earth Damage" => Stat::DamageEarth,
        "Fire Damage" => Stat::DamageFire,
        "Water Damage" => Stat::DamageWater,
        "Air Damage" => Stat::DamageAir,
        "Reflect" => Stat::Reflect,
        "Trap Damage" => Stat::DamageTrap,
        "Power (traps)" => Stat::PowerTrap,
        "Pushback Damage" => Stat::DamagePushback,
        "% Spell Damage" => Stat::DamageSpell,
        "% Weapon Damage" => Stat::DamageWeapon,
        "% Ranged Damage" => Stat::DamageRange,
        "% Melee Damage" => Stat::DamageMelee,

        "Neutral Resistance" => Stat::ResistanceNeutralFixed,
        "% Neutral Resistance" => Stat::ResistanceNeutralPercent,
        "Earth Resistance" => Stat::ResistanceEarthFixed,
        "% Earth Resistance" => Stat::ResistanceEarthPercent,
        "Fire Resistance" => Stat::ResistanceFireFixed,
        "% Fire Resistance" => Stat::ResistanceFirePercent,
        "Water Resistance" => Stat::ResistanceWaterFixed,
        "% Water Resistance" => Stat::ResistanceWaterPercent,
        "Air Resistance" => Stat::ResistanceAirFixed,
        "% Air Resistance" => Stat::ResistanceAirPercent,
        "Critical Resistance" => Stat::ResistanceCritical,
        "Pushback Resistance" => Stat::ResistancePushback,
        "% Ranged Resistance" => Stat::ResistanceRange,
        "% Melee Resistance" => Stat::ResistanceMelee,
        _ => return None,
    })
}

// every possible stat an item could have
#[derive(Copy, Clone, Debug)]
pub enum Stat {
    Vitality,
    Wisdom,
    Strength,
    Intelligence,
    Chance,
    Agility,

    AP,
    MP,
    Initiative,
    Prospecting,
    Range,
    Summons,
    Pods,

    APReduction,
    APParry,
    MPReduction,
    MPParry,
    Critical,
    Heal,
    Lock,
    Dodge,

    Damage,
    Power,
    DamageCritical,
    DamageNeutral,
    DamageEarth,
    DamageFire,
    DamageWater,
    DamageAir,
    Reflect,
    DamageTrap,
    PowerTrap,
    DamagePushback,
    DamageSpell,
    DamageWeapon,
    DamageRange,
    DamageMelee,

    ResistanceNeutralFixed,
    ResistanceNeutralPercent,
    ResistanceEarthFixed,
    ResistanceEarthPercent,
    ResistanceFireFixed,
    ResistanceFirePercent,
    ResistanceWaterFixed,
    ResistanceWaterPercent,
    ResistanceAirFixed,
    ResistanceAirPercent,
    ResistanceCritical,
    ResistancePushback,
    ResistanceRange,
    ResistanceMelee,
}
