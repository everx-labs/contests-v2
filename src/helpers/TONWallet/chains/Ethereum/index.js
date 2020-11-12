import EventEmitter from 'events';
import Web3 from 'web3';
import Transaction from 'ethereumjs-tx';
import InputDataDecoder from 'ethereum-input-data-decoder';

import TONWalletConfiguration from '../../TONWalletConfiguration';

import { UILocalized } from '../../../../services/UIKit/UIKit';
// import { FBGasStation, FBLog } from '../../../services/FBKit/FBKit';

import Configs from '../../../../configs';

import { TONAsync, TONLog, TONString } from '../../../TONUtility';

import ETHContracts from './ETHContracts';

// Use web3 provider engine from Metamask
const ZeroProviderEngine = require('web3-provider-engine/zero.js');

const TONWalletOnEthereumBlockNotification = 'TONWalletOnEthereumBlockNotification';
const gasPriceReductionFactor = 0.8;
let blockNotifier = null;

const log = new TONLog('Ethereum');

function add0x(input) {
    if (typeof (input) !== 'string') {
        return input;
    } else if (input.length < 2 || input.slice(0, 2) !== '0x') {
        return `0x${input}`;
    }
    return input;
}

function strip0x(input) {
    if (typeof (input) !== 'string') {
        return input;
    } else if (input.length >= 2 && input.slice(0, 2) === '0x') {
        return input.slice(2);
    }
    return input;
}

function isHexPrefixed(input) {
    if (typeof (input) !== 'string') {
        throw new Error('input value type of "isHexPrefixed" function must be String');
    }
    return input.slice(0, 2) === '0x';
}

function stripHexPrefix(input) {
    if (typeof (input) !== 'string') {
        return input;
    }
    return isHexPrefixed(input) ? input.slice(2) : input;
}

export default class Ethereum {
    static log = log;

    static createBlockNotifier() {
        if (blockNotifier) {
            log.debug('Block notifications have started already');
            return;
        }
        blockNotifier = new EventEmitter();
        blockNotifier.setMaxListeners(100);
    }

    static notifyAboutNewBlock(block) {
        if (!blockNotifier) {
            Ethereum.createBlockNotifier();
        }
        blockNotifier.emit(TONWalletOnEthereumBlockNotification, block);
    }

    static addListenerToBlockNotifier(listener = () => {}) {
        if (!blockNotifier) {
            Ethereum.createBlockNotifier();
        }
        blockNotifier.addListener(TONWalletOnEthereumBlockNotification, listener);
    }

    static removeListenerFromBlockNotifier(listener) {
        if (!blockNotifier) {
            return;
        }
        blockNotifier.removeListener(TONWalletOnEthereumBlockNotification, listener);
    }

    static removeAllListeners() {
        if (!blockNotifier) {
            return;
        }
        blockNotifier.removeAllListeners();
    }

    static async signTrx(keystore, pwDerivedKey, rawTx, signingAddress) {
        if (!keystore.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('Incorrect derived key!');
        }
        const trxCopy = new Transaction(Buffer.from(stripHexPrefix(rawTx), 'hex'));
        const privateKey = await keystore.exportHDPrivateKey(
            stripHexPrefix(signingAddress),
            pwDerivedKey,
        );
        trxCopy.sign(Buffer.from(privateKey, 'hex'));
        return trxCopy.serialize().toString('hex');
    }

    // Constructor
    constructor(keystore, askForPassword) {
        this.keystore = keystore;
        this.askForPassword = askForPassword;
    }

    // Actions
    connectToBlockchain() {
        // Start provider engine to connect to Ethereum blockchain
        const engine = ZeroProviderEngine({
            stopped: true, // in order to make a `start` wrapped by `try catch` to avoid crashes!
            getAccounts: cb => cb(null, this.getAddresses()),
            signTransaction: this.signTransaction,
            rpcUrl: TONWalletConfiguration.shared.get().ethereum.nodeHost,
        });
        this.web3 = new Web3(engine);

        // Listen to new blocks
        engine.on('block', (block) => {
            log.debug('Block changed:', `#${block.number.toString('hex')}`, `0x${block.hash.toString('hex')}`);
            Ethereum.notifyAboutNewBlock(block);
        });

        // Check for network connectivity error
        engine.on('error', (err) => {
            // report connectivity errors
            log.error('Blockchain network error:', err.stack);
        });

        // Start polling for blocks if needed
        if (!Configs.isETHEnabled()) {
            log.debug('ETH is disabled in configuration file.');
            return;
        }
        try {
            log.debug('Starting provider engine...', engine, this.web3);
            engine.start();
        } catch (exception) {
            log.error('Failed to start engine with error:', exception);
        }
    }

    // Sign ETH transactions
    signTransaction = (txParams, callback) => {
        const ethjsTrxParams = {
            from: add0x(txParams.from),
            to: add0x(txParams.to),
            gasLimit: add0x(txParams.gas),
            gasPrice: add0x(txParams.gasPrice),
            nonce: add0x(txParams.nonce),
            value: add0x(txParams.value),
            data: add0x(txParams.data),
        };
        const txObj = new Transaction(ethjsTrxParams);
        const rawTrx = txObj.serialize().toString('hex');
        const signingAddress = strip0x(txParams.from);
        const { keystore } = this;
        this.askForPassword(false, async (error, pwDerivedKey) => {
            if (error) {
                callback(error);
                return;
            }
            const signedTrx = await Ethereum.signTrx(
                keystore,
                pwDerivedKey,
                rawTrx,
                signingAddress,
            );
            callback(null, `0x${signedTrx}`);
        });
    };

    // Addresses/Accounts processing
    async generateAddresses(pwDerivedKey, count = 1) { // one by default
        await this.keystore.generateNewKeys(pwDerivedKey, count);
        const addresses = this.getAddresses().slice(-count);
        log.debug('Ethereum addresses have been created:', addresses);
        if (!addresses || !addresses.length) {
            const error = new Error('Failed to generate new addresses');
            log.error('Failed to generate new address with error:', error);
            return Promise.reject(error);
        }
        const address = addresses[0];
        log.debug('New address have been generated:', address);
        return { address };
    }

    createNewAccount(count = 1) {
        return new Promise((resolve, reject) => {
            this.askForPassword(
                UILocalized.GeneratingNewKeyPairForEncryption,
                async (error, pwDerivedKey, hideHUD) => {
                    if (error) {
                        if (hideHUD) {
                            hideHUD();
                        }
                        reject(error);
                        return;
                    }
                    // Generate address and public key
                    this.generateAddresses(pwDerivedKey, count)
                        .then(resolve)
                        .catch(reject)
                        .finally(() => {
                            if (hideHUD) {
                                hideHUD();
                            }
                        });
                },
            );
        });
    }

    // Wei/Ether Conversion
    convertEtherToWei(ether) {
        const wei = this.web3.toWei(ether, 'ether');
        return Number(wei);
    }

    convertWeiToEther(wei) {
        const ether = this.web3.fromWei(wei, 'ether').toString(10);
        return Number(ether);
    }

    // Send internal errors
    sendInternalError(error, /* errorType, errorCode, */ method, address, gasPrice) {
        this.getETHBalance(address, false).then((balance) => {
            // Send internal error log
            log.error(`${TONString.errorMessage(error)}.\nABI method: ${method}.\nWallet address: ${address}.\nGasPrice: ${gasPrice}.\nBalance: ${balance}.`,
                // errorType, errorCode,
            );
        });
    }

    // Wallet general requests
    calculateGasPrice(method, address) {
        return new Promise((resolve, reject) => {
            /* const { testNet } = TONWalletConfiguration.shared.get();
            FBGasStation.fetchGasStation(testNet, gasStation => {
                const gasPrice = gasStation && gasStation.getGasPrice();
                log.debug('Gas station gas price:', gasPrice);
                if (gasPrice) {
                    const gasEstimate = gasStation.getGasEstimate();
                    if (gasEstimate) {
                        const ourGasEstimate = gasEstimate[method];
                        if (ourGasEstimate) {
                            log.debug(`Estimated gas for method ${method}:`, ourGasEstimate);
                            const neededBalance = gasPrice * ourGasEstimate;
                            this.getETHBalance(address, false).then(balance => {
                                log.debug('Balance needed to send request:', neededBalance);
                                if (balance < neededBalance) {
                                    // Seems like gasPrice has just been increased in the network
                                    // Try to send transaction with a lower gasPrice
                                    const ourGasPrice = Math.floor(balance / ourGasEstimate);
                                    log.debug('Recalculated gas price:', ourGasPrice);
                                    resolve(ourGasPrice);
                                } else {
                                    resolve(gasPrice);
                                }
                            });
                            return;
                        }
                        log.debug(`No gas estimate found for method ${method}`);
                    }
                    resolve(gasPrice);
                } else { */// if not found, fallback to the last few blocks median gas price
            this.web3.eth.getGasPrice((error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                const medianGasPrice = result.toNumber();
                log.debug('Median gas price:', medianGasPrice);
                resolve(medianGasPrice);
            });
            // }
            // });
        });
    }

    sendTransaction(from, to, value, data) {
        const defaultAccount = from || this.getAddress();
        return this.calculateGasPrice(null, defaultAccount).then((gasPrice) => {
            return new Promise((resolve, reject) => {
                this.web3.eth.defaultAccount = defaultAccount;
                this.web3.eth.sendTransaction({
                    to,
                    value: this.convertEtherToWei(value),
                    data,
                    gasPrice,
                }, (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }

    sendRequest(address, method, host, abi, parameters) {
        const sendRequest = (callback, gasX = 1.0) => {
            log.debug('Send request with method, parameters and gas factor:', method, parameters, gasX);
            const defaultAccount = address || this.getAddress();
            this.calculateGasPrice(method, defaultAccount).then((suggestedGasPrice) => {
                this.web3.eth.defaultAccount = defaultAccount;
                const contract = this.web3.eth.contract(abi);
                contract.at(host, (instError, instance) => {
                    if (instError) {
                        log.error('Failed to get instance of the contract with error:', instError);
                        if (callback) {
                            callback(instError);
                        }
                        return;
                    }
                    log.debug('Contract instance received:', instance);
                    const contractMethod = instance[method];

                    // Reduce suggested gas price by gasX if we failed to send the transaction
                    let gasPrice = Math.floor(suggestedGasPrice * gasX);
                    gasPrice = Math.max(gasPrice, 600000000000);
                    log.debug('Gas price used to send request:', gasPrice);
                    // const gas = suggestedGas ? { gas: suggestedGas } : null;
                    const transactionObject = {
                        gasPrice, // : Math.max(gasPrice, 600000000000),
                        // ...gas,
                    };
                    const params = parameters || [];
                    contractMethod.sendTransaction(
                        ...params, transactionObject,
                        (resError, result) => {
                            if (resError) {
                                log.error('Failed to send transaction with error:', resError);

                                if (resError.message.startsWith('insufficient funds')) {
                                    // "insufficient funds for gas * price + value"
                                    if (gasX === 1.0) {
                                        this.sendInternalError(
                                            resError,
                                            // FBLog.ErrorType.Blockchain,
                                            // FBLog.ErrorCode.BlockchainInsufficientFundsForGas,
                                            method, address, gasPrice,
                                        );
                                    }
                                    // We should try reducing an amount of gas and resend a request
                                    if (gasX > 0.1) {
                                        // Reducing the gasX by a factor, we will try up to 10 times
                                        // At the end we will reduce the gasX to 0,1073741824
                                        setTimeout(() => {
                                            sendRequest(callback, gasX * gasPriceReductionFactor);
                                        }, 100); // try again !!!
                                        return;
                                    }
                                    // Failed to send transaction even reducing the gas price
                                    this.sendInternalError(
                                        resError,
                                        // FBLog.ErrorType.Blockchain,
                                        // FBLog.ErrorCode.BlockchainInsufficientFundsForReducedGas,
                                        method, address, `${gasPrice} was reduced with ${gasX / gasPriceReductionFactor} multiplier`,
                                    );
                                } else {
                                    // Send internal send transaction error log
                                    this.sendInternalError(
                                        resError,
                                        // FBLog.ErrorType.Blockchain,
                                        // FBLog.ErrorCode.BlockchainSendTransactionError,
                                        method, address, gasPrice,
                                    );
                                }
                            } else {
                                log.debug('Transaction has been sent successfully:', result);
                            }
                            if (callback) {
                                callback(resError, result);
                            }
                        },
                    );
                });
            });
        };
        return new Promise((resolve, reject) => {
            sendRequest((error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }

    callRequest(method, host, abi, parameters = []) {
        return new Promise((resolve, reject) => {
            log.debug('Call request with method and parameters:', method, parameters, host);
            const contract = this.web3.eth.contract(abi);
            contract.at(host, (instError, instance) => {
                if (instError) {
                    log.error('Failed to get instance of the contract with error:', instError);
                    reject(instError);
                } else {
                    log.debug('Contract instance received:', instance);
                    const contractMethod = instance[method];
                    const params = parameters || [];
                    contractMethod.call(...params, (resError, result) => {
                        if (resError) {
                            log.error(`Failed to make call request to ${method} with error: ${TONString.errorMessage(resError)}`);
                            reject(resError);
                        } else {
                            log.debug(`Call request to ${method} has been made successfully:`, result);
                            resolve(result);
                        }
                    });
                }
            });
        });
    }

    listenToEvent(event, host, abi, address, handler, listen = false) {
        log.debug('Watch event with name and address:', event, address);
        const contract = this.web3.eth.contract(abi);
        contract.at(host, (instError, instance) => {
            if (instError) {
                log.error('Failed to get instance of the contract with error:', instError);
                if (handler) {
                    handler(instError);
                }
            } else {
                log.debug('Contract instance received:', instance);
                const eventToWatch = instance[event]({ _from: address });
                log.debug('Event to watch:', eventToWatch);
                eventToWatch.watch((resError, result) => {
                    if (resError) {
                        log.error(`Failed to watch event ${event} with error:`, resError);
                    } else {
                        log.debug('Event has been watched successfully:', result);
                    }

                    if (!listen) {
                        log.debug('Stop watching event:', event);
                        eventToWatch.stopWatching(() => {
                            log.debug('Stopped watching event:', event);
                        });
                    }

                    if (handler) {
                        handler(resError, result);
                    }
                });
            }
        });
    }

    makeRequestOnceTransactionIsCompleted(etherTrx, method, parameters, callback) {
        if (!etherTrx) {
            this[method](...parameters); // send request anyway
            return;
        }
        this.web3.eth.getTransactionReceipt(etherTrx, (trxError, result) => {
            if (result) {
                log.debug('Transaction receipt has been received:', result);
                let error = null;
                if (result.status === '0x1') {
                    this[method](...parameters); // send request once transaction is completed
                } else {
                    error = new Error(`Transaction ${etherTrx} has been rejected`);
                    log.error('Failed to make request once transaction is completed with error:', error);
                }
                if (callback) {
                    callback(error, result);
                }
                return;
            }
            setTimeout(() => {
                this.makeRequestOnceTransactionIsCompleted(etherTrx, method, parameters, callback);
            }, 100); // try again
        });
    }

    // Getters
    getAddresses() {
        return (this.keystore && this.keystore.getAddresses()) || [];
    }

    generatingAddresses = {};
    getAddress(hdIndex = 0) {
        const addresses = this.getAddresses();
        const address = addresses[hdIndex];
        if (!address && !this.generatingAddresses[hdIndex]) {
            // Create new accounts in order to have this address
            this.generatingAddresses[hdIndex] = true;
            const count = 1 + (hdIndex - addresses.length);
            this.createNewAccount(count);
        }
        return address;
    }

    async getSymbol(address) {
        return this.callRequest('symbol', address, ETHContracts.BNBContractABI)
            .then((symbol) => {
                log.debug(`Token symbol successfully loaded for address ${address}:`, symbol);
                return Promise.resolve(symbol);
            }).catch((error) => {
                log.error('Failed to get symbol with error:', error);
                return Promise.reject(error);
            });
    }

    async getTransaction(tid) {
        return new Promise((resolve, reject) => {
            this.web3.eth.getTransaction(
                tid,
                (error, result) => {
                    if (error) {
                        log.error('Loading Ethereum transaction failed with error:', error);
                        reject();
                        return;
                    }
                    log.debug(`Transaction ${tid} was successfully loaded with response:`, result);
                    resolve(result);
                },
            );
        });
    }

    async getBlock(blockNumber) {
        return new Promise((resolve, reject) => {
            this.web3.eth.getBlock(
                blockNumber,
                (error, result) => {
                    if (error) {
                        log.error('Loading block failed with error:', error);
                        reject();
                        return;
                    }
                    log.debug(`Block ${blockNumber} was successfully loaded with response:`, result);
                    resolve(result);
                },
            );
        });
    }

    async getCode(address) {
        return new Promise((resolve, reject) => {
            this.web3.eth.getCode(
                address,
                (error, result) => {
                    if (error) {
                        log.error('Loading Code failed with error:', error);
                        reject();
                        return;
                    }
                    log.debug(`Code for address ${address} was successfully loaded with response:`, result);
                    resolve(result);
                },
            );
        });
    }

    getAmountFromInput(input) {
        const abi = ETHContracts.BNBContractABI;
        const decoder = new InputDataDecoder(abi);
        const txInput = decoder.decodeData(input);
        const inputValue = txInput.inputs[1].toNumber();
        return this.convertWeiToEther(inputValue);
    }

    // ========== ETH specific code [start] ==========
    async getETHAddress(hdIndex = 0) {
        return TONAsync.withInterval(1000, () => {
            return this.getAddress(hdIndex);
        });
    }

    getETHBalance(address, inEther = false) {
        if (!Configs.isETHEnabled()) {
            return Promise.resolve(0);
        }
        return new Promise((resolve, reject) => {
            this.web3.eth.getBalance(address || this.getAddress(), (error, balance) => {
                if (error) {
                    log.error('Failed to get balance with error:', error);
                    reject(error);
                    return;
                }
                const weiBalance = balance.toNumber();
                if (!inEther) {
                    log.debug('Wei balance:', weiBalance, address);
                    resolve(weiBalance);
                } else {
                    const etherBalance = this.convertWeiToEther(weiBalance);
                    log.debug('Ether balance:', etherBalance, address);
                    resolve(etherBalance);
                }
            });
        });
    }

    exchangeETH(address = this.getAddress(), value, token) {
        const { testNet } = TONWalletConfiguration.shared.get();
        const ethExchanger = testNet
            ? ETHContracts.ETHContractAddressRopsten
            : ETHContracts.ETHContractAddress;
        const data = `0x${Buffer.from(token).toString('hex')}`;
        return this.sendTransaction(address, ethExchanger, value, data);
    }
    // ========== ETH specific code [end] ==========

    // ========== BNB specific code [start] ==========
    getBNBBalance(address, inEther) {
        if (!Configs.isETHEnabled()) {
            return Promise.resolve(0);
        }
        const { testNet } = TONWalletConfiguration.shared.get();
        const host = testNet
            ? ETHContracts.BNBContractAddressRopsten
            : ETHContracts.BNBContractAddress;
        return this.callRequest('balanceOf', host, ETHContracts.BNBContractABI, [address])
            .then((balance) => {
                const weiBalance = Number(balance);
                if (!inEther) {
                    log.debug('Wei BNB balance:', weiBalance, address);
                    return Promise.resolve(weiBalance);
                }
                const etherBalance = this.convertWeiToEther(weiBalance);
                log.debug('Normal BNB balance:', etherBalance, address);
                return Promise.resolve(etherBalance);
            })
            .catch((error) => {
                log.error('Failed to get BNB balance with error:', error);
                return Promise.reject(error);
            });
    }

    exchangeBNB(address = this.getAddress(), value/* , token */) {
        const { testNet } = TONWalletConfiguration.shared.get();
        const bnbExchanger = testNet
            ? ETHContracts.BNBContractAddressRopsten
            : ETHContracts.BNBContractAddress;
        const bnbABI = ETHContracts.BNBContractABI;
        const bnbReceiver = ETHContracts.BackendWallet;
        const parameters = [bnbReceiver, this.convertEtherToWei(value)];
        return this.sendRequest(address, 'transfer', bnbExchanger, bnbABI, parameters);
    }
    // ========== BNB specific code [end] ==========
}
