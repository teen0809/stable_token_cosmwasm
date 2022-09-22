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
exports.useOptions = exports.malagaOptions = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const stargate_1 = require("@cosmjs/stargate");
const proto_signing_1 = require("@cosmjs/proto-signing");
const path_1 = __importDefault(require("path"));
exports.malagaOptions = {
    httpUrl: 'https://rpc.malaga-420.cosmwasm.com',
    networkId: 'malaga-420',
    bech32prefix: 'wasm',
    feeToken: 'umlg',
    faucetUrl: 'https://faucet.malaga-420.cosmwasm.com/credit',
    hdPath: (0, proto_signing_1.makeCosmoshubPath)(0),
    // @ts-ignore
    defaultKeyFile: path_1.default.join(process.env.HOME, ".malaga.key"),
    fees: {
        upload: 2500000,
        init: 1000000,
        exec: 500000,
    },
    gasPrice: stargate_1.GasPrice.fromString("0.25umlg"),
};
const uniOptions = {
    httpUrl: 'https://rpc.uni.juno.deuslabs.fi',
    networkId: 'uni',
    bech32prefix: 'juno',
    feeToken: 'ujunox',
    faucetUrl: 'https://faucet.uni.juno.deuslabs.fi/credit',
    hdPath: (0, proto_signing_1.makeCosmoshubPath)(0),
    // @ts-ignore
    defaultKeyFile: path_1.default.join(process.env.HOME, ".uni.key"),
    fees: {
        upload: 6000000,
        init: 500000,
        exec: 200000,
    },
    gasPrice: stargate_1.GasPrice.fromString("0.025ujunox"),
};
const useOptions = (options) => {
    const loadOrCreateWallet = (options, filename, password) => __awaiter(void 0, void 0, void 0, function* () {
        let encrypted;
        try {
            encrypted = fs_1.default.readFileSync(filename, 'utf8');
        }
        catch (err) {
            // generate if no file exists
            const wallet = yield proto_signing_1.DirectSecp256k1HdWallet.generate(12, { hdPaths: [options.hdPath], prefix: options.bech32prefix });
            const encrypted = yield wallet.serialize(password);
            fs_1.default.writeFileSync(filename, encrypted, 'utf8');
            return wallet;
        }
        // otherwise, decrypt the file (we cannot put deserialize inside try or it will over-write on a bad password)
        const wallet = yield proto_signing_1.DirectSecp256k1HdWallet.deserialize(encrypted, password);
        return wallet;
    });
    const connect = (wallet, options) => __awaiter(void 0, void 0, void 0, function* () {
        const clientOptions = {
            prefix: options.bech32prefix
        };
        return yield cosmwasm_stargate_1.SigningCosmWasmClient.connectWithSigner(options.httpUrl, wallet, clientOptions);
    });
    const hitFaucet = (faucetUrl, address, denom) => __awaiter(void 0, void 0, void 0, function* () {
        yield axios_1.default.post(faucetUrl, { denom, address });
    });
    const setup = (password, filename) => __awaiter(void 0, void 0, void 0, function* () {
        const keyfile = filename || options.defaultKeyFile;
        const wallet = yield loadOrCreateWallet(options, keyfile, password);
        const client = yield connect(wallet, options);
        const [account] = yield wallet.getAccounts();
        // ensure we have some tokens
        if (options.faucetUrl) {
            const tokens = yield client.getBalance(account.address, options.feeToken);
            if (tokens.amount === '0') {
                console.log(`Getting ${options.feeToken} from faucet`);
                yield hitFaucet(options.faucetUrl, account.address, options.feeToken);
            }
        }
        return [account.address, client];
    });
    const recoverMnemonic = (password, filename) => __awaiter(void 0, void 0, void 0, function* () {
        const keyfile = filename || options.defaultKeyFile;
        const wallet = yield loadOrCreateWallet(options, keyfile, password);
        return wallet.mnemonic;
    });
    return { setup, recoverMnemonic };
};
exports.useOptions = useOptions;
