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
const CW20BASECODEID = 1143;
const DENOM = "umlg";
class CW20BaseContract {
    constructor() {
        this.addr = "";
        this.client = null;
        this.defaultFee = { amount: [{ amount: "200000", denom: DENOM, },], gas: "200000", };
        this.contractAddress = "";
    }
    instantiateCW20Base() {
        return __awaiter(this, void 0, void 0, function* () {
            [this.addr, this.client] = yield (0, base_1.useOptions)(base_1.malagaOptions).setup("password", ".cw20_base_contract.key");
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
                mint: {
                    minter: this.addr,
                    cap: null
                },
                marketing: {
                    project: "",
                    description: "",
                    marketing: this.addr,
                    logo: {
                        url: ""
                    }
                }
            };
            const instantiateResponse = yield this.client.instantiate(this.addr, CW20BASECODEID, instantiateMsg, "CW20 Base Contract", this.defaultFee);
            this.contractAddress = instantiateResponse.contractAddress;
            console.log(`CW20 base Contract address is ${this.contractAddress}`);
        });
    }
    executeMintToken(amount, address = this.addr) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const executeMintMsg = {
                mint: {
                    recipient: address,
                    amount: amount
                }
            };
            const executeMintResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.execute(this.addr, this.contractAddress, executeMintMsg, this.defaultFee));
        });
    }
    executeTransferToken(amount, address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const executeTransferTokenMsg = {
                transfer: {
                    recipient: address,
                    amount: amount
                }
            };
            const executeMintResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.execute(this.addr, this.contractAddress, executeTransferTokenMsg, this.defaultFee));
        });
    }
    executeTransferTokenFrom(owner, amount, address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const executeTransferTokenFromMsg = {
                transfer_from: {
                    owner: owner,
                    recipient: address,
                    amount: amount
                }
            };
            const executeMintResponse = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.execute(owner, this.contractAddress, executeTransferTokenFromMsg, this.defaultFee));
            console.log(executeMintResponse);
        });
    }
    queryTokenBalance(address = this.addr) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const queryResult = yield ((_a = this.client) === null || _a === void 0 ? void 0 : _a.queryContractSmart(this.contractAddress, { balance: { address: address } }));
            console.log(`token balance of ${address} is ${queryResult.balance}`);
        });
    }
}
exports.default = CW20BaseContract;
