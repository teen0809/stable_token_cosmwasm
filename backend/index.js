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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CW20BaseContract_1 = __importDefault(require("./lib/CW20BaseContract"));
const SwapContract_1 = __importDefault(require("./lib/SwapContract"));
const base_1 = require("./lib/base");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const [address, client] = yield (0, base_1.useOptions)(base_1.malagaOptions).setup("password", ".new.key");
    // instantiate cw20base contract
    const cw20BaseContract = new CW20BaseContract_1.default();
    yield cw20BaseContract.instantiateCW20Base();
    // instantiate swap contract
    const swapContract = new SwapContract_1.default();
    yield swapContract.instantiateSwap(cw20BaseContract.contractAddress);
    // set denom price
    yield swapContract.executeSetDenomPrice("1.5");
    yield swapContract.queryGetDenomPrice();
    // mint token for swap contract
    yield cw20BaseContract.executeMintToken("1000000", swapContract.contractAddress);
    yield cw20BaseContract.queryTokenBalance(swapContract.contractAddress);
    yield cw20BaseContract.executeTransferToken("1000", address);
    yield cw20BaseContract.queryTokenBalance(address);
    // swap from denom to token
    yield swapContract.executeSwapFromDenomToToken(address, "100", client);
    yield cw20BaseContract.queryTokenBalance(address);
    yield cw20BaseContract.queryTokenBalance(swapContract.contractAddress);
    // swap from token to denom
    // @ts-ignore
    yield swapContract.executeSwapFromTokenToDenom(address, "15", client);
    yield cw20BaseContract.queryTokenBalance(address);
});
main();
