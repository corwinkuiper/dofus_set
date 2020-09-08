#[path = "stats.rs"]
mod stats;

pub struct Item {
    pub name: String,
    pub item_type: String,
    pub stats: stats::Characteristic,
    pub level: i32,
    pub set_id: Option<i32>,
    pub dofus_id: i32,
    pub restrictions: Option<stats::Restriction>,
}

pub fn parse_items(data: &[u8]) -> Vec<Item> {
    let mut items = vec![];
    let data: serde_json::Value = serde_json::from_slice(data).unwrap();
    for item in data.as_array().unwrap() {
        let name = item
            .get("name")
            .unwrap()
            .get("en")
            .unwrap()
            .as_str()
            .unwrap()
            .to_string();
        let item_type = item.get("itemType").unwrap().as_str().unwrap().to_string();
        let level = item.get("level").unwrap().as_i64().unwrap() as i32;
        let mut set_id = None;
        if let Some(set) = item.get("setID") {
            if let Some(set) = set.as_str() {
                if let Ok(set) = set.parse() {
                    set_id = Some(set)
                }
            }
        }

        let dofus_id: i32 = {
            let id = item.get("dofusID").unwrap();
            if let Some(id) = id.as_str() {
                id.parse().unwrap()
            } else if let Some(id) = id.as_i64() {
                id as i32
            } else {
                panic!()
            }
        };
        let mut stats: stats::Characteristic = stats::new_characteristics();
        if let Some(stat) = item.get("stats") {
            for stat in stat.as_array().unwrap() {
                let characteristic = stat.get("stat").unwrap().as_str().unwrap();
                let value = stat.get("maxStat").unwrap().as_i64().unwrap() as stats::StatValue;
                let characteristic_index = stats::stat_from_str(characteristic).unwrap() as usize;
                stats[characteristic_index] = value;
            }
        }

        let restrictions = None; //todo
        items.push(Item {
            item_type,
            name,
            level,
            set_id,
            dofus_id,
            stats,
            restrictions,
        });
    }
    items
}
