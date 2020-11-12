// @flow
import TONEncryption from './core/TONEncryption';

import TONTokensWallet from './TONTokensWallet';

import { TONAsync, TONLog } from '../TONUtility';

import type { EncryptedMessage, EncryptedData } from './core/TONEncryption';
import type { Hex } from './core/TONKeystore';

const log = new TONLog('TONWalletEncryption');

export default class TONWalletEncryption {
    static log = log;

    // Data multi-encryption/decryption
    static async encryptData(
        plainData: string,
        theirPublicKeys: string[],
        hdIndex?: number,
    ): Promise<string> {
        if (!theirPublicKeys || !theirPublicKeys.length) {
            const error = new Error('No their public keys are passed to encrypt data');
            log.error('Failed to encrypt data with error:', error);
            throw error;
        }
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);

        // Encrypt data
        log.debug('Their public keys to encrypt:', theirPublicKeys);
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const encryptedData = await TONEncryption.multiEncryptString(
            wallet.keystore,
            pwDerivedKey,
            plainData,
            theirPublicKeys,
            hdIndex,
        );
        // Process encrypted data
        if (!encryptedData) {
            throw new Error('Failed to encrypt data');
        }
        return JSON.stringify(encryptedData);
    }

    static async decryptData(
        encryptedData: string,
        theirPublicKey: string,
        hdIndex?: number,
    ): Promise<any> {
        if (!theirPublicKey) {
            const error = new Error('No their public key is passed to decrypt data');
            log.error('Failed to decrypt data with error:', error);
            throw error;
        }
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);

        // Decrypt data
        log.debug('Their public key to decrypt:', theirPublicKey);
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const encData: EncryptedData = JSON.parse(encryptedData);
        try {
            const decryptedData = await TONEncryption.multiDecryptString(
                wallet.keystore,
                pwDerivedKey,
                encData,
                theirPublicKey,
                hdIndex,
            );
            // Process decrypted data
            if (!decryptedData) {
                throw new Error('No decrypted data was received');
            }

            // Get result from the decrypted data
            try {
                const result = JSON.parse(decryptedData);
                return result;
            } catch (exception) {
                if (decryptedData instanceof String || typeof decryptedData === 'string') {
                    return decryptedData;
                }
                throw new Error('Failed to parse decrypted data');
            }
        } catch (error) {
            throw new Error('Failed to decrypt data');
        }
    }

    // String asym encryption/decryption
    static async encryptString(
        plainString: string,
        theirPublicKey?: string,
        hdIndex?: number,
    ): Promise<string> {
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);
        // Encrypt string
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const publicKey = theirPublicKey
            || await TONEncryption.publicEncryptKey(
                wallet.keystore,
                pwDerivedKey,
                hdIndex,
            ); // if no key passed, then encrypt with my public key
        const encryptedString = await TONEncryption.asymEncryptString(
            wallet.keystore,
            pwDerivedKey,
            plainString,
            publicKey,
            hdIndex,
        );
        // Process encrypted string
        if (!encryptedString) {
            throw new Error('Failed to encrypt string');
        }
        return JSON.stringify(encryptedString);
    }

    static async decryptString(
        encryptedString: string,
        theirPublicKey?: string,
        hdIndex?: number,
    ): Promise<string> {
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);
        // Decrypt string
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const publicKey = theirPublicKey
            || await TONEncryption.publicEncryptKey(
                wallet.keystore,
                pwDerivedKey,
                hdIndex,
            ); // if no key passed, then decrypt with my public key
        const encString: EncryptedMessage = JSON.parse(encryptedString);
        const plainString = await TONEncryption.asymDecryptString(
            wallet.keystore,
            pwDerivedKey,
            encString,
            publicKey,
            hdIndex,
        );
        // Process decrypted string
        if (!plainString) {
            throw new Error('Failed to decrypt string');
        }
        return plainString;
    }

    // P2P encryption/decryption (used only for KYC now)
    static async encryptP2P(
        plainData: string,
        theirPublicKey: string,
        nonce: string,
        hdIndex?: number,
    ): Promise<string> {
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);

        // Encrypt data
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const encryptedData = await TONEncryption.encryptP2P(
            wallet.keystore,
            pwDerivedKey,
            plainData,
            theirPublicKey,
            nonce,
            hdIndex,
        );
        // Process encrypted data
        if (!encryptedData) {
            throw new Error('Failed to encrypt data');
        }
        return JSON.stringify(encryptedData);
    }

    static async decryptP2P(
        encryptedData: any,
        nonce: string,
        hdIndex?: number,
    ): Promise<any> {
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);

        // Decrypt data
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        const decryptedData = await TONEncryption.decryptP2P(
            wallet.keystore,
            pwDerivedKey,
            encryptedData,
            nonce,
            hdIndex,
        );
        // Process decrypted data
        if (!decryptedData) {
            throw new Error('No decrypted data was received');
        }
        return decryptedData;
    }

    // Public key getter
    static async getEncryptPublicKey(hdIndex: number = 0): Promise<string> {
        const wallet = await TONTokensWallet.ensureWalletWithIndex(hdIndex);
        const pwDerivedKey = await TONWalletEncryption.getPwDerivedKey(wallet);
        // Generate Encryption Public Key
        const publicKey = await TONEncryption.publicEncryptKey(
            wallet.keystore,
            pwDerivedKey,
            hdIndex,
        );
        if (!publicKey) {
            throw new Error('Failed to generate encrypt public key');
        }
        return publicKey;
    }

    // service method
    static async getPwDerivedKey(wallet: TONTokensWallet): Promise<Hex> {
        return TONAsync.makeAsync(wallet.askForPassword)(false);
    }
}
