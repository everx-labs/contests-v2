// @flow
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { TONKeystore, TONTokensWallet } from '../../TONWallet';

import {
    UIColor,
    UIConstant,
    UIFont,
    UIFunction,
    UILocalized,
    UITextStyle,
} from '../../services/UIKit/UIKit';

import WalletSetupScreenBase from './WalletSetupTypes';

const baseStyleProperties = {
    keyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: UIConstant.contentOffset(),
        marginVertical: UIConstant.largeContentOffset(),
        backgroundColor: UIColor.white(),
    },
    keyLetter: {
        color: UIColor.black(),
        ...UIFont.accentMedium(),
    },
};

const styleProperties = {
    keyContainerObscured: {
        ...baseStyleProperties.keyContainer,
        ...UIConstant.cardShadow(),
    },
    keyContainer: {
        ...baseStyleProperties.keyContainer,
        ...UIConstant.commonShadow(),
    },
    keyLetterObscured: {
        ...baseStyleProperties.keyLetter,
        backgroundColor: UIColor.black(),
    },
    keyLetter: baseStyleProperties.keyLetter,
};

const styles = StyleSheet.create(styleProperties);

type Props = {};

type State = {
    obscured: boolean,
    key: string;
};

export default class WalletSetupNewKeyView extends WalletSetupScreenBase<Props, State> {
    static navigationOptions =
        WalletSetupScreenBase.createNavigationOptions(UILocalized.WalletSetup.PrivateKey);

    static defaultProps = {};

    // constructor
    constructor(props: Props) {
        super(props);
        this.state = {
            obscured: true,
            key: '',
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.loadKey();
    }

    // Events
    onToggleObscured() {
        this.setObscured(!this.getObscured());
    }

    // Setters
    setKey(key: string) {
        this.setStateSafely({ key });
    }

    setObscured(obscured: boolean) {
        this.setStateSafely({ obscured });
    }

    // Getters
    getKey(): string {
        return this.state.key;
    }

    getObscured(): boolean {
        return this.state.obscured;
    }

    // Actions
    async loadKey() {
        const phrase = this.getSeedPhrase();
        const { secret } = await TONKeystore.generateHDRootKeyFromMnemonic(
            TONTokensWallet.HDPathString.TON,
            phrase,
        );
        this.setKey(secret);
    }

    navigateToViewPhraseScreen() {
        this.navigateToNextScreen('WalletSetupNewPhraseView');
    }

    // render

    renderKeyLetters() {
        const key = this.getKey();
        if (!key) {
            return [];
        }
        const letters = [];
        const keyParts = UIFunction.splitRandomly(key, [[4, 10], [2, 5]]);
        let letterIndex = 0;
        for (let i = 0; i < keyParts.length; i += 1) {
            const keyPart = keyParts[i];
            const style = ((i % 2 === 1) && this.getObscured())
                ? styles.keyLetterObscured
                : styles.keyLetter;
            for (let j = 0; j < keyPart.length; j += 1) {
                letters.push(<Text style={style} key={letterIndex}>{keyPart[j]}</Text>);
                letterIndex += 1;
            }
        }
        return letters;
    }

    renderKey() {
        const keyStyle = this.getObscured() ? styles.keyContainerObscured : styles.keyContainer;
        return (
            <TouchableOpacity
                style={keyStyle}
                activeOpacity={1}
                onLongPress={() => this.onToggleObscured()}
            >
                {this.renderKeyLetters()}
            </TouchableOpacity>
        );
    }

    renderContent() {
        return [
            <Text style={UITextStyle.primarySmallRegular}>
                {UILocalized.WalletSetup.PrivateKeyDetails}
            </Text>,
            this.renderKey(),
            <Text style={UITextStyle.secondaryCaptionRegular}>
                {UILocalized.WalletSetup.PrivateKeyHint}
            </Text>,
        ];
    }

    renderBottom() {
        return this.renderNextButton({
            testID: 'encode_phrase_button',
            title: UILocalized.WalletSetup.EncodePhrase,
            onPress: () => {
                this.navigateToViewPhraseScreen();
            },
        });
    }
}
