// @flow
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import {
    UIColor,
    UIConstant,
    UIFont,
    UINavigationBar,
    UIButton,
    UIDialogController,
} from '../../services/UIKit/UIKit';

import { TONEnvironment } from '../../TONUtility';

import { TONTokensWallet } from '../../TONWallet';

import type { AnyComponent, CreateNavigationOptions } from '../../services/UIKit/UIKit';

export type TONWalletSetupCompleteOptions = {
    isNewWallet: boolean;
    seedPhrase: string;
    localPassword: string;
};
export type TONWalletSetupCreateTemporaryWalletOptions = {
    onCreated: (wallet: ?TONTokensWallet) => void;
}

export type OnWalletSetupComplete = (options: TONWalletSetupCompleteOptions) => void;
export type OnWalletTemporaryWalletCreationComplete
    = (options: TONWalletSetupCreateTemporaryWalletOptions) => void;

export type WalletSetupNavigationParams = {
    onComplete: OnWalletSetupComplete,
    onCreateTemporaryWallet: OnWalletTemporaryWalletCreationComplete,
}
export type NextButtonOptions = {
    testID?: string,
    title: string,
    disabled?: boolean,
    showIndicator?: boolean,
    style?: any,
    onPress: () => void,
};


export const WalletSetupScreens = {
    Main: 'WalletSetupMainScreen',
    NewKeyView: 'WalletSetupNewKeyView',
    NewPhraseView: 'WalletSetupNewPhraseView',
    NewPhraseCheck: 'WalletSetupNewPhraseCheck',
    RestorePhrase: 'WalletSetupRestorePhrase',
    SetLocalPassword: 'WalletSetupSetLocalPassword',
    ConfirmLocalPassword: 'WalletSetupConfirmLocalPassword',
    CustodianRecoveryRestore: 'CustodianRecoveryRestore',
};

const walletSetupStyleProperties = {
    details: {
        color: UIColor.textPrimary(),
        ...UIFont.smallRegular(),
        marginBottom: UIConstant.contentOffset(),
    },
    nextButton: {
    },
};

export const walletSetupStyles = StyleSheet.create(walletSetupStyleProperties);

export default class WalletSetupScreenBase<Props, State> extends UIDialogController<Props, State> {
    static createNavigationOptions(
        title: string,
        headerLeft?: AnyComponent,
        useDefaultStyle?: boolean = false,
    ): CreateNavigationOptions {
        return ({ navigation }) => {
            return UINavigationBar.navigationOptions(navigation, {
                title,
                useDefaultStyle,
                ...(headerLeft ? { headerLeft } : {}),
            });
        };
    }

    // Getters
    getWalletSetup(): WalletSetupNavigationParams {
        return this.getNavigationParams().walletSetup;
    }

    getCompleteOptions(): TONWalletSetupCompleteOptions {
        return this.getNavigationParams().completeOptions;
    }

    getSeedPhrase(): string {
        return this.getCompleteOptions().seedPhrase || '';
    }

    // eslint-disable-next-line class-methods-use-this
    canAutoFocus(): boolean {
        // autoFocus doesn't work properly on `web` now, also in Detox (non-production) environment
        return Platform.OS !== 'web' && TONEnvironment.isProduction();
    }

    // Actions
    complete() {
        this.getWalletSetup().onComplete(this.getCompleteOptions());
    }

    // eslint-disable-next-line class-methods-use-this
    renderNextButton(options: NextButtonOptions) {
        const effective = (value, defaultValue) => (value !== undefined ? value : defaultValue);
        return (
            <UIButton
                testID={options.testID}
                buttonSize="large"
                title={options.title}
                disabled={effective(options.disabled, false)}
                showIndicator={effective(options.showIndicator, false)}
                style={[walletSetupStyles.nextButton, options.style]}
                onPress={options.onPress}
                footer
            />
        );
    }

    navigateToNextScreen(routeName: string, completeOptions: {} = {}) {
        this.props.navigation.push(routeName, {
            walletSetup: this.getNavigationParams().walletSetup,
            completeOptions: {
                ...this.getCompleteOptions(),
                ...completeOptions,
            },
        });
    }
}
