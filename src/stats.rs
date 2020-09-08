pub type StatValue = i32;
pub type Characteristic = [StatValue; 51];

pub trait Restriction {
    fn accepts(&self, characteristics: &Characteristic, set_bonus: i32) -> bool;
}

pub enum BooleanOperator {
    And,
    Or,
}

pub struct RestrictionSet {
    pub operator: BooleanOperator,
    pub restrictions: Vec<Box<dyn Restriction>>,
}

impl Restriction for RestrictionSet {
    fn accepts(&self, characteristics: &Characteristic, set_bonus: i32) -> bool {
        match self.operator {
            BooleanOperator::And => self
                .restrictions
                .iter()
                .all(|restriction| restriction.accepts(characteristics, set_bonus)),
            BooleanOperator::Or => self
                .restrictions
                .iter()
                .any(|restriction| restriction.accepts(characteristics, set_bonus)),
        }
    }
}

pub enum Operator {
    GreaterThan,
    LessThan,
}

pub struct RestrictionLeaf {
    pub operator: Operator,
    pub stat: Stat,
    pub value: StatValue,
}

impl Restriction for RestrictionLeaf {
    fn accepts(&self, characteristics: &Characteristic, _set_bonus: i32) -> bool {
        let value = characteristics[self.stat as usize];

        match self.operator {
            Operator::GreaterThan => value > self.value,
            Operator::LessThan => value < self.value,
        }
    }
}

pub struct SetBonusRestriction {
    pub operator: Operator,
    pub value: i32,
}

impl Restriction for SetBonusRestriction {
    fn accepts(&self, _characteristics: &Characteristic, set_bonus: i32) -> bool {
        match self.operator {
            Operator::GreaterThan => set_bonus > self.value,
            Operator::LessThan => set_bonus < self.value,
        }
    }
}

pub struct NullRestriction;

impl Restriction for NullRestriction {
    fn accepts(&self, _characteristics: &Characteristic, _set_bonus: i32) -> bool {
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
