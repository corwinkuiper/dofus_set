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
    Some(match s.to_ascii_lowercase().as_str() {
        "vitality" => Stat::Vitality,
        "wisdom" => Stat::Wisdom,
        "strength" => Stat::Strength,
        "intelligence" => Stat::Intelligence,
        "chance" => Stat::Chance,
        "agility" => Stat::Agility,

        "ap" => Stat::AP,
        "mp" => Stat::MP,
        "initiative" => Stat::Initiative,
        "prospecting" => Stat::Prospecting,
        "range" => Stat::Range,
        "summons" => Stat::Summons,
        "pods" => Stat::Pods,

        "ap reduction" => Stat::APReduction,
        "ap parry" => Stat::APParry,
        "mp reduction" => Stat::MPReduction,
        "mp parry" => Stat::MPParry,
        "critical" => Stat::Critical,
        "heals" => Stat::Heal,
        "lock" => Stat::Lock,
        "dodge" => Stat::Dodge,

        "damage" => Stat::Damage,
        "power" => Stat::Power,
        "critical damage" => Stat::DamageCritical,
        "neutral damage" => Stat::DamageNeutral,
        "earth damage" => Stat::DamageEarth,
        "fire damage" => Stat::DamageFire,
        "water damage" => Stat::DamageWater,
        "air damage" => Stat::DamageAir,
        "reflect" => Stat::Reflect,
        "trap damage" => Stat::DamageTrap,
        "power (traps)" => Stat::PowerTrap,
        "pushback damage" => Stat::DamagePushback,
        "% spell damage" => Stat::DamageSpell,
        "% weapon damage" => Stat::DamageWeapon,
        "% ranged damage" => Stat::DamageRange,
        "% melee damage" => Stat::DamageMelee,

        "neutral resistance" => Stat::ResistanceNeutralFixed,
        "% neutral resistance" => Stat::ResistanceNeutralPercent,
        "earth resistance" => Stat::ResistanceEarthFixed,
        "% earth resistance" => Stat::ResistanceEarthPercent,
        "fire resistance" => Stat::ResistanceFireFixed,
        "% fire resistance" => Stat::ResistanceFirePercent,
        "water resistance" => Stat::ResistanceWaterFixed,
        "% water resistance" => Stat::ResistanceWaterPercent,
        "air resistance" => Stat::ResistanceAirFixed,
        "% air resistance" => Stat::ResistanceAirPercent,
        "critical resistance" => Stat::ResistanceCritical,
        "pushback resistance" => Stat::ResistancePushback,
        "% ranged resistance" => Stat::ResistanceRange,
        "% melee resistance" => Stat::ResistanceMelee,
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
