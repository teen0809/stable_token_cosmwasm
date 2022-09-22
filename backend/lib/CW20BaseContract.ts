import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/stargate";
import {useOptions, malagaOptions} from "./base"

const CW20BASECODEID = 1143;
const DENOM = "umlg";

export default class CW20BaseContract {
    public addr: string = "";
    public client: SigningCosmWasmClient | null = null;
    public defaultFee: StdFee = { amount: [{amount: "200000", denom: DENOM,},], gas: "200000",};
    public contractAddress: string = "";

    async instantiateCW20Base (): Promise<void> {
        [this.addr, this.client] = await useOptions(malagaOptions).setup("password", ".cw20_base_contract.key");
        this.client.getAccount(this.addr);
        this.client.getBalance(this.addr, DENOM);

        const instantiateMsg = {
            name: "testStableToken",
            symbol: "STABLETOKEN",
            decimals: 6,
            initial_balances: [
                {
                    address: this.addr,
                    amount: "1000000000"
                }
            ],
            mint:{
                minter: this.addr,
                cap: null
            },
            marketing: {
                project:"",
                description:"",
                marketing: this.addr,
                logo:{
                    url:""
                }
            }
        }
        const instantiateResponse = await this.client.instantiate(this.addr, CW20BASECODEID, instantiateMsg, "CW20 Base Contract", this.defaultFee)
        this.contractAddress = instantiateResponse.contractAddress;
        console.log(`CW20 base Contract address is ${this.contractAddress}`);
    }


    async executeMintToken(amount: string, address: string = this.addr) : Promise<void> {
        const executeMintMsg = {
            mint : {
                recipient: address,
                amount: amount            
            }
        };

        const executeMintResponse = await this.client?.execute(this.addr, this.contractAddress, executeMintMsg, this.defaultFee);
    }


    async executeTransferToken(amount: string, address: string) : Promise<void> {
        const executeTransferTokenMsg = {
            transfer : {
                recipient: address,
                amount: amount
            }
        };

        const executeMintResponse = await this.client?.execute(this.addr, this.contractAddress, executeTransferTokenMsg, this.defaultFee);
    }


    async executeTransferTokenFrom(owner: string, amount: string, address: string) : Promise<void> {
        const executeTransferTokenFromMsg = {
            transfer_from : {
                owner: owner,
                recipient: address,
                amount: amount
            }
        };

        const executeMintResponse = await this.client?.execute(owner, this.contractAddress, executeTransferTokenFromMsg, this.defaultFee);
        console.log(executeMintResponse);
    }


    async queryTokenBalance(address: string = this.addr) : Promise<void> {
        const queryResult = await this.client?.queryContractSmart(this.contractAddress, { balance: {address: address} });
        console.log(`token balance of ${address} is ${queryResult.balance}`);
    }
   
}