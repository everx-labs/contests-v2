// @flow
import React from 'react';

import type { NavigationProps } from '../../services/UIKit/UIKit';
import { UIPinCodeInput } from '../../services/UIKit/UIKit';

import TONLocalized from '../../TONLocalized';

import { TONEnvironment } from '../../TONUtility';

import { isLocalPasswordValid, walletSetupPinLength } from '../helpers/WalletSetupPassword';

import WalletSetupScreenBase, { WalletSetupScreens } from './WalletSetupTypes';

type Props = NavigationProps;

type State = {
    isSuccess: boolean;
    userPassword: string,
};

export default class WalletSetupSetLocalPassword extends WalletSetupScreenBase<Props, State> {
    static navigationOptions =
        WalletSetupScreenBase.createNavigationOptions('');

    static defaultProps = {};

    // constructor
    constructor(props: Props) {
        super(props);
        this.state = {
            isSuccess: false,
            userPassword: '',
        };
    }

    componentDidMount() {
        super.componentDidMount();
    }

    componentWillFocus() {
        super.componentWillFocus();
        if (this.pinCodeInput) {
            this.pinCodeInput.resetPin();
        }
    }

    // Events

    // Setters
    setUserPassword = (userPassword: string) => {
        const isSuccess = isLocalPasswordValid(userPassword);
        this.setStateSafely({
            isSuccess,
            userPassword,
        }, () => {
            if (this.isSuccess()) {
                // timeout nesessary to disable layout animation when navigate next screen
                setTimeout(() => {
                    this.navigateToNextScreen(WalletSetupScreens.ConfirmLocalPassword, {
                        localPassword: this.getUserPassword(),
                    });
                }, 100);
            }
        });
    };

    // Getters
    getUserPassword(): string {
        return this.state.userPassword;
    }

    hasUserPassword(): boolean {
        return this.state.userPassword !== '';
    }

    isSuccess(): boolean {
        return this.state.isSuccess;
    }

    // render
    // eslint-disable-next-line class-methods-use-this
    renderPinCodeInput() {
        return (
            <UIPinCodeInput
                key="pin code input"
                ref={(component) => {
                    this.pinCodeInput = component;
                }}
                pinCodeLenght={walletSetupPinLength}
                pinTitle={TONLocalized.setup.pinCode.createPin}
                pinDescription={TONLocalized.setup.pinCode.itWorkLocal}
                pinCodeEnter={this.setUserPassword}
                usePredefined={TONEnvironment.isDevelopment()}
            />
        );
    }

    // eslint-disable-next-line class-methods-use-this
    renderSafely() {
        return this.renderPinCodeInput();
    }
}
