// @flow
import TONKeystore, { hexToBase64, hexToString, base64ToHex, stringToHex } from './TONKeystore';

import TONNetworks from '../networks';

const nonceLength = 24;
const keyLength = 32;

type DerivedKey = Uint8Array;
type Base64 = string;
type Hex = string;

export type EncryptedMessage = {
    alg?: string,
    nonce: Base64,
    ciphertext: Base64,
};

export type EncryptedData = {
    version: number,
    asymAlg: string,
    symAlg: string,
    symNonce: Base64,
    symEncMessage: Base64,
    encryptedSymKey: EncryptedMessage[],
}

async function publicEncryptKey(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    hdIndex?: number,
): Promise<Hex> {
    const { secret } = await keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
    // Get keys for box encryption (x25519-xsalsa20-poly1305), where secret key belongs to ed25519!
    const encryptionKeys = await TONNetworks.crypto.naclBoxKeypairFromSecretKey(secret);
    return encryptionKeys.public;
}

async function asymEncryptRaw(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    msgHex: Hex,
    theirPublicKey: Hex,
    hdIndex?: number,
): Promise<EncryptedMessage> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    const { secret } = await keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
    const nonce: Hex = await TONNetworks.crypto.randomGenerateBytes(nonceLength);
    const encryptedMessage: Base64 = await TONNetworks.crypto.naclBox({
        message: { hex: msgHex },
        nonce,
        theirPublicKey,
        secretKey: secret,
        outputEncoding: 'Base64',
    });
    return {
        alg: 'curve25519-xsalsa20-poly1305',
        nonce: hexToBase64(nonce),
        ciphertext: encryptedMessage,
    };
}

async function asymDecryptRaw(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    encMsg: EncryptedMessage,
    theirPublicKey: Hex,
    hdIndex?: number,
): Promise<Hex> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    const { secret } = await keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
    const nonce: Hex = base64ToHex(encMsg.nonce);
    return TONNetworks.crypto.naclBoxOpen({
        message: { base64: encMsg.ciphertext },
        nonce,
        theirPublicKey,
        secretKey: secret,
        outputEncoding: 'Hex',
    });
}

// Public methods
async function asymEncryptString(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    msg: string,
    theirPubKey: Hex,
    hdIndex?: number,
): Promise<EncryptedMessage> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    const msgHex = stringToHex(msg);
    return asymEncryptRaw(keystore, pwDerivedKey, msgHex, theirPubKey, hdIndex);
}

async function asymDecryptString(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    encMsg: EncryptedMessage,
    theirPubKey: Hex,
    hdIndex?: number,
): Promise<?string> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    const cleartext = await asymDecryptRaw(keystore, pwDerivedKey, encMsg, theirPubKey, hdIndex);
    return !cleartext ? undefined : hexToString(cleartext);
}

async function multiEncryptString(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    msg: string,
    theirPublicKeys: Hex[],
    hdIndex?: number,
): Promise<EncryptedData> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    const symEncryptionKey: Hex = await TONNetworks.crypto.randomGenerateBytes(keyLength);
    const symNonce: Hex = await TONNetworks.crypto.randomGenerateBytes(nonceLength);
    const symEncMessage: Base64 = await TONNetworks.crypto.naclSecretBox({
        // message: { text: msg },
        // Changed to base64 in order to avoid issues with encryption for iOS
        // when using such symbols as quotes, and to support cyrillic alphabet.
        message: { base64: Buffer.from(msg, 'utf8').toString('base64') },
        nonce: symNonce,
        key: symEncryptionKey,
        outputEncoding: 'Base64',
    });
    if (theirPublicKeys.length < 1) {
        throw new Error('Found no pubkeys to encrypt to.');
    }
    const encryptedSymKey = await Promise.all(theirPublicKeys.map(async theirPublicKey => {
        const encSymKey = await asymEncryptRaw(
            keystore,
            pwDerivedKey,
            symEncryptionKey,
            theirPublicKey,
            hdIndex,
        );
        delete encSymKey.alg;
        return encSymKey;
    }));
    return {
        version: 1,
        asymAlg: 'curve25519-xsalsa20-poly1305',
        symAlg: 'xsalsa20-poly1305',
        symNonce: hexToBase64(symNonce),
        symEncMessage,
        encryptedSymKey,
    };
}

async function multiDecryptString(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    encMsg: EncryptedData,
    theirPubKey: Hex,
    hdIndex?: number,
): Promise<?string> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }
    let symKey = false;
    await Promise.all(encMsg.encryptedSymKey.map(async encryptedSymKey => {
        if (!symKey) {
            try {
                const result = await asymDecryptRaw(
                    keystore,
                    pwDerivedKey,
                    encryptedSymKey,
                    theirPubKey,
                    hdIndex,
                );
                if (result) {
                    symKey = result;
                }
            } catch (error) {
                // It's OK to catch an error here, as there is only one key can be decrypted for us
                // console.log('[TONEncryption] Failed to decrypt the sym key with error:', error);
            }
        }
    }));
    if (symKey === false) {
        return undefined;
    }
    const symNonce = base64ToHex(encMsg.symNonce);
    const symEncMessage = base64ToHex(encMsg.symEncMessage);
    const msg = await TONNetworks.crypto.naclSecretBoxOpen({
        message: { hex: symEncMessage },
        nonce: symNonce,
        key: symKey,
        outputEncoding: 'Text',
    });
    return !msg ? undefined : msg;
}

async function encryptP2P(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    plainData: any,
    theirPublicKey: string,
    nonce: string,
    hdIndex?: number,
): Promise<any> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }

    const { secret } = await keystore.exportHDSignKeys(pwDerivedKey, hdIndex);

    const encryptedContentBase64 = await TONNetworks.crypto.naclBox({
        message: { base64: Buffer.from(JSON.stringify(plainData)).toString('base64') },
        nonce,
        secretKey: secret,
        theirPublicKey,
        outputEncoding: 'Base64',
    });
    const prefix = Buffer.from(theirPublicKey, 'hex');
    const content = Buffer.from(encryptedContentBase64, 'base64');
    return Array.from(Buffer.concat([prefix, content]));
}

async function decryptP2P(
    keystore: TONKeystore,
    pwDerivedKey: Hex,
    encMessage: any,
    nonce: string,
    hdIndex?: number,
): Promise<any> {
    if (!await keystore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw new Error('Incorrect derived key!');
    }

    const { secret } = await keystore.exportHDSignKeys(pwDerivedKey, hdIndex);
    const encryptedBuffer = Buffer.from(encMessage, 'hex');
    const encryptionPublicKey = encryptedBuffer.slice(0, 32).toString('hex');
    const encryptedContent = encryptedBuffer.slice(32);

    const decryptedContentBase64 = await TONNetworks.crypto.naclBoxOpen({
        message: { base64: encryptedContent.toString('base64') },
        nonce,
        theirPublicKey: encryptionPublicKey,
        secretKey: secret,
        outputEncoding: 'Base64',
    });
    return JSON.parse(Buffer.from(decryptedContentBase64, 'base64'));
}

const TONEncryption = {
    asymEncryptString,
    asymDecryptString,
    multiEncryptString,
    multiDecryptString,
    publicEncryptKey,
    encryptP2P,
    decryptP2P,
};

export default TONEncryption;
