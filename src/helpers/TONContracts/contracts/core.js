// @flow
import { TONAddressStringVariant } from 'ton-client-js/src/modules/TONContractsModule';
import type {
    TONKeyPairData,
    TONContractCreateRunBodyParams,
    TONContractMessage,
    TONContractRunMessage,
    TONContractRunParams,
    TONContractDeployParams,
} from 'ton-client-js/types';

import { TONNetworks } from '../../TONWallet';
import type { TONNetName } from '../../TONWallet';

import { TONLog } from '../../TONUtility';

type Msg = {
    messageBodyBase64: string,
    messageId: string,
    messageIdBase64: string,
};

export type DeployMessage = {
    address: string,
    message: Msg,
};

type FunctionInput = {
    [string]: *,
}

type RunParams = {
    address: string,
    abi: any,
    keyPair?: TONKeyPairData,
    functionName: string,
    input: FunctionInput,
}

type base64params = {
    test: boolean,
    bounce: boolean,
    url: boolean,
};

type convertParams = {
    address: string,
    convertTo: $Values<typeof TONAddressStringVariant>;
    base64Params?: base64params,
}

const TON_ADDRESS_LENGTH = 64;
const emptyAddress = '0:0000000000000000000000000000000000000000000000000000000000000000';

const log = new TONLog('Core');

const deployingContracts: { [string]: true } = {}; // marks already deploying contracts
const sponsoringContracts: { [string]: true } = {}; // marks already sponsoring contracts

function getKeyForContract(
    address: string,
    netName: TONNetName = TONNetworks.defaultNetwork.netName,
): string {
    return `${address}~${netName}`;
}

export default class Core {
    static emptyAddress = emptyAddress;

    // deploy
    static isContractDeploying(
        address: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): boolean {
        const key = getKeyForContract(address, netName);
        return !!deployingContracts[key];
    }

    static setContractDeploying(
        address: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
        deploying: boolean = true,
    ): void {
        const key = getKeyForContract(address, netName);
        if (deploying) {
            deployingContracts[key] = true;
        } else {
            delete deployingContracts[key];
        }
    }

    static isContractSponsoring(
        address: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): boolean {
        const key = getKeyForContract(address, netName);
        return !!sponsoringContracts[key];
    }

    static setContractSponsoring(
        address: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
        sponsoring: boolean = true,
    ): void {
        const key = getKeyForContract(address, netName);
        if (sponsoring) {
            sponsoringContracts[key] = true;
        } else {
            delete sponsoringContracts[key];
        }
    }

    static async deployMessage(
        deployParams: TONContractDeployParams,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): Promise<DeployMessage> {
        const client = TONNetworks.findClientByName(netName);
        return client.contracts.createDeployMessage(deployParams);
    }

    // run
    static async runContract<T: {}>(
        params: RunParams,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
        runLocal: boolean = false,
    ): Promise<T> {
        const client = TONNetworks.findClientByName(netName);
        const { contracts } = client;

        let result;
        try {
            if (runLocal) {
                // eslint-disable-next-line
                delete params.keyPair; // Just to ensure that nobody is passing keys here!!!
                result = await contracts.runLocal(params);
            } else {
                result = await contracts.run(params);
            }
        } catch (error) {
            log.error(`
                Function "${params.functionName}" failed to run${runLocal ? ' locally' : ''} with error:
             `, error);
            throw error;
        }
        // We made it `any` on purpose, as we can't statically check things from contracts
        // We let a user to define what value she expects from that method
        const value: any = result?.output || result?.transaction || {};
        return value;
    }

    // run body
    static async createRunBody(params: TONContractCreateRunBodyParams): Promise<string> {
        const netName: TONNetName = TONNetworks.netNames.privatnet;
        const client = TONNetworks.findClientByName(netName);
        const runBody = await client.contracts.createRunBody(params);
        log.debug('run body ', runBody.bodyBase64);
        return runBody.bodyBase64;
    }

    /**
     * Create message for processing to network
     * @see processRunMessage
     */
    static async createRunMessage(
        params: TONContractRunParams,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): Promise<TONContractRunMessage> {
        const client = TONNetworks.findClientByName(netName);
        const runMessage = await client.contracts.createRunMessage(params);

        log.debug('create run message ', runMessage);
        return runMessage;
    }

    /**
     * Process created message to network
     * @see createRunMessage
     */
    static async processRunMessage(
        message: TONContractMessage,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): Promise<string> {
        const client = TONNetworks.findClientByName(netName);
        const messageResult = await client.contracts.sendMessage(message);

        log.debug('process run message ', messageResult);
        return messageResult;
    }

    // utils
    static async getCodeFromImage(
        imageBase64: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): Promise<string> {
        const client = TONNetworks.findClientByName(netName);
        return (await client.contracts.getCodeFromImage({
            imageBase64,
        })).codeBase64;
    }

    static async getHashCode(
        codeBase64: string,
        netName: TONNetName = TONNetworks.defaultNetwork.netName,
    ): Promise<string> {
        const client = TONNetworks.findClientByName(netName);
        return (await client.contracts.getBocHash({
            bocBase64: codeBase64,
        })).hash;
    }

    static async convertAddressToBase64(
        address: string,
        test: boolean = true,
        bounce: boolean = true,
    ): Promise<?string> {
        try {
            return (await Core.convertAddress({
                address,
                convertTo: TONAddressStringVariant.Base64,
                base64Params: {
                    test,
                    bounce,
                    url: true, // for compatibility with telegram wallet
                },
            })).address;
        } catch (error) {
            log.error('Error, converting address to base64:', error);
            return null;
        }
    }

    static async convertAddressToHex(address: string): Promise<?string> {
        try {
            return (await Core.convertAddress({
                address,
                convertTo: TONAddressStringVariant.Hex,
            })).address;
        } catch (error) {
            log.error('Error, converting address to hex:', error);
            return null;
        }
    }

    static async convertAddress(params: convertParams) {
        // eslint-disable-next-line prefer-destructuring
        const netName: TONNetName = TONNetworks.defaultNetwork.netName;
        const client = TONNetworks.findClientByName(netName);
        return client.contracts.convertAddress(params);
    }

    static async isAddressValid(rawAddress: string) {
        // FIXME: when issue will be resolved
        // https://github.com/tonlabs/ton-client-js/issues/91
        const address = rawAddress.replace(/[^:0-9a-zA-Z\-_+/=]/g, '');
        let isAddressValid = false;
        if (!address) {
            return isAddressValid;
        }
        try {
            isAddressValid = !!(await this.convertAddressToHex(address));
        } catch (err) {
            isAddressValid = false;
        }
        return isAddressValid;
    }

    static validateAddressLength(address: string): string {
        // if zeros from address start were removed by SDK
        const diff = TON_ADDRESS_LENGTH - address.length;
        if (diff === 0) {
            return address;
        }
        // generate string consisted of '0' and with length = diff
        const zeros = new Array(diff + 1).join('0');
        return `${zeros}${address}`;
    }

    static removeZeroX(address: string): string {
        return address.substr(0, 2) === '0x'
            ? Core.validateAddressLength(address.substr(2))
            : Core.validateAddressLength(address);
    }

    static addZeroX(address: string): string {
        return address.substr(0, 2) !== '0x'
            ? `0x${Core.validateAddressLength(address)}`
            : `0x${Core.removeZeroX(address)}`;
    }
}
