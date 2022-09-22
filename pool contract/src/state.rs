use cosmwasm_std::Decimal;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cw_storage_plus::Item;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub owner: String,
    pub denom: String,
    pub cw20_contract_address: String
}


pub const CONFIG: Item<Config> = Item::new("config");
pub const DENOMPRICE: Item<Decimal> = Item::new("denom_price");