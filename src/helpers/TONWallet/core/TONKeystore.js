// @flow
import type {
    TONHDKeyFromMnemonicParams,
    TONMnemonicDeriveSignKeysParams,
    TONMnemonicIsValidParams,
    TONMnemonicFromEntropyParams,
    TONMnemonicWordsParams,
} from 'ton-client-js/types';

import TONNetworks from '../networks';

// TODO: Move this logic required for Ethereum out of this class
// [START] CONSTs to remove
const CryptoJS = require('crypto-js');

const EC = require('elliptic').ec;

const SECP256k1 = new EC('secp256k1');
// [END] CONSTs to remove

const nonceLength = 24;

const currentKeystoreVersion = 5;
const dropSupportKeystoreVersion = 4;

type Base64 = string;
export type Hex = string;
type KeyPair = {
    public: Hex,
    secret: Hex,
};

export type EncryptedString = {
    encStr: Base64,
    nonce: Base64,
};

export type EncryptedKey = {
    key: Base64,
    nonce: Base64,
};

export type PrivateKeyData = {
    privKey: Hex,
    encPrivKey: EncryptedKey,
};

export type WordsParams = $Exact<TONMnemonicWordsParams>;

// Private methods
export function bufferToHex(buffer: Buffer): Hex {
    return buffer.toString('hex');
}

export function hexToBuffer(hex: Hex): Buffer {
    return Buffer.from(hex, 'hex');
}

export function hexToBase64(hex: Hex): Base64 {
    return hexToBuffer(hex).toString('base64');
}

export function hexToArray(hex: Hex): Uint8Array {
    return new Uint8Array(hexToBuffer(hex).buffer);
}

export function hexToString(hex: Hex): string {
    return hexToBuffer(hex).toString();
}

export function base64ToHex(base64: Base64): Hex {
    return bufferToHex(Buffer.from(base64, 'base64'));
}

export function arrayToHex(array: Uint8Array) {
    return bufferToHex(Buffer.from(array));
}

export function stringToHex(string: string): Hex {
    return bufferToHex(Buffer.from(string));
}

function strip0x(input: Hex): string {
    if (typeof (input) !== 'string') {
        return input;
    } else if (input.length >= 2 && input.slice(0, 2) === '0x') {
        return input.slice(2);
    }
    return input;
}

function add0x(input: string): Hex {
    if (typeof (input) !== 'string') {
        return input;
    } else if (input.length < 2 || input.slice(0, 2) !== '0x') {
        return `0x${input}`;
    }
    return input;
}

function leftPadString(stringToPad: string, padChar: string, length: number): string {
    let repeatedPadChar = '';
    for (let i = 0; i < length; i += 1) {
        repeatedPadChar += padChar;
    }
    return ((repeatedPadChar + stringToPad).slice(-length));
}

async function encryptString(string: string, pwDerivedKey: Hex): Promise<EncryptedString> {
    const nonce: Hex = await TONNetworks.crypto.randomGenerateBytes(nonceLength);
    const encStr: Base64 = await TONNetworks.crypto.naclSecretBox({
        message: { text: string },
        nonce,
        key: pwDerivedKey,
        outputEncoding: 'Base64',
    });
    return {
        encStr,
        nonce: hexToBase64(nonce),
    };
}

function generateSalt(byteCount: number = 32): Promise<Base64> {
    return TONNetworks.crypto.randomGenerateBytes(byteCount, 'Base64');
}

async function decryptString(encryptedStr: EncryptedString, pwDerivedKey: Hex): Promise<string> {
    return TONNetworks.crypto.naclSecretBoxOpen({
        message: { base64: encryptedStr.encStr },
        nonce: base64ToHex(encryptedStr.nonce),
        key: pwDerivedKey,
        outputEncoding: 'Text',
    });
}

async function encryptKey(privKey: Hex, pwDerivedKey: Hex): Promise<EncryptedKey> {
    const nonce: Hex = await TONNetworks.crypto.randomGenerateBytes(nonceLength);
    const key: Base64 = await TONNetworks.crypto.naclSecretBox({
        message: { hex: privKey },
        nonce,
        key: pwDerivedKey,
        outputEncoding: 'Base64',
    });
    return {
        key,
        nonce: hexToBase64(nonce),
    };
}

async function decryptKey(encryptedKey: EncryptedKey, pwDerivedKey: Hex): Promise<Hex> {
    return TONNetworks.crypto.naclSecretBoxOpen({
        message: { base64: encryptedKey.key },
        nonce: base64ToHex(encryptedKey.nonce),
        key: pwDerivedKey,
        outputEncoding: 'Hex',
    });
}

function computeAddressFromPrivKey(privKey: Hex): Hex {
    // TODO: this is required for Ethereum. Probably need to get rid of it and move to Ethereum.
    // Also, if this happens, it might be that addresses should be removed from serialized Keystore
    const keyPair = SECP256k1.genKeyPair();
    // eslint-disable-next-line
    keyPair._importPrivate(privKey, 'hex');
    const compact = false;
    const pubKey = keyPair.getPublic(compact, 'hex').slice(2);
    // TODO: get rid of CryptoJS
    const pubKeyWordArray = CryptoJS.enc.Hex.parse(pubKey);
    const hash = CryptoJS.SHA3(pubKeyWordArray, { outputLength: 256 });
    const address = hash.toString(CryptoJS.enc.Hex).slice(24);
    return address;
}

// This function is tested using the test vectors here:
// http://www.di-mgt.com.au/sha_testvectors.html
async function concatAndSha256(entropyBuf0: Buffer, entropyBuf1: Buffer): Promise<Buffer> {
    const totalEnt = Buffer.concat([entropyBuf0, entropyBuf1]);
    if (totalEnt.length !== entropyBuf0.length + entropyBuf1.length) {
        throw new Error('Logic error! Concatenation of entropy sources failed.');
    }
    const totalEntHex = arrayToHex(new Uint8Array(totalEnt));
    return hexToBuffer(await TONNetworks.crypto.sha256({ hex: totalEntHex }));
}

export const notActualKeystoreVersionError = new Error('Not an actual version of serialized keystore. Please, convert it to the latest version.');

const hdWalletParams: WordsParams = {
    wordCount: 12, // Regular length for a crypto wallet
    dictionary: 1, // ENGLISH
};

const tonWalletParams: WordsParams = {
    wordCount: 24, // As per Telegram
    dictionary: 0, // TON
};

export default class TONKeystore {
    static walletParams: { [string]: WordsParams } = {
        hd: hdWalletParams,
        ton: tonWalletParams,
    };

    static async createVault(options: {
        hdPathString: string,
        mnemonic: string,
        wordsParams?: WordsParams,
        password: string,
        salt?: string,
    }): Promise<{ keystore: TONKeystore, pwDerivedKey: Hex }> {
        // Default hdPathString
        if (!options.hdPathString) {
            throw new Error("Keystore: Must include hdPathString in createVault inputs. Suggested alternatives are m/0'/0'/0' for previous lightwallet default, or m/44'/60'/0'/0 for BIP44 (used by Jaxx & MetaMask)");
        }
        if (!options.mnemonic) {
            throw new Error('Keystore: Must include mnemonic in createVault inputs.');
        }
        const { mnemonic, password, hdPathString } = options;
        const wordsParams = options.wordsParams || hdWalletParams;
        const salt = options.salt || (await generateSalt(32));
        const pwDerivedKey: Hex = await TONKeystore.deriveKeyFromPasswordAndSalt(password, salt);
        const keystore = new TONKeystore();
        await keystore.init(mnemonic, wordsParams, pwDerivedKey, hdPathString, salt);
        return { keystore, pwDerivedKey };
    }

    // Generates a random seed. If the optional string
    // extraEntropy is set, a random set of entropy
    // is created, then concatenated with extraEntropy
    // and hashed to produce the entropy that gives the seed.
    // Thus if extraEntropy comes from a high-entropy source
    // (like dice) it can give some protection from a bad RNG.
    // If extraEntropy is not set, the random number generator
    // is used directly.
    static async generateRandomSeed(
        wordsParams: WordsParams = hdWalletParams,
        extraEntropy?: string,
    ): Promise<string> {
        let seed = '';
        if (extraEntropy === undefined) {
            seed = await TONNetworks.crypto.mnemonicFromRandom(wordsParams);
        } else if (typeof extraEntropy === 'string') {
            const entBuf = Buffer.from(extraEntropy);
            const randBuf = hexToBuffer(await TONNetworks.crypto.randomGenerateBytes(32));
            const hashedEnt = (await concatAndSha256(randBuf, entBuf)).slice(0, 16);
            const params: TONMnemonicFromEntropyParams = {
                ...wordsParams,
                entropy: { hex: bufferToHex(hashedEnt) },
            };
            seed = await TONNetworks.crypto.mnemonicFromEntropy(params);
        } else {
            throw new Error('generateRandomSeed: extraEntropy is set but not a string.');
        }
        return seed.toString();
    }

    static async mnemonicWords(
        wordsParams: WordsParams = hdWalletParams,
    ): Promise<string[]> {
        const words = await TONNetworks.crypto.mnemonicWords(wordsParams);
        return words.split(' '); // split in Array
    }

    static async generateHDRootKeyFromMnemonic(
        hdPathString: string,
        mnemonic: string,
        wordsParams: WordsParams = hdWalletParams,
    ) {
        const { crypto } = TONNetworks;
        const params: TONHDKeyFromMnemonicParams = {
            ...wordsParams,
            phrase: mnemonic,
        };
        const master = await crypto.hdkeyXPrvFromMnemonic(params);
        return crypto.hdkeyXPrvDerivePath(master, hdPathString, false);
    }

    // N.B. By default we use Root Private Key to import TON wallet keys via Telegram mnemonic
    static async generateRootKeyFromMnemonic(
        mnemonic: string,
        wordsParams: WordsParams = tonWalletParams,
    ) {
        const { crypto } = TONNetworks;
        const params: TONMnemonicDeriveSignKeysParams = {
            ...wordsParams,
            phrase: mnemonic,
        };
        const rootKey = (await crypto.mnemonicDeriveSignKeys(params)).secret;
        return rootKey;
    }

    static async isSeedValid(
        mnemonic: string,
        wordsParams: WordsParams = hdWalletParams,
    ): Promise<boolean> {
        const params: TONMnemonicIsValidParams = {
            ...wordsParams,
            phrase: mnemonic,
        };
        return TONNetworks.crypto.mnemonicIsValid(params);
    }

    static deserialize(keystore: string): ?TONKeystore {
        const jsonKS = JSON.parse(keystore);
        if (jsonKS.version === undefined || jsonKS.version !== currentKeystoreVersion) {
            if (jsonKS.version <= dropSupportKeystoreVersion) {
                return null;
            }
            throw notActualKeystoreVersionError;
        }
        // Create keystore
        const keystoreX = new TONKeystore();
        keystoreX.salt = jsonKS.salt;
        keystoreX.hdPathString = jsonKS.hdPathString;
        keystoreX.encSeed = jsonKS.encSeed;
        keystoreX.encRootPriv = jsonKS.encRootPriv;
        keystoreX.encHdRootPriv = jsonKS.encHdRootPriv;
        keystoreX.version = jsonKS.version;
        keystoreX.hdIndex = jsonKS.hdIndex;
        keystoreX.encPrivKeys = jsonKS.encPrivKeys;
        keystoreX.addresses = jsonKS.addresses;
        return keystoreX;
    }

    static async deriveKeyFromPasswordAndSalt(
        password: string,
        salt: string = 'lightwalletSalt',
    ): Promise<Hex> {
        const logN = 14;
        const r = 8;
        const p = 1;
        const dkLen = 32;
        const hexDerKey: Hex = await TONNetworks.crypto.scrypt({
            password: { text: password },
            salt: { text: salt },
            logN,
            r,
            p,
            dkLen,
        });
        return hexDerKey;
    }

    static async keypairFromPrivateKey(privateKey: Hex): Promise<KeyPair> {
        const keys = await TONNetworks.crypto.naclSignKeypairFromSecretKey(privateKey);
        return {
            public: keys.public, // 32 bytes
            secret: keys.secret.substr(0, 64), // 32 bytes (actually, now it equals to privateKey)
        };
    }

    salt: string;
    hdPathString: string;
    encSeed: ?EncryptedString;
    encRootPriv: ?EncryptedString; // Used for TON wallet
    encHdRootPriv: ?EncryptedString; // Used for our HD wallet
    version: number;
    hdIndex: number;
    encPrivKeys: Object;
    addresses: Hex[];

    async init(
        mnemonic: string,
        wordsParams: WordsParams,
        pwDerivedKey: Hex,
        hdPathString: string,
        salt: string,
    ) {
        this.salt = salt;
        this.hdPathString = hdPathString;
        this.encSeed = undefined;
        this.encRootPriv = undefined;
        this.encHdRootPriv = undefined;
        this.version = currentKeystoreVersion;
        this.hdIndex = 0;
        this.encPrivKeys = {};
        this.addresses = [];

        if ((typeof pwDerivedKey !== 'undefined') && (typeof mnemonic !== 'undefined')) {
            if (!await TONKeystore.isSeedValid(mnemonic, wordsParams)) {
                throw new Error('TONKeystore: Invalid mnemonic');
            }

            // Encrypt the mnemonic seed
            this.encSeed = await encryptString(mnemonic, pwDerivedKey);

            // Generate HD Path root private key for HD Wallet
            const hdRootKey = await TONKeystore.generateHDRootKeyFromMnemonic(
                hdPathString,
                mnemonic,
                wordsParams,
            );
            this.encHdRootPriv = await encryptString(hdRootKey, pwDerivedKey);

            // Generate the first private key
            await this.generateNewKeys(pwDerivedKey, 1);

            // Leave the encRootPriv key empty. You can import it after the initialization though.
            // [DISABLED] Generate root private key for TON
        }
    }

    async isDerivedKeyCorrect(pwDerivedKey: Hex): Promise<boolean> {
        if (!this.encSeed) {
            throw new Error('Enc seed is not yet initialized');
        }
        const paddedSeed = await decryptString(this.encSeed, pwDerivedKey);
        return paddedSeed.length > 0;
    }

    async generateHDPrivateKeys(
        pwDerivedKey: Hex,
        n: number = 1,
        handler: ?((keys: PrivateKeyData, stop: () => void) => void),
    ): Promise<PrivateKeyData[]> {
        if (!await this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        if (!this.encHdRootPriv) {
            throw new Error('Enc HDRoot priv not yet initialized');
        }
        const hdRootKey = await decryptString(this.encHdRootPriv, pwDerivedKey);
        if (!hdRootKey.length) {
            throw new Error('Provided password derived key is wrong');
        }
        let stop = false;
        const stopKeysGeneration = () => {
            stop = true;
        };
        const keys = [];
        const promises = [];
        const promiseForIndex: (i: number) => Promise<void> = async (i: number) => {
            if (stop) {
                return;
            }
            const hdPrivDerivedKey = await TONNetworks.crypto.hdkeyXPrvDerive(
                hdRootKey,
                this.hdIndex,
                false,
                false,
            );
            this.hdIndex = this.hdIndex + 1; // an hdIndex of the next private key of the wallet!

            let privKeyHex = await TONNetworks.crypto.hdkeyXPrvSecret(hdPrivDerivedKey);

            const privKeyBuffer = hexToBuffer(privKeyHex);
            if (privKeyBuffer.length < 16) {
                // Way too small key, something must have gone wrong
                // Halt and catch fire
                throw new Error('Private key suspiciously small: < 16 bytes. Aborting!');
            } else if (privKeyBuffer.length < 32) {
                // Pad private key if too short
                // Bitcore has a bug where it sometimes returns
                // truncated keys
                privKeyHex = leftPadString(privKeyHex, '0', 64);
            } else if (privKeyBuffer.length > 32) {
                throw new Error('Private key larger than 32 bytes. Aborting!');
            }
            // eslint-disable-next-line
            const encPrivKey = await encryptKey(privKeyHex, pwDerivedKey);

            const keyObj = {
                privKey: privKeyHex,
                encPrivKey,
            };
            keys[i] = keyObj;

            if (handler) {
                handler(keyObj, stopKeysGeneration);
            }
        };
        for (let i = 0; i < n; i += 1) {
            promises.push(promiseForIndex(i));
        }
        await Promise.all(promises);
        return keys;
    }

    serialize(): string {
        const jsonKS = {
            encSeed: this.encSeed,
            encRootPriv: this.encRootPriv,
            encHdRootPriv: this.encHdRootPriv,
            addresses: this.addresses,
            encPrivKeys: this.encPrivKeys,
            hdPathString: this.hdPathString,
            salt: this.salt,
            hdIndex: this.hdIndex,
            version: this.version,
        };
        return JSON.stringify(jsonKS);
    }

    getAddresses(): Hex[] {
        const prefixedAddresses = this.addresses.map(addr => {
            return add0x(addr);
        });
        return prefixedAddresses;
    }

    async getSeed(pwDerivedKey: Hex): Promise<string> {
        if (!await this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        if (!this.encSeed) {
            throw new Error('Enc seed is not yet initialized');
        }
        const paddedSeed = await decryptString(this.encSeed, pwDerivedKey);
        return paddedSeed.trim();
    }

    hasRootPrivateKey(): boolean {
        return !!this.encRootPriv;
    }

    deleteRootPrivateKey(): void {
        this.encRootPriv = undefined;
    }

    // N.B. By default we use Root Private Key to import TON wallet keys via Telegram mnemonic
    async importRootPrivateKey(
        pwDerivedKey: Hex,
        mnemonic: string,
        wordsParams: WordsParams = tonWalletParams,
    ): Promise<void> {
        if (!await TONKeystore.isSeedValid(mnemonic, wordsParams)) {
            throw new Error('TONKeystore: Invalid mnemonic');
        }
        const rootKey = await TONKeystore.generateRootKeyFromMnemonic(mnemonic, wordsParams);
        this.encRootPriv = await encryptString(rootKey, pwDerivedKey);
    }

    async exportRootPrivateKey(pwDerivedKey: Hex): Promise<Hex> {
        if (!await this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        if (!this.encRootPriv) {
            throw new Error('Enc root private key is not yet initialized');
        }
        return decryptString(this.encRootPriv, pwDerivedKey);
    }

    async exportHDPrivateKey(address: Hex, pwDerivedKey: Hex): Promise<Hex> {
        if (!await this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        const addr = strip0x(address).toLowerCase();
        if (this.encPrivKeys[addr] === undefined) {
            throw new Error('Address not found in Keystore');
        }
        const encPrivKey = this.encPrivKeys[addr];
        const privKey = await decryptKey(encPrivKey, pwDerivedKey);
        return privKey;
    }

    async exportRootSignKeys(pwDerivedKey: Hex): Promise<KeyPair> {
        const privateKey = await this.exportRootPrivateKey(pwDerivedKey);
        return TONKeystore.keypairFromPrivateKey(privateKey);
    }

    async exportHDSignKeys(pwDerivedKey: Hex, hdIndex: number = 0): Promise<KeyPair> {
        const addresses = this.getAddresses();
        const address = addresses[hdIndex];
        if (!address) {
            throw new Error(`No address specifed for hdIndex = "${hdIndex}" in Keychain`);
        }
        const privateKey: Hex = await this.exportHDPrivateKey(address, pwDerivedKey);
        return TONKeystore.keypairFromPrivateKey(privateKey);
    }

    async generateNewKeys(
        pwDerivedKey: Hex,
        n: number = 1,
        handler: ?((address: Hex, stop: () => void) => void),
    ): Promise<void> {
        if (!await this.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        if (!this.encSeed) {
            throw new Error('generateNewAddress: No seed set');
        }
        let stop = false;
        const stopAddressesGeneration = () => {
            stop = true;
        };
        await this.generateHDPrivateKeys(pwDerivedKey, n, (keyObj, stopKeysGeneration) => {
            const address = computeAddressFromPrivKey(keyObj.privKey); // Same as ETH address
            this.encPrivKeys[address] = keyObj.encPrivKey;
            this.addresses.push(address);
            if (handler) {
                handler(add0x(address), stopAddressesGeneration);
            }
            if (stop) {
                stopKeysGeneration();
            }
        });
    }

    async keyFromPassword(password: string): Promise<Hex> {
        return TONKeystore.deriveKeyFromPasswordAndSalt(password, this.salt);
    }

    hasAddress(address: Hex): boolean {
        const addrToCheck = strip0x(address);
        return !!this.encPrivKeys[addrToCheck];
    }

    reEncryptKeys = async (oldPwDerivedKey: Hex, newPwDerivedKey: Hex) => {
        if (this.encSeed) {
            const seed = await decryptString(this.encSeed, oldPwDerivedKey);
            this.encSeed = await encryptString(seed, newPwDerivedKey);
        }

        if (this.encRootPriv) {
            const encRootPriv = await decryptString(this.encRootPriv, oldPwDerivedKey);
            this.encRootPriv = await encryptString(encRootPriv, newPwDerivedKey);
        }

        if (this.encHdRootPriv) {
            const encHdRootPriv = await decryptString(this.encHdRootPriv, oldPwDerivedKey);
            this.encHdRootPriv = await encryptString(encHdRootPriv, newPwDerivedKey);
        }

        return Promise.all(Object.keys(this.encPrivKeys).map(async (key: string) => {
            const value: EncryptedKey = this.encPrivKeys[key];
            const decryptedPrivKey = await decryptKey(value, oldPwDerivedKey);
            this.encPrivKeys[key] = await encryptKey(decryptedPrivKey, newPwDerivedKey);
        }));
    };
}
