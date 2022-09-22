import CW20BaseContract from "./lib/CW20BaseContract";
import SwapContract from "./lib/SwapContract";
import {useOptions, malagaOptions} from "./lib/base"


const main = async () => {
    const [address, client] = await useOptions(malagaOptions).setup("password",".new.key");

    // instantiate cw20base contract
    const cw20BaseContract = new CW20BaseContract();
    await cw20BaseContract.instantiateCW20Base();

    // instantiate swap contract
    const swapContract = new SwapContract();
    await swapContract.instantiateSwap(cw20BaseContract.contractAddress);

    // set denom price
    await swapContract.executeSetDenomPrice("1.5");
    await swapContract.queryGetDenomPrice();

    // mint token for swap contract
    await cw20BaseContract.executeMintToken("1000000", swapContract.contractAddress);
    await cw20BaseContract.queryTokenBalance(swapContract.contractAddress);

    await cw20BaseContract.executeTransferToken("1000", address);
    await cw20BaseContract.queryTokenBalance(address);

    // swap from denom to token
    await swapContract.executeSwapFromDenomToToken(address, "100", client);
    await cw20BaseContract.queryTokenBalance(address);
    await cw20BaseContract.queryTokenBalance(swapContract.contractAddress);

    // swap from token to denom
    // @ts-ignore
    await swapContract.executeSwapFromTokenToDenom(address, "15", client);
    await cw20BaseContract.queryTokenBalance(address);

}

main();