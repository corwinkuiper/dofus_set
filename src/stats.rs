use std::{convert::TryInto, fmt::Debug};

pub type StatValue = i32;
pub type Characteristic = [StatValue; 51];

pub trait Restriction: Debug {
    fn accepts(
        &self,
        characteristics: &Characteristic,
        set_bonus: i32,
        leniency: StatValue,
    ) -> bool;
}

#[derive(Debug)]
pub enum BooleanOperator {
    And,
    Or,
}

#[derive(Debug)]
pub struct RestrictionSet {
    pub operator: BooleanOperator,
    pub restrictions: Vec<Box<dyn Restriction + Sync + Send>>,
}

impl Restriction for RestrictionSet {
    fn accepts(
        &self,
        characteristics: &Characteristic,
        set_bonus: i32,
        leniency: StatValue,
    ) -> bool {
        match self.operator {
            BooleanOperator::And => self
                .restrictions
                .iter()
                .all(|restriction| restriction.accepts(characteristics, set_bonus, leniency)),
            BooleanOperator::Or => self
                .restrictions
                .iter()
                .any(|restriction| restriction.accepts(characteristics, set_bonus, leniency)),
        }
    }
}

#[derive(Debug)]
pub enum Operator {
    GreaterThan,
    LessThan,
}

#[derive(Debug)]
pub struct RestrictionLeaf {
    pub operator: Operator,
    pub stat: Stat,
    pub value: StatValue,
}

impl Restriction for RestrictionLeaf {
    fn accepts(
        &self,
        characteristics: &Characteristic,
        _set_bonus: i32,
        leniency: StatValue,
    ) -> bool {
        let value = characteristics[self.stat as usize];
        let lenient = !(self.stat == Stat::AP || self.stat == Stat::MP);
        let leniency = if lenient { leniency } else { 0 };
        match self.operator {
            Operator::GreaterThan => value + leniency > self.value,
            Operator::LessThan => value - leniency < self.value,
        }
    }
}

#[derive(Debug)]
pub struct SetBonusRestriction {
    pub operator: Operator,
    pub value: i32,
}

impl Restriction for SetBonusRestriction {
    fn accepts(&self, _characteristics: &Characteristic, set_bonus: i32, _leniency: i32) -> bool {
        match self.operator {
            Operator::GreaterThan => set_bonus > self.value,
            Operator::LessThan => set_bonus < self.value,
        }
    }
}

#[derive(Debug)]
pub struct NullRestriction;

impl Restriction for NullRestriction {
    fn accepts(&self, _characteristics: &Characteristic, _set_bonus: i32, _leniency: i32) -> bool {
        true
    }
}

pub fn new_characteristics() -> Characteristic {
    [0; 51]
}

pub fn characteristic_add(stats: &mut Characteristic, stat: &Characteristic) {
    for i in 0..stats.len() {
        stats[i] += stat[i];
    }
}

pub fn characteristic_sub(stats: &mut Characteristic, stat: &Characteristic) {
    for i in 0..stats.len() {
        stats[i] -= stat[i];
    }
}

const STAT_NAMES: &[&str] = &[
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
    "pods",
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
];

// every possible stat an item could have
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
#[allow(dead_code)]
pub enum Stat {
    AP,
    MP,
    Range,
    Vitality,
    Agility,
    Chance,
    Strength,
    Intelligence,
    Power,
    Critical,
    Wisdom,

    APReduction,
    APParry,
    MPReduction,
    MPParry,
    Heal,
    Lock,
    Dodge,
    Initiative,
    Summons,
    Prospecting,
    Pods,

    Damage,
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

impl std::convert::TryFrom<usize> for Stat {
    type Error = &'static str;
    fn try_from(value: usize) -> Result<Self, Self::Error> {
        if value > Stat::ResistanceMelee as usize {
            Err("Cannot convert too large value")
        } else {
            Ok(unsafe { std::mem::transmute(value as u8) })
        }
    }
}

impl std::convert::TryFrom<&str> for Stat {
    type Error = &'static str;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let value = value.to_ascii_lowercase();
        for (index, stat_name) in STAT_NAMES
            .iter()
            .map(|x| x.to_ascii_lowercase())
            .enumerate()
        {
            if *stat_name == value {
                return index.try_into();
            }
        }

        Err("Cannot find stat type")
    }
}

impl std::fmt::Display for Stat {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        let s = STAT_NAMES[*self as usize];
        write!(f, "{}", s)
    }
}

pub fn stat_is_element(n: usize) -> bool {
    n >= Stat::Agility as usize && n <= Stat::Intelligence as usize
}

pub const STAT_ELEMENT: [usize; 4] = [
    Stat::Agility as usize,
    Stat::Chance as usize,
    Stat::Strength as usize,
    Stat::Intelligence as usize,
];

#[cfg(test)]
mod tests {
    use super::*;
    use std::convert::TryFrom;
    #[test]
    fn stat_try_from() {
        assert_eq!(1_usize.try_into(), Ok(Stat::MP));
    }

    #[test]
    #[should_panic]
    fn stat_try_from_overflow() {
        Stat::try_from(60_usize).unwrap();
    }

    #[test]
    fn stat_convert_from_str() {
        assert_eq!("Vitality".try_into(), Ok(Stat::Vitality));
        assert_eq!("Agility".try_into(), Ok(Stat::Agility));
        assert_eq!("AgIlITY".try_into(), Ok(Stat::Agility));
    }

    #[test]
    fn stat_convert_to_str() {
        assert_eq!(Stat::Vitality.to_string(), "Vitality");
        assert_eq!(Stat::ResistanceAirFixed.to_string(), "Air Resistance");
    }
}
