// @flow
import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import type { NavigationProps } from '../../services/UIKit/UIKit';
import { UIColor, UIConstant, UILocalized, UIPinCodeInput, UITextStyle } from '../../services/UIKit/UIKit';

import TONLocalized from '../../TONLocalized';

import { TONEnvironment } from '../../TONUtility';

import { walletSetupPinLength } from '../helpers/WalletSetupPassword';
import WalletSetupScreenBase from './WalletSetupTypes';

const styleProperties = {
    password: {
        marginBottom: UIConstant.smallContentOffset(),
        paddingVertical: UIConstant.smallContentOffset(),
        borderBottomWidth: 1,
        borderBottomColor: UIColor.light(),
    },
    warningLabel: {
        paddingHorizontal: UIConstant.contentOffset(),
        paddingBottom: UIConstant.contentOffset(),
    },
    bottomSection: {
        flexDirection: 'column',
        alignItems: 'stretch',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    hint: {},
    nextButton: {
        borderRadius: 0,
    },
};

const styles = StyleSheet.create(styleProperties);

type Props = NavigationProps;

type State = {
    isSuccess: boolean;
    userPassword: string,
};

export default class WalletSetupConfirmLocalPassword extends WalletSetupScreenBase<Props, State> {
    static navigationOptions = WalletSetupScreenBase
        .createNavigationOptions('');

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

    // Events

    // Setters
    setUserPassword = (userPassword: string) => {
        this.setStateSafely({
            isSuccess: userPassword === this.getLocalPassword(),
            userPassword,
        }, () => {
            if (this.isSuccess()) {
                this.complete();
            }
        });
    };

    // Getters
    getLocalPassword(): string {
        return this.getCompleteOptions().localPassword;
    }

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
    renderSmallPlaceholder() {
        return (
            <Text style={UITextStyle.secondaryTinyRegular} key="placeholder">
                {this.hasUserPassword() ? TONLocalized.setup.confirmLocalPassword.placeholder : ' '}
            </Text>
        );
    }

    renderUserPassword() {
        return (
            <TextInput
                key="passcode"
                testID="local_password_confirm_input"
                style={[UITextStyle.primaryBodyRegular, styles.password]}
                placeholder={TONLocalized.setup.confirmLocalPassword.placeholder}
                placeholderTextColor={UIColor.light()}
                underlineColorAndroid="transparent"
                editable
                selectionColor={UIColor.primary()}
                blurOnSubmit
                value={this.getUserPassword()}
                onChangeText={text => this.setUserPassword(text)}
                onSubmitEditing={() => this.onContinuePress()}
                accessibilityLabel={UILocalized.SeedPhrase}
                autoCapitalize="none"
                returnKeyType="done"
                secureTextEntry
                autoFocus={this.canAutoFocus()}
            />
        );
    }

    renderHint() {
        const { style, text } = this.isSuccess()
            ? {
                style: UITextStyle.successCaptionRegular,
                text: TONLocalized.setup.confirmLocalPassword.success,
            }
            : {
                style: UITextStyle.secondaryCaptionRegular,
                text: ' ',
            };
        return <Text style={style} key="hint">{text}</Text>;
    }

    renderPinCodeInput() {
        return (
            <UIPinCodeInput
                key="pin code input"
                ref={(component) => {
                    this.pinCodeInput = component;
                }}
                pinCodeLenght={walletSetupPinLength}
                pinToConfirm={this.getLocalPassword()}
                pinTitle={TONLocalized.setup.pinCode.confirmPin}
                pinCodeEnter={this.setUserPassword}
                usePredefined={TONEnvironment.isDevelopment()}
            />
        );
    }

    renderSafely() {
        return [
            this.renderPinCodeInput(),
        ];
    }
}
