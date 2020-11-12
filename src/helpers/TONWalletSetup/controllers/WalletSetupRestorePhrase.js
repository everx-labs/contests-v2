// @flow
import React from 'react';
import { Animated, Text } from 'react-native';
import type AnimatedValue from 'react-native/Libraries/Animated/src/nodes/AnimatedValue';

import {
    UIConstant,
    UIFunction,
    UILocalized,
    UISeedPhraseInput,
    UIStyle,
    UIDetailsInput,
} from '#UIKit';
import TONLocalized from '#TONLocalized';

import type { NavigationProps } from '#UIKit';
import type { TONCacheObserver } from '#TONUtility';

import { TONKeystore, TONTokensWallet } from '../../TONWallet';

import { walletSetupSeedPhraseLength } from '../helpers/WalletSetupPassword';
import WalletSetupScreenBase, { WalletSetupScreens, walletSetupStyles } from './WalletSetupTypes';

type Props = NavigationProps;

type State = {
    words: string[],
    userPhrase: string,
    detailsHeight: number,
    isValid: boolean,
    isEmpty: boolean,
    restoreStatus: any, // TONTransferOperationStatusType,
    contentOffset: AnimatedValue,
};

export default class WalletSetupRestorePhrase
    extends WalletSetupScreenBase<Props, State>
    implements TONCacheObserver {
    static navigationOptions =
        WalletSetupScreenBase.createNavigationOptions(TONLocalized.setup.restore.title);

    static defaultProps = {};

    // constructor
    constructor(props: Props) {
        super(props);
        this.state = {
            ...this.state,
            words: null,
            userPhrase: '',
            detailsHeight: 0,
            isValid: false,
            isEmpty: true,
            contentOffset: new Animated.Value(0),
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.loadWords();
        // this.processNavigationParams();
    }

    // processNavigationParams() {
    //     const options = this.getCompleteOptions();
    //     const seedPhrase = options && options.seedPhrase;
    //     if (seedPhrase) {
    //         this.onUserPhraseChange(seedPhrase);
    //     }
    // }

    // Events
    onDetailsLayout = (e: any) => {
        const { height } = e.nativeEvent?.layout || {};
        if (height) {
            this.setDetailsHeight(height);
        }
    }

    onKeyboardWillShow() {
        Animated.timing(this.state.contentOffset, {
            toValue: -UIConstant.contentOffset() - this.getDetailsHeight(),
            duration: UIConstant.animationDuration(),
        }).start();
    }

    onKeyboardWillHide() {
        Animated.timing(this.state.contentOffset, {
            toValue: 0,
            duration: UIConstant.animationDuration(),
        }).start();
    }

    // onCacheValueChanged(sender: TONCache<TONTransferOperationState>): void {
    //     if (sender === TONCustodianRecovery.restoreOperation && sender.hasValue()) {
    //         const restore: TONTransferOperationState = sender.getValue();
    //         this.setStateSafely({ restoreStatus: restore.status });
    //     }
    // }

    onRestorePress = () => {
        if (!this.isValid()) {
            return;
        }
        this.navigateToNextScreen(WalletSetupScreens.SetLocalPassword, {
            isNewWallet: false,
            seedPhrase: UIFunction.normalizeKeyPhrase(this.getUserPhrase()),
        });
    }

    // Setters
    setWords(words: string[]) {
        this.setStateSafely({ words });
    }

    setDetailsHeight(detailsHeight: number) {
        this.setStateSafely({ detailsHeight });
    }

    onUserPhraseChange = (userPhrase: string) => {
        this.setStateSafely({
            userPhrase,
            isEmpty: userPhrase === '',
        });
        (async () => {
            const isValid = await TONTokensWallet.isSeedPhraseValid(userPhrase);
            this.setStateSafely({ isValid });
        })();
    }

    // Getters
    getWords(): string[] {
        return this.state.words;
    }

    getDetailsHeight(): number {
        return this.state.detailsHeight;
    }

    getUserPhrase(): string {
        return this.state.userPhrase;
    }

    isEmpty(): string {
        return this.state.isEmpty;
    }

    isValid(): boolean {
        return this.state.isValid;
    }

    // Actions
    async loadWords() {
        const words = await TONKeystore.mnemonicWords(TONKeystore.walletParams.hd);
        this.setWords(words);
    }

    // Render
    renderBottom() {
        return this.renderNextButton({
            testID: 'phrase_restore_button',
            title: UILocalized.WalletSetup.OKContinue,
            disabled: this.getRunningAsyncOperation() || !this.isValid(),
            onPress: this.onRestorePress,
            style: UIStyle.bottomOffsetItemContainer,
        });
    }

    renderSeedPhraseInput() {
        const words = this.getWords();
        if (!words) {
            return null;
        }
        const isAsyncRunning = this.getRunningAsyncOperation();
        return (
            <UISeedPhraseInput
                key="masterPassword"
                testID="phrase_restore_input"
                editable={!isAsyncRunning}
                value={this.getUserPhrase()}
                onChangeText={this.onUserPhraseChange}
                onSubmitEditing={this.onRestorePress}
                placeholder={UILocalized.WalletSetup.KeyPhrasePlaceholder}
                isSeedPhraseValid={this.isValid()}
                autoFocus
                totalWords={walletSetupSeedPhraseLength}
                words={words}
            />
        );
    }

    renderContent() {
        return (
            <Animated.View style={{ top: this.state.contentOffset }}>
                <Text
                    key="details"
                    style={walletSetupStyles.details}
                    onLayout={this.onDetailsLayout}
                >
                    {TONLocalized.setup.restore.description}
                </Text>
                {this.renderSeedPhraseInput()}
            </Animated.View>
        );
    }
}
