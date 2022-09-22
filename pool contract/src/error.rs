use cosmwasm_std::{StdError, Uint128};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Custom Error val: {val:?}")]
    CustomError { val: String },

    #[error("Got 0 coins")]
    LowAmountError {},

    #[error("Don't have enough denom. Current denom balance: {val:?}")]
    LowDenomBalanceError {val: Uint128},

    #[error("Don't have enough token. Current token balance: {val:?}")]
    LowTokenBalanceError {val: Uint128}

}
