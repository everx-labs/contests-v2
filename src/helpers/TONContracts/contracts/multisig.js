// @flow
import type {
    TONKeyPairData,
    TONContractDeployParams,
} from 'ton-client-js/types';

const package06052020 = require('./packages/multisig/06052020.js').package;
const package25052020 = require('./packages/safemultisig/25052020').package;

export default class Multisig {
    static contracts = {
        setCodeMultisig: 'SetcodeMultisigWallet',
        safeMultisig: 'SafeMultisigWallet',
    };

    // deploy
    static async multisigDeployParams(keyPair: TONKeyPairData, contractType: string): Promise<TONContractDeployParams> {
        const owners = [
            `0x${keyPair.public}`,
        ]; // only 1 owner (us!) is set at the moment (TODO: change later)
        const reqConfirms = 1; // only 1 confirmation is required at the moment (TODO: change later)
        return {
            package: {
                [this.contracts.setCodeMultisig]: package06052020,
                [this.contracts.safeMultisig]: package25052020,
            }[contractType],
            constructorParams: { owners, reqConfirms },
            keyPair,
        };
    }
}
