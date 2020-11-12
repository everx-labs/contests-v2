// @flow
import { TONKeystore } from '../../TONWallet';

export const walletSetupSeedPhraseLength = TONKeystore.walletParams.wordCount; // 12

export const walletSetupPinLength = 6;

export function isLocalPasswordValid(password: string = '') {
    return password.length === walletSetupPinLength;
}
