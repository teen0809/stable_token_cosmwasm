"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const SWAPCONTRACCODEID = 1142;
class SwapContract {
    constructor() {
        this.addr = "";
        this.client = null;
        this.defaultFee = { amount: [{ amount: "300000", denom: "umlg", },], gas: "300000", };
        this.contractAddress = "";
    }
    instantiateSwap(cw20BaseContractAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            [this.addr, this.client] = yield (0, base_1.useOptions)(base_1.malagaOptions).setup("password", ".swap_contract.key");
            this.client.getAccount(this.addr);
            const balance = yield this.client.getBalance(this.addr, "umlg");
            console.log(` balance is ${balance.amount} denom is ${balance.denom}`);
            const instantiateMsg = {
                denom: "umlg",
                cw20_contract_address: cw20BaseContractAddress
            };
            const instantiateResponse = yield this.client.instantiate(this.addr, SWAPCONTRACCODEID, instantiateMsg, "Swap Contract", this.defaultFee);
            this.contractAddress = instantiateResponse.contractAddress;
            console.log(`Swap Congtract address is ${this.contractAddress}`);
        });
    }
    executeSetDenomPrice(price) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const executeSetDenomPriceMsg = {
                set_denom_price: {
                    denom_price: price
                }
            };
            const executeMintResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.execute(this.addr, this.contractAddress, executeSetDenomPriceMsg, this.defaultFee));
            console.log(executeMintResponse);
        });
    }
    executeSwapFromDenomToToken(address, amount, client) {
        return __awaiter(this, void 0, void 0, function* () {
            const executeSwapFromDenomToTokenMsg = {
                swap_from_denom_to_token: {}
            };
            const sentAmount = {
                denom: "umlg",
                amount: amount
            };
            const executeSwapFromDenomToTokenResponse = yield client.execute(address, this.contractAddress, executeSwapFromDenomToTokenMsg, this.defaultFee, "Swap token", [
                sentAmount
            ]);
            // console.log(executeSwapFromDenomToTokenResponse?.logs[0].events.map(item => console.log(item)));
        });
    }
    executeSwapFromTokenToDenom(address, token_amount, client) {
        return __awaiter(this, void 0, void 0, function* () {
            const executeSwapFromDenomToTokenMsg = {
                swap_from_token_to_denom: {
                    token_amount: 15
                }
            };
            const executeMintResponse = yield client.execute(address, this.contractAddress, executeSwapFromDenomToTokenMsg, this.defaultFee);
            console.log(executeMintResponse);
        });
    }
    queryGetDenomPrice() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const queryResult = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.queryContractSmart(this.contractAddress, { get_denom_price: {} }));
            console.log(`denom price is  ${queryResult}`);
        });
    }
}
exports.default = SwapContract;
