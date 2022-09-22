use std::str::FromStr;
#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Uint128, Decimal, WasmMsg, CosmosMsg, BankMsg, Coin};
use cw2::set_contract_version;
use cw20::{Cw20ExecuteMsg, Cw20QueryMsg, BalanceResponse};


use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::state::{Config, CONFIG, DENOMPRICE};

// version info for migration info
const CONTRACT_NAME: &str = "SWAP_CONTRACT";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {

    let state = Config {
        owner: info.sender.to_string(),
        denom: msg.denom.clone(),
        cw20_contract_address: msg.cw20_contract_address
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    CONFIG.save(deps.storage, &state)?;
    DENOMPRICE.save(deps.storage, &Decimal::zero())?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("owner", info.sender)
        .add_attribute("denom", msg.denom))
}


#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::SetDenomPrice { denom_price } => execute_set_denom_price(deps, info, denom_price),
        ExecuteMsg::SwapFromDenomToToken {  } => execute_swap_from_denom_to_token(deps,_env, info),
        ExecuteMsg::SwapFromTokenToDenom { token_amount } => execute_swap_from_token_to_demon(deps, _env, info, token_amount)
    }
}


fn execute_swap_from_token_to_demon(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_amount: u32
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    let denom_price = DENOMPRICE.load(deps.storage)?;
    let denom_amount = (Decimal::new(Uint128::from((token_amount as u128) * 1000_000_000_000_000_000) ) / denom_price).floor() * Uint128::one();

    // check denom balance of this contract
    let balance = deps
        .querier
        .query_balance(_env.contract.address.clone(), config.denom.clone())?;
    if balance.amount < denom_amount {
        return Err(ContractError::LowDenomBalanceError { val: balance.amount });
    }

    // transfer token
    let transfer_token_from_msg = Cw20ExecuteMsg::TransferFrom {
        owner:  info.sender.to_string(),
        recipient: _env.contract.address.to_string(), 
        amount: Uint128::from(token_amount) 
    };

    let transfer_token_res = CosmosMsg::Wasm(
        WasmMsg::Execute { 
            contract_addr: config.cw20_contract_address.to_string(), 
            msg: to_binary(&transfer_token_from_msg)?, 
            funds: vec![],
    });

    // transfer denom
    let transfer_denom_msg = BankMsg::Send { 
        to_address: info.sender.to_string(), 
        amount: vec![Coin{ denom: config.denom, amount: denom_amount}] 
    };

    let transfer_denom_res = CosmosMsg::Bank(transfer_denom_msg);

    Ok(Response::new()
        .add_attribute("recieved token amount", token_amount.to_string())
        .add_attribute("send denom amount", denom_amount)
        .add_attribute("denom price", denom_price.to_string())
        .add_message(transfer_denom_res)
        .add_message(transfer_token_res)
    )

}



fn execute_swap_from_denom_to_token(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo
) -> Result<Response, ContractError> {
    // Get denom amount
    let config = CONFIG.load(deps.storage)?;
    let sent_amount = info
        .funds
        .iter()
        .find(|c| c.denom == config.denom)
        .map(|c| Uint128::from(c.amount))
        .unwrap_or_else(Uint128::zero);
    
    // Check if denom amount is zero 
    if sent_amount == Uint128::zero() {
        return Err(ContractError::LowAmountError {});
    }

    // Send token
    let denom_price = DENOMPRICE.load(deps.storage)?;
    let token_amount = (Decimal::raw(sent_amount.u128() * 1000_000_000_000_000_000) * denom_price).floor() * Uint128::one();

    // Check current token balance of this pool contract
    let token_balance: BalanceResponse = deps
        .querier
        .query_wasm_smart(config.cw20_contract_address.clone(), &Cw20QueryMsg::Balance { address: _env.contract.address.to_string() })?;
    if token_balance.balance < token_amount {
        return Err(ContractError::LowTokenBalanceError { val: token_balance.balance });
    }

    // transfer token
    let transfer_token_msg = Cw20ExecuteMsg::Transfer { 
        recipient: info.sender.to_string(), 
        amount: token_amount 
    };
    let transfer_token_res = CosmosMsg::Wasm(
        WasmMsg::Execute { 
            contract_addr: config.cw20_contract_address.to_string(), 
            msg: to_binary(&transfer_token_msg)?, 
            funds: vec![],
    });

    Ok(Response::new()
        .add_attribute("recieved denom amount", sent_amount)
        .add_attribute("send token amount", token_amount.to_string())
        .add_attribute("denom price", denom_price.to_string())
        .add_message(transfer_token_res)
    )

}



fn execute_set_denom_price(
    deps: DepsMut,
    info: MessageInfo,
    denom_price: String
) -> Result<Response, ContractError> {
    // Check if sender is owner
    let config = CONFIG.load(deps.storage)?;
    if config.owner != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    DENOMPRICE.save(deps.storage, &Decimal::from_str(&denom_price)?)?;

    Ok(Response::default())
}





#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetDenomPrice {} => to_binary(&query_denom_price(deps)?),
    }
}


fn query_denom_price(deps: Deps) -> StdResult<String> {
    let denom_price = DENOMPRICE.load(deps.storage)?;
    Ok( denom_price.to_string())
}




#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies_with_balance, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};


    #[test]
    fn test_instantiate() {
        let mut deps = mock_dependencies_with_balance(&coins(2, "token"));

        let msg = InstantiateMsg { 
            denom: String::from("token"),
            cw20_contract_address: String::from("cw20_base_contract_address")
        };
        let info = mock_info("creator", &coins(1000, "token"));


        let res = instantiate(deps.as_mut(), mock_env(), info, msg);
        assert!(res.is_ok());

        
        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetDenomPrice{}).unwrap();
        let value: String = from_binary(&res).unwrap();
        assert_eq!(value, "0");
    }


    #[test]
    fn test_set_denom_price() {
        let denom_price = String::from("5.7");

        let mut deps = mock_dependencies_with_balance(&coins(2, "token"));

        let msg = InstantiateMsg { 
            denom: String::from("token"),
            cw20_contract_address: String::from("cw20_base_contract_address")
        };
        let info = mock_info("creator", &coins(1000, "token"));


        let res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());

        let msg = ExecuteMsg::SetDenomPrice { denom_price: denom_price.clone() };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());


        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetDenomPrice{}).unwrap();
        let value: String = from_binary(&res).unwrap();
        assert_eq!(value, denom_price);
    }


    #[test]
    fn test_execute_swap_from_denom_to_token() {
        let denom_price = String::from("5.7");

        let mut deps = mock_dependencies_with_balance(&coins(2, "umlg"));

        let msg = InstantiateMsg { 
            denom: String::from("umlg"),
            cw20_contract_address: String::from("cw20_base_contract_address")
        };
        let info = mock_info("creator", &coins(1000, "umlg"));


        let res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());

        let msg = ExecuteMsg::SetDenomPrice { denom_price: denom_price.clone() };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());


        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetDenomPrice{}).unwrap();
        let value: String = from_binary(&res).unwrap();
        assert_eq!(value, denom_price);
        

        let msg = ExecuteMsg::SwapFromDenomToToken {  };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());
    }


    #[test]
    fn test_execute_swap_from_token_to_denom() {
        let denom_price = String::from("5.7");

        let mut deps = mock_dependencies_with_balance(&coins(2, "umlg"));

        let msg = InstantiateMsg { 
            denom: String::from("umlg"),
            cw20_contract_address: String::from("cw20_base_contract_address")
        };
        let info = mock_info("creator", &coins(1000, "umlg"));


        let res = instantiate(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());

        let msg = ExecuteMsg::SetDenomPrice { denom_price: denom_price.clone() };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());


        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetDenomPrice{}).unwrap();
        let value: String = from_binary(&res).unwrap();
        assert_eq!(value, denom_price);
        

        let msg = ExecuteMsg::SwapFromTokenToDenom { token_amount: (570 as u32) };
        let res = execute(deps.as_mut(), mock_env(), info.clone(), msg);
        assert!(res.is_ok());

    }
}
