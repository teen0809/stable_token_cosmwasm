import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StdFee, Coin } from "@cosmjs/stargate";
import {useOptions, malagaOptions} from "./base"

const SWAPCONTRACCODEID = 1142;

export default class SwapContract {
    public addr: string = "";
    public client: SigningCosmWasmClient | null = null;
    public defaultFee: StdFee = { amount: [{amount: "300000", denom: "umlg",},], gas: "300000",};
    public contractAddress: string = "";


    async instantiateSwap (cw20BaseContractAddress: string): Promise<void> {
        [this.addr, this.client] = await useOptions(malagaOptions).setup("password", ".swap_contract.key");
        this.client.getAccount(this.addr);
        const balance = await this.client.getBalance(this.addr,"umlg");

        console.log(` balance is ${balance.amount} denom is ${balance.denom}`);
        

        const instantiateMsg = {
            denom: "umlg",
            cw20_contract_address: cw20BaseContractAddress
        }
        const instantiateResponse = await this.client.instantiate(this.addr, SWAPCONTRACCODEID, instantiateMsg, "Swap Contract", this.defaultFee)
        this.contractAddress = instantiateResponse.contractAddress;
        console.log(`Swap Congtract address is ${this.contractAddress}`);
    }


    async executeSetDenomPrice (price: string) : Promise<void> {
        const executeSetDenomPriceMsg = {
            set_denom_price : {
                denom_price: price
            }
        }
        const executeMintResponse = await this.client?.execute(this.addr, this.contractAddress, executeSetDenomPriceMsg, this.defaultFee);
        console.log(executeMintResponse);
    }


    async executeSwapFromDenomToToken(address: string, amount: string, client: SigningCosmWasmClient) : Promise<void> {
        const executeSwapFromDenomToTokenMsg = {
            swap_from_denom_to_token : {}
        }
        const sentAmount: Coin = {
            denom: "umlg",
            amount: amount
        }

        const executeSwapFromDenomToTokenResponse = await client.execute(
            address,
            this.contractAddress, 
            executeSwapFromDenomToTokenMsg, 
            this.defaultFee,
            "Swap token",
            [
                sentAmount
            ]
        );
        // console.log(executeSwapFromDenomToTokenResponse?.logs[0].events.map(item => console.log(item)));
    }


    async executeSwapFromTokenToDenom(address: string, token_amount: string, client: SigningCosmWasmClient) : Promise<void> {
        const executeSwapFromDenomToTokenMsg = {
            swap_from_token_to_denom : {
                token_amount : 15
            }
        };
        const executeMintResponse = await client.execute(address, this.contractAddress, executeSwapFromDenomToTokenMsg, this.defaultFee);
        console.log(executeMintResponse);
    }

    async queryGetDenomPrice () : Promise<void> {
        const queryResult = await this.client?.queryContractSmart(this.contractAddress, {get_denom_price: {}});
        console.log(`denom price is  ${queryResult}`);
    }
}