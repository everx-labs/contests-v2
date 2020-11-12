import { Platform } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import * as Keychain from 'react-native-keychain';

import { TONLog } from '../TONUtility';

import TONKeystore, { notActualKeystoreVersionError } from './core/TONKeystore';

import TONTokensWallet from './TONTokensWallet';

const log = new TONLog('TONWalletSerializer');

export default class TONWalletSerializer {
    static log = log;

    // Services used for the keychain to store serialized keystore
    static keystoreService = {
        TON: 'surf.ton.wallet', // wallet for TON
        ETH: 'surf.ton.ethereum', // wallet for ETH
    };

    // Get stored wallet (returns only general wallet, but process both)
    // You should pass password provider to present password prompt if needed
    static async storedWallet(passwordProvider) {
        // Getting general serialized wallet
        const serializedWallet = await this.serializedWallet();
        if (!serializedWallet) {
            log.debug('No general serialized wallet stored');
            return null;
        }
        log.debug('General serialized wallet successfully loaded:', serializedWallet);
        const deserializedWallet = this.deserializeWallet(
            serializedWallet,
            passwordProvider,
        );
        log.debug('General wallet was deserialized', deserializedWallet);
        return deserializedWallet;
    }

    // Get serialized wallet stored in mobile keychain
    static async serializedWallet(service = TONWalletSerializer.keystoreService.TON) {
        if (Platform.OS === 'web') {
            const serializedWallet = await AsyncStorage.getItem(service);
            return JSON.parse(serializedWallet);
        }

        const credentials = await Keychain.getGenericPassword({ service });
        log.debug('Credentials for wallet:', credentials);

        let serializedWallet = null;
        if (credentials) {
            serializedWallet = credentials.password;
        } else {
            log.error('No credentials for wallet');
        }
        return serializedWallet;
    }

    static deserializeWallet(serializedKeystore, passwordProvider) {
        let deserializedWallet = null;
        try {
            const keystore = TONKeystore.deserialize(serializedKeystore);
            if (keystore) {
                log.debug('Deserialized keystore:', keystore);
                deserializedWallet = new TONTokensWallet(null, null, passwordProvider, keystore);
            } else {
                log.error('Failed to deserialize empty keystore');
            }
        } catch (error) {
            if (error === notActualKeystoreVersionError) {
                // TODO: upgrade the wallet instead of throwing an error
                throw error;
            } else {
                log.error('Failed to deserialize keystore with error:', error);
                throw error;
            }
        }
        return deserializedWallet;
    }

    static saveWallet(keystore, service = TONWalletSerializer.keystoreService.TON) {
        const serializedWallet = keystore.serialize();
        if (Platform.OS === 'web') {
            const key = JSON.stringify(serializedWallet);

            // TONOSCommunicator related logic
            // if (window.TONOSCommunicator) {
            //     window.TONOSCommunicator.sendAuthKey(key);
            // }

            return AsyncStorage.setItem(service, key);
        }
        const options = {
            service,
            accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
        };
        return Keychain.setGenericPassword('TONWallet', serializedWallet, options);
    }

    static deleteStoredWallet(service = TONWalletSerializer.keystoreService.TON) {
        if (Platform.OS === 'web') {
            // if (window.TONOSCommunicator) {
            //     window.TONOSCommunicator.sendAuthKey(null);
            // }
            return AsyncStorage.removeItem(service);
        }
        const options = {
            service,
        };
        return Keychain.resetGenericPassword(options);
    }
}
