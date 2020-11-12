// @flow
import BigNumber from 'bignumber.js';

import {
    UIFunction,
    UILocalized,
    UIAlertView,
} from '../../services/UIKit/UIKit';

import { TONAsync, TONLog } from '../TONUtility';

import TONKeystore, { arrayToHex, stringToHex } from './core/TONKeystore';

import TONNetworks from './networks';
import TONTokens from './TONTokens';
import TONWalletSerializer from './TONWalletSerializer';

import TON from './chains/TON';
import Ethereum from './chains/Ethereum';

import type { TONNetName } from './networks/types';
import type { TONToken } from './TONTokens';
import type { Hex } from './core/TONKeystore';

type Address = string;
type ValidatePasswordCallback = (error: ?Error, any) => void;
export type PasswordProvider = (
    showHUD: boolean | string,
    callback: (password: ?string, hideHUD: ?((onHidden?: () => void) => void)) => void,
    options: ?Object,
) => void;

// Wallet instances
let walletInstance = null;
let emptyInstance = null;

const log = new TONLog('TONTokensWallet');

export const chainNotSupportedError = new Error('Chain is not supported');
export const tokenNotSupportedError = new Error('Token is not supported');
export const tokenNotPartOfTONChain = new Error('Token is not a part of TON chain');
export const walletNotInitializedError = new Error('Wallet is not initialized');

export default class TONTokensWallet {
    static log = log;

    static ErrorStrings = {
        NoPassword: 'No password',
        NoPwDerivedKey: 'No pwDerivedKey',
    };

    static noPasswordError = new Error(TONTokensWallet.ErrorStrings.NoPassword);
    static noDerivedKeyError = new Error(TONTokensWallet.ErrorStrings.NoPwDerivedKey);

    // HDPath strings for wallets
    static HDPathString = { // BIP44
        TON: 'm/44\'/396\'/0\'/0', // wallet for TON
        ETH: 'm/44\'/60\'/0\'/0', // wallet for ETH
    };

    static Ethereum = Ethereum;

    // Wrong password alert supporting all platforms
    static showWrongPasswordAlert(callback: () => void) {
        UIAlertView.showAlert(UILocalized.WrongPassword, '', [
            {
                title: UILocalized.OK,
                onPress: () => {
                    if (callback) {
                        callback();
                    }
                },
            },
        ]);
    }

    // One of the key functions to start working with
    // Returns stored general wallet if there is one
    // This function also responsible for upgrading the wallet if there is such a need
    static getStoredWallet(passwordProvider: PasswordProvider): ?TONTokensWallet {
        return TONWalletSerializer.storedWallet(passwordProvider);
    }

    // General wallet instance
    static setWalletInstance(wallet: ?TONTokensWallet) {
        walletInstance = wallet;
    }

    static getWalletInstance(): ?TONTokensWallet {
        return walletInstance;
    }

    static async waitForWallet(): Promise<TONTokensWallet> {
        return TONAsync.withInterval(50, () => {
            return walletInstance && walletInstance.ton ? walletInstance : undefined;
        });
    }

    static async ensureWalletWithIndex(hdIndex: number = 0): Promise<TONTokensWallet> {
        const wallet = await TONTokensWallet.waitForWallet();
        const { keystore } = wallet?.ton || {}; // to suppress @flow warning
        if (keystore) { // ensure the index by checking keystore computed address
            await TONAsync.withInterval(1000, () => {
                return keystore.addresses[hdIndex];
            });
        }
        return wallet;
    }

    // Empty wallet. Used only for `call` requests
    static getEmptyInstance(): TONTokensWallet {
        if (!emptyInstance) {
            // $FlowFixMe
            emptyInstance = new TONTokensWallet();
            emptyInstance.connectToBlockchain();
        }
        return emptyInstance;
    }

    // Password validation
    static validatePassword(password: string, callback: ValidatePasswordCallback) {
        if (walletInstance) {
            walletInstance.validatePassword(password, callback);
        } else if (callback) {
            callback(walletNotInitializedError); // not valid
        }
    }

    // Seed phrase
    static async isSeedPhraseValid(seedPhrase: string) {
        const normalized = UIFunction.normalizeKeyPhrase(seedPhrase);
        return TONKeystore.isSeedValid(normalized);
    }

    static async fetchSeedPhrase(
        showHUD: boolean = UILocalized.ExportingBackupPhrase,
        forcePrompt: boolean = true,
    ) {
        if (walletInstance) {
            return walletInstance.fetchSeedPhrase(showHUD, forcePrompt);
        }
        throw new Error('No wallet instance set to fetch the seed phrase');
    }

    static getAddress(currency: TONToken, hdIndex: number, callback: (address: Address) => void) {
        const network = TONNetworks.findNetworkByCurrency(currency);
        if (network.netName === TONNetworks.netNames.ethereumnet) {
            if (walletInstance && walletInstance.ethereum) {
                walletInstance.ethereum.getETHAddress(hdIndex).then(callback);
            } else {
                // Try again each second until walletInstance is established
                setTimeout(() => TONTokensWallet.getAddress(currency, hdIndex, callback), 1000);
            }
        } else { // TON-based chains
            (async () => {
                const address = await TONAsync.withInterval(1000, () => {
                    return (
                        walletInstance
                        && walletInstance.getNetAddress(hdIndex, network.netName)
                    ) || undefined;
                });
                callback(address);
            })();
        }
        // TODO: support non-TON-based chains if needed later
    }

    static getHDAddress(token: TONToken, hdIndex: number = 0): Promise<Address> {
        const get = UIFunction.makeAsyncRev(TONTokensWallet.getAddress.bind(TONTokensWallet));
        return get(token, hdIndex);
    }

    static getFirstAddress(token: TONToken) {
        return TONTokensWallet.getHDAddress(token);
    }

    static async exchangeTokens(
        address: Address,
        from: TONToken,
        to: TONToken,
        amount: number,
    ) {
        const network = TONNetworks.findNetworkByCurrency(from);
        if (network.netName === TONNetworks.netNames.ethereumnet) {
            if (from === TONTokens.ETH) {
                if (walletInstance && walletInstance.ethereum) {
                    return walletInstance.ethereum.exchangeETH(address, amount, to);
                }
                throw new Error('No wallet instance set to exchange ETH');
            } else if (from === TONTokens.BNB) {
                if (walletInstance && walletInstance.ethereum) {
                    return walletInstance.ethereum.exchangeBNB(address, amount, to);
                }
                throw new Error('No wallet instance set to exchanger BNB');
            }
        }
        throw chainNotSupportedError;
    }

    static getAddresses(currency: TONToken): Address[] {
        if (!walletInstance) {
            throw walletNotInitializedError;
        }
        const network = TONNetworks.findNetworkByCurrency(currency);
        if (network.netName === TONNetworks.netNames.ethereumnet) {
            const { ethereum } = walletInstance;
            return (ethereum && ethereum.getAddresses()) || [];
        }
        return walletInstance.getNetAddresses(network.netName);
    }

    static nextHDIndex(token: TONToken): number {
        return TONTokensWallet.getAddresses(token).length;
    }

    // Wei/Ether Conversion
    static convertEtherToWei(ether: number): number {
        if (walletInstance && walletInstance.ethereum) {
            return walletInstance.ethereum.convertEtherToWei(ether);
        }
        return ether * (10 ** 18);
    }

    static convertWeiToEther(wei: BigNumber): number {
        if (walletInstance && walletInstance.ethereum) {
            return walletInstance.ethereum.convertWeiToEther(wei);
        }
        return (wei.toNumber ? wei.toNumber() : wei) / (10 ** 18);
    }

    // [Nano-]Grams Conversion
    static convertGramsToNanoGrams = (grams) => {
        const x = new BigNumber(grams);
        const y = new BigNumber('1e9');
        return x.times(y).toNumber();
    }

    static convertNanoGramsToGrams = (nanoGrams) => {
        const x = new BigNumber(nanoGrams);
        const y = new BigNumber('1e9');
        return Number(x.dividedBy(y).toFixed(9));
    }

    // Connect to blockchain
    static connect() {
        if (walletInstance) {
            walletInstance.connectToBlockchain();
        }
    }

    // Constructor
    passwordProvider: PasswordProvider;
    keystore: TONKeystore;
    ton: ?TON;
    ethereum: ?Ethereum;
    constructor(
        password: string,
        seedPhrase: ?string,
        passwordProvider: PasswordProvider,
        keystore?: TONKeystore,
        hdPathString?: string,
    ) {
        // save password provider at first before anything else can happen!
        this.passwordProvider = passwordProvider;
        // If password then create a new wallet
        // Otherwise use provided keystore to initialize previously stored instance
        // If no password or keystore is proved then throw an error
        if (password) {
            this.createWallet(password, seedPhrase, hdPathString);
        } else if (keystore) {
            this.setupKeystore(keystore);
        } else { // Empty wallet (used only for `call` transactions)
            this.setupChains(this.keystore);
        }
    }

    // Wallet initializers
    async createWallet(
        password: string,
        seedPhrase: ?string,
        hdPathString: string = TONTokensWallet.HDPathString.TON,
    ) {
        const options = {
            password,
            mnemonic: seedPhrase || await TONKeystore.generateRandomSeed(), // opt [extraEntropy]
            hdPathString,
        };
        try {
            const { keystore, pwDerivedKey } = await TONKeystore.createVault(options);
            log.debug('Vault have been created');
            // Save the password to reuse it next time without the prompt (best UX)
            this.savedDerivedKey = pwDerivedKey;
            // Pass a keystore to setup the wallet
            this.setupKeystore(keystore);
            // Save the keystore
            await TONWalletSerializer.saveWallet(keystore);
        } catch (error) {
            log.error('Failed to create vault with error:', error);
        }
    }

    setupKeystore(keystore: TONKeystore) {
        log.debug('Setup keystore instance:', keystore);
        this.keystore = keystore;

        // Setup chains to work with different blockchains
        this.setupChains(keystore);

        // Connect to blockchain
        this.connectToBlockchain();
    }

    setupChains(keystore: TONKeystore) {
        // Create ton instance to work with TON blockchain
        this.ton = new TON(keystore, this.askForPassword);

        // Create ethereum instance to work with Ethereum blockchain
        // TODO: create an independent keystore for Ethereum with HDPathString.ETH
        // Also need to remove keystore instance from TONTokensWallet and leave it only for chains!
        this.ethereum = new Ethereum(keystore, this.askForPassword);
    }

    // Connect to blockchain
    connectToBlockchain() {
        if (this.ton) {
            // TON doesn't require to be connected in order to listen the blocks
        }

        if (this.ethereum
            && TONNetworks.findNetworkByName(TONNetworks.netNames.ethereumnet).enabled) {
            this.ethereum.connectToBlockchain();
        }
    }

    // Password validation, returns pwDerivedKey in case of success
    validatingCallbacks: ?ValidatePasswordCallback[]
    validatingPassword: ?boolean;
    validatePassword(password: string, callback: ValidatePasswordCallback) {
        if (!this.validatingCallbacks) {
            this.validatingCallbacks = [];
        }
        this.validatingCallbacks.push(callback);
        if (this.validatingPassword) {
            return;
        }
        this.validatingPassword = true;
        const processValidationCallbacks = (error, pwDerivedKey) => {
            if (this.validatingCallbacks) {
                this.validatingCallbacks.forEach((cb) => {
                    cb(error, pwDerivedKey);
                });
            }
            this.validatingCallbacks = [];
            this.validatingPassword = false;
        };
        (async () => {
            try {
                const pwDerivedKey = await this.keystore.keyFromPassword(password);
                if (await this.keystore.isDerivedKeyCorrect(pwDerivedKey)) {
                    log.debug('pwDerivedKey is valid:', pwDerivedKey);
                    processValidationCallbacks(null, pwDerivedKey); // valid
                } else {
                    log.debug('pwDerivedKey is incorrect');
                    processValidationCallbacks(null); // not valid
                }
            } catch (error) {
                log.debug('Failed to get pwDerivedKey with error:', error);
                processValidationCallbacks(error); // not valid
            }
        })();
    }

    // `Ask for password` supposed to be an arrow function to pass it to ethereum constructor!
    // callback: (password: string, extra: <pwDerivedKey> | Error, hideHUD: () => void) => void
    savedDerivedKey: ?Hex;
    // N.B. We save the derived key in case in need to reuse it quickly,
    // e.g.in DeBots or other non-money related methods (account creation, encryption or similar)
    showingWrongPasswordAlert: ?boolean;
    askForPassword = (
        showHUD: boolean | string,
        callback: (
            error: ?Error,
            pwDerivedKey: ?Hex,
            hideHUD: ?(() => void),
        ) => void | Promise<void>,
        forcePrompt: boolean = false,
    ) => {
        if (this.savedDerivedKey && !forcePrompt) {
            callback(null, this.savedDerivedKey);
            return;
        }
        this.passwordProvider(showHUD, (password, hideHUD) => {
            if (!password) {
                callback(new Error(TONTokensWallet.ErrorStrings.NoPassword), null, hideHUD);
                return;
            }
            this.validatePassword(password, (error, pwDerivedKey) => {
                if (error) {
                    log.error('Failed to get pwDerivedKey with error:', error);
                    callback(new Error(TONTokensWallet.ErrorStrings.NoPwDerivedKey), null, hideHUD);
                } else if (pwDerivedKey) {
                    this.savedDerivedKey = pwDerivedKey; // save to reuse
                    callback(null, pwDerivedKey, hideHUD);
                } else {
                    this.savedDerivedKey = null;
                    const showWrongPasswordAlert = () => {
                        if (this.showingWrongPasswordAlert) {
                            return;
                        }
                        this.showingWrongPasswordAlert = true;
                        TONTokensWallet.showWrongPasswordAlert(() => {
                            this.showingWrongPasswordAlert = false;
                            this.askForPassword(showHUD, callback, forcePrompt);
                        });
                    };

                    if (showHUD && hideHUD) {
                        hideHUD(() => {
                            showWrongPasswordAlert();
                        });
                    } else {
                        showWrongPasswordAlert();
                    }
                }
            });
        }, { cancellable: forcePrompt });
    };

    // Seed phrase
    async fetchSeedPhrase(
        showHUD: boolean = UILocalized.ExportingBackupPhrase,
        forcePrompt: boolean = true,
    ) {
        return new Promise((resolve, reject) => {
            this.askForPassword(
                showHUD,
                async (error, pwDerivedKey, hideHUD) => {
                    // Possibly cancelled
                    if (error || !pwDerivedKey) {
                        if (hideHUD) {
                            hideHUD();
                        }
                        reject(error || TONTokensWallet.noDerivedKeyError);
                        return;
                    }
                    // Get seed phrase
                    const seedPhrase = await this.keystore.getSeed(pwDerivedKey);
                    if (hideHUD) {
                        hideHUD();
                    }
                    // Process seed phrase
                    if (seedPhrase) {
                        resolve(seedPhrase);
                    } else {
                        const seedError = new Error('Seed phrase cannot be fetched');
                        log.error('Failed to get seedPhrase with error:', seedError);
                        reject(seedError);
                    }
                },
                forcePrompt,
            );
        });
    }

    async importTelegramSeedPhrase(mnemonic: string, showHUD: boolean = false) {
        return new Promise((resolve, reject) => {
            this.askForPassword(showHUD, async (error, pwDerivedKey, hideHUD) => {
                // Possibly cancelled
                if (error || !pwDerivedKey) {
                    if (hideHUD) {
                        hideHUD();
                    }
                    reject(error || TONTokensWallet.noDerivedKeyError);
                    return;
                }
                // Try to import the Root Private key via Telegram Seed Phrase
                await this.keystore.importRootPrivateKey(
                    pwDerivedKey,
                    mnemonic,
                    TONKeystore.walletParams.ton,
                );
                // Re-save the wallet
                await TONWalletSerializer.saveWallet(this.keystore);
                // Resolve
                if (hideHUD) {
                    hideHUD();
                }
                resolve();
            });
        });
    }

    // ========== GRAM specific code ========== // TODO: move to chains/TON.js!!!
    // Saved Key Pairs
    savedKeyPairs: ?Object; // Save Key Pairs to get a quick access to them if needed!
    setSavedKeyPair(keyPair: Object, hdIndexKey: string | number) {
        if (!this.savedKeyPairs) {
            this.savedKeyPairs = {};
        }
        this.savedKeyPairs[hdIndexKey.toString()] = keyPair;
    }

    getSavedKeyPair(hdIndexKey: string | number): ?Object {
        return (this.savedKeyPairs || {})[hdIndexKey.toString()];
    }

    async getGRAMAddressKeyPair(hdIndex: number = 0, skipSaved: boolean = false) {
        if (!skipSaved) {
            const savedKeyPair = this.getSavedKeyPair(hdIndex);
            if (savedKeyPair) {
                return savedKeyPair;
            }
        }
        await TONTokensWallet.ensureWalletWithIndex(hdIndex);
        return new Promise(async (resolve, reject) => {
            this.askForPassword(true, async (error, pwDerivedKey, hideHUD) => {
                // Possibly cancelled
                if (error || !pwDerivedKey) {
                    if (hideHUD) {
                        hideHUD();
                    }
                    reject(error || TONTokensWallet.noDerivedKeyError);
                    return;
                }

                // Generate keys (Might hang UI!)
                const keys = await this.keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
                this.setSavedKeyPair(keys, hdIndex);

                // Resolve
                if (hideHUD) {
                    hideHUD();
                }
                resolve(keys);
            }, skipSaved);
        });
    }

    hasTelegramAddressKeyPair(): boolean {
        return this.keystore && this.keystore.hasRootPrivateKey();
    }

    async deleteTelegramAddressKeyPair(): Promise<void> {
        if (!this.keystore) {
            throw new Error('Missing the keystore to delete its telegram address key pair');
        }
        // Delete root private key where we store Telegram's root key
        this.keystore.deleteRootPrivateKey();
        // Re-save the wallet
        await TONWalletSerializer.saveWallet(this.keystore);
    }

    async getTelegramAddressKeyPair(skipSaved: boolean = false) {
        const telegramKeyPairCacheKey = 'telegramKeyPair';
        if (!skipSaved) {
            const savedKeyPair = this.getSavedKeyPair(telegramKeyPairCacheKey);
            if (savedKeyPair) {
                return savedKeyPair;
            }
        }
        await TONTokensWallet.waitForWallet();
        return new Promise(async (resolve, reject) => {
            this.askForPassword(true, async (error, pwDerivedKey, hideHUD) => {
                // Possibly cancelled
                if (error || !pwDerivedKey) {
                    if (hideHUD) {
                        hideHUD();
                    }
                    reject(error || TONTokensWallet.noDerivedKeyError);
                    return;
                }

                // Generate keys (Might hang UI!)
                const keys = await this.keystore.exportRootSignKeys(pwDerivedKey);
                this.setSavedKeyPair(keys, telegramKeyPairCacheKey);

                // Resolve
                if (hideHUD) {
                    hideHUD();
                }
                resolve(keys);
            }, skipSaved);
        });
    }

    async getIdentityPublicKey(hdIndex: number, keyName: string): Promise<string> {
        await TONTokensWallet.ensureWalletWithIndex(hdIndex);
        return new Promise((resolve, reject) => {
            this.askForPassword(true, async (error, pwDerivedKey, hideHUD) => {
                // Possibly cancelled
                if (error || !pwDerivedKey) {
                    if (hideHUD) {
                        hideHUD();
                    }
                    reject(error || TONTokensWallet.noDerivedKeyError);
                    return;
                }

                const { secret } = await this.keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
                const seedHex = stringToHex(`${secret}~${keyName}`);
                const identityKey = await TONNetworks.crypto.sha512({ hex: seedHex });
                if (hideHUD) {
                    hideHUD();
                }
                resolve(identityKey);
            });
        });
    }

    async getGRAMPublicKey(hdIndex: number = 0) {
        const keys = await this.getGRAMAddressKeyPair(hdIndex);
        return keys.public;
    }

    async calculateUserID() {
        const keys = await this.getGRAMAddressKeyPair();
        const sha512 = await TONNetworks.crypto.sha512({ hex: keys.public });
        const userID = sha512.slice(0, 64); // 32 bytes (maybe sha256 is better?)
        return userID;
    }

    async signUint8ArrayWithGRAM(array: Uint8Array, hdIndex: number = 0) {
        const message = { hex: arrayToHex(array) };
        const keys = await this.getGRAMAddressKeyPair(hdIndex);
        return TONNetworks.crypto.naclSignDetached(message, `${keys.secret}${keys.public}`); // ed25519!
    }

    // Net addresses
    netAddresses: { [TONNetName]: Address[] } = {};
    setNetAddress(address: Address, hdIndex: number = 0, netName: TONNetName) {
        if (!this.netAddresses[netName]) {
            this.netAddresses[netName] = [];
        }
        this.netAddresses[netName][hdIndex] = address;
    }

    getNetAddress(hdIndex: number = 0, netName: TONNetName): ?Address {
        return this.netAddresses[netName] && this.netAddresses[netName][hdIndex];
    }

    getNetAddresses(netName: TONNetName): Address[] {
        return this.netAddresses[netName] || [];
    }

    changePassword = async (pwDerivedKey: Hex, newPassword: string) => {
        const newPwDerivedKey = await this.keystore.keyFromPassword(newPassword);

        await this.keystore.reEncryptKeys(pwDerivedKey, newPwDerivedKey);

        // Update the saved derived key to actual!
        this.savedDerivedKey = newPwDerivedKey;
        // Re-save the wallet
        return TONWalletSerializer.saveWallet(this.keystore);
    }
}
