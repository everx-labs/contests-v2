// @flow
import TONWalletSetupNavigator from './navigation/TONWalletSetupNavigator';

import {
    isLocalPasswordValid,
    walletSetupPinLength,
    walletSetupSeedPhraseLength,
} from './helpers/WalletSetupPassword';

import type {
    TONWalletSetupCreateTemporaryWalletOptions,
    TONWalletSetupCompleteOptions,
} from './controllers/WalletSetupTypes';


export {
    TONWalletSetupNavigator,

    isLocalPasswordValid,
    walletSetupPinLength,
    walletSetupSeedPhraseLength,
};

export type {
    TONWalletSetupCreateTemporaryWalletOptions,
    TONWalletSetupCompleteOptions,
};
