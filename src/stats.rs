#[derive(Copy, Clone)]
pub struct Stat {
    min: Option<i64>,
    max: i64,
}

#[derive(Copy, Clone)]
pub struct RestrictionCondition {
    stat: RestrictionStat,
    operator: RestrictionOperator,
    value: i64,
}

#[derive(Copy, Clone)]
pub enum RestrictionStat {
    Vitality,
    Wisdom,
    Strength,
    Intelligence,
    Chance,
    Agility,
    AP,
    MP,
    SetBonus,
}

#[derive(Copy, Clone)]
pub enum RestrictionOperator {
    LessThan,
    GreaterThan,
}

pub struct Restriction {
    restrictions: Vec<RestrictionCondition>,
}

impl Restriction {
    pub fn validate(&self, stats: &Stats) -> bool {
        for condition in self.restrictions.iter() {
            let value = condition.value;
            let stat_value = match condition.stat {
                RestrictionStat::Vitality => stats.vitality.max,
                RestrictionStat::Wisdom => stats.wisdom.max,
                RestrictionStat::Strength => stats.strength.max,
                RestrictionStat::Intelligence => stats.intelligence.max,
                RestrictionStat::Chance => stats.chance.max,
                RestrictionStat::Agility => stats.agility.max,
                RestrictionStat::AP => stats.ap.max,
                RestrictionStat::MP => stats.mp.max,
                RestrictionStat::SetBonus => stats.set_bonus,
            };
            match condition.operator {
                RestrictionOperator::GreaterThan => {
                    if !(stat_value > value) {
                        return false;
                    }
                }
                RestrictionOperator::LessThan => {
                    if !(stat_value < value) {
                        return false;
                    }
                }
            }
        }
        true
    }
}

// every possible stat an item could have
pub struct Stats {
    // main characteristics
    vitality: Stat,
    wisdom: Stat,
    strength: Stat,
    intelligence: Stat,
    chance: Stat,
    agility: Stat,

    ap: Stat,
    mp: Stat,
    initiative: Stat,
    prospecting: Stat,
    range: Stat,
    summons: Stat,
    pods: Stat,

    ap_reduction: Stat,
    ap_parry: Stat,
    mp_reduction: Stat,
    mp_parry: Stat,
    critical: Stat,
    heal: Stat,
    lock: Stat,
    dodge: Stat,

    damage: Stat,
    power: Stat,
    damage_critical: Stat,
    damage_neutral: Stat,
    damage_earth: Stat,
    damage_fire: Stat,
    damage_water: Stat,
    damage_air: Stat,
    reflect: Stat,
    damage_trap: Stat,
    power_trap: Stat,
    damage_pushback: Stat,
    damage_spell: Stat,
    damage_weapon: Stat,
    damage_range: Stat,
    damage_melee: Stat,

    resistance_neutral_fixed: Stat,
    resistance_neutral_percent: Stat,
    resistance_earth_fixed: Stat,
    resistance_earth_percent: Stat,
    resistance_fire_fixed: Stat,
    resistance_fire_percent: Stat,
    resistance_water_fixed: Stat,
    resistance_water_percent: Stat,
    resistance_air_fixed: Stat,
    resistance_air_percent: Stat,
    resistance_critical: Stat,
    resistance_pushback: Stat,
    resistance_range: Stat,
    resistance_melee: Stat,

    set_bonus: i64,
}
