use std::{
    fmt::Debug,
    ops::{AddAssign, Index, IndexMut, SubAssign},
};

use serde::Serialize;

#[derive(Clone, Debug)]
pub struct Characteristic([i32; 51]);

impl Serialize for Characteristic {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl Index<Stat> for Characteristic {
    type Output = i32;

    fn index(&self, index: Stat) -> &Self::Output {
        &self.0[index as usize]
    }
}

impl IndexMut<Stat> for Characteristic {
    fn index_mut(&mut self, index: Stat) -> &mut Self::Output {
        &mut self.0[index as usize]
    }
}

pub trait Restriction: Debug {
    fn accepts(&self, characteristics: &Characteristic, set_bonus: i32, leniency: i32) -> bool;
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
    fn accepts(&self, characteristics: &Characteristic, set_bonus: i32, leniency: i32) -> bool {
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
    pub value: i32,
}

impl Restriction for RestrictionLeaf {
    fn accepts(&self, characteristics: &Characteristic, _set_bonus: i32, leniency: i32) -> bool {
        let value = characteristics[self.stat];
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

impl Characteristic {
    pub fn new() -> Self {
        Self([(0); 51])
    }

    pub fn iter(&self) -> core::slice::Iter<'_, i32> {
        self.0.iter()
    }
}

impl Default for Characteristic {
    fn default() -> Self {
        Self::new()
    }
}

impl AddAssign<&Self> for Characteristic {
    fn add_assign(&mut self, rhs: &Self) {
        for (a, b) in self.0.iter_mut().zip(rhs.0.iter()) {
            *a += *b;
        }
    }
}

impl SubAssign<&Self> for Characteristic {
    fn sub_assign(&mut self, rhs: &Self) {
        for (a, b) in self.0.iter_mut().zip(rhs.0.iter()) {
            *a -= *b;
        }
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
#[derive(Copy, Clone, Debug, PartialEq, Eq, strum::FromRepr)]
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
                return Ok(Stat::from_repr(index).expect("If in array, value should be in bounds"));
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

pub const STAT_ELEMENT: [Stat; 4] = [
    Stat::Agility,
    Stat::Chance,
    Stat::Strength,
    Stat::Intelligence,
];

#[cfg(test)]
mod tests {
    use super::*;

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
