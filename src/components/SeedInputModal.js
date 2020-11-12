// @flow
import React from 'react';
import { View, StyleSheet, Image, Text, ScrollView, TouchableOpacity } from 'react-native';

import {
    UIStyle,
    UIModalController,
    UISeedPhraseInput,
    UILocalized,
    UIButton,
    UIBadge,
    UIColor,
    UIButtonGroup,
    UIDetailsInput,
} from '../services/UIKit';

import TONLocalized from '../helpers/TONLocalized';
import { walletSetupSeedPhraseLength } from '../helpers/TONWalletSetup/helpers/WalletSetupPassword';
import { TONKeystore, TONTokensWallet } from '../helpers/TONWallet';

type Props = {};
type State = {};

let shared;

export default class SeedInputModal extends UIModalController<Props, State> {
    static defaultProps = {
        isShared: false,
    };

    static show(args: ModalControllerShowArgs) {
        if (shared) {
            shared.show(args);
        }
    }

    static hide(args: ModalControllerShowArgs) {
        if (shared) {
            shared.hide();
        }
    }

    static focus() {
        if (shared) {
            shared.focus();
        }
    }

    constructor(props: Props) {
        super(props);
        this.fullscreen = false;
        this.modalOnWeb = false;
        this.state = {
            seed: '',
            isSeedValid: false,
            proccessing: false,
            words: [],
            rate: '',
            publicComment: '',
        };
    }

    componentDidMount() {
        super.componentDidMount();
        if (this.props.isShared) {
            shared = this;
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.props.isShared) {
            shared = null;
        }
    }

    async show(args: any) {
        if (typeof args === 'object') {
            this.onVote = args.onVote;
            this.address = args.address;
        }
        await super.show(args);
        this.loadWords();

        this.setStateSafely({
            seed: '',
            isSeedValid: false,
            proccessing: false,
            rate: '',
            publicComment: '',
        });
        this.focus();
    }

    async focus() {
        // this.seedRef && this.seedRef.focus();
    }

    onSubmit = () => {
        // this.hide();
        const seed = this.state.seed.split(' — ').join(' ');
        this.setStateSafely({ proccessing: true });
        this.onVote && this.onVote(this.address, seed, this.state.isSeedValid, this.state.rate, this.state.publicComment);
    };

    loadWords() {
        TONKeystore.mnemonicWords(TONKeystore.walletParams.hd)
            .then(words => this.setStateSafely({ words }))
            .catch((error) => {
                console.log('Failed to loadWords', error);
            });
    }

    onSeedPhraseChange = (seed: string) => {
        this.setStateSafely({ seed });
        TONTokensWallet.isSeedPhraseValid(seed).then(isSeedValid => this.setStateSafely({ isSeedValid }));
    }

    renderSeed() {
        return (
            <UISeedPhraseInput
                ref={(me) => { this.seedRef = me; }}
                value={this.state.seed}
                onChangeText={this.onSeedPhraseChange}
                placeholder={TONLocalized.Contests.MasterPassword}
                isSeedPhraseValid={this.state.isSeedValid}
                totalWords={walletSetupSeedPhraseLength}
                words={this.state.words}
                containerStyle={[UIStyle.margin.topMedium()]}
            />
        );
    }

    renderBadge = (i) => {
        return (
            <TouchableOpacity onPress={() => this.setStateSafely({ rate: i })}>
                <UIBadge
                    key={`badge-${i}`}
                    allowZero
                    badge={i}
                    inverted={i !== this.state.rate}
                    style={{
                        width: i !== 'To abstain' && i !== 'Reject' ? 48 : 115,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: i === this.state.rate ? UIColor.primary() : UIColor.whiteLight(),
                    }}
                    textStyle={[
                        UIStyle.text.bodyMedium(),
                        {
                            color: i === this.state.rate ? UIColor.white() :
                                i === 'Reject' ? UIColor.error() :
                                    i === 'To abstain' ? '#5E6E77' :
                                        UIColor.black(),
                        },
                    ]}
                />
            </TouchableOpacity>
        );
    }

    isSubmitDisabled() {
        if (this.address.participantAddress) {
            return !this.state.isSeedValid ||
                !this.state.publicComment ||
                (this.state.rate !== 0 && !this.state.rate);
        }
        return !this.state.isSeedValid;
    }

    renderContentView() {
        return (
            <View style={[
                UIStyle.height.full(),
            ]}
            >
                <ScrollView contentContainerStyle={[
                    UIStyle.padding.default(),
                ]}
                >
                    <Text style={[UIStyle.text.primarySubtitleBold(), { fontSize: 32, lineHeight: 40 }]}>
                        {TONLocalized.CastYourVote}
                    </Text>
                    {this.address.title &&
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular()]}>
                            {this.address.participantAddress ? TONLocalized.Contests.Submission : TONLocalized.Contests.Proposal}
                        </Text>
                        <Text style={[UIStyle.text.primaryBodyRegular(), UIStyle.margin.topTiny()]}>
                            {this.address.title}
                        </Text>
                    </View>
                    }

                    {this.address.participantAddress &&
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular()]}>
                            {'Put a point'}
                        </Text>
                        <UIButtonGroup style={[UIStyle.margin.topDefault(), UIStyle.common.justifySpaceBetween(), { maxWidth: 345 }]} gutter={0}>
                            {
                                [6, 7, 8, 9, 10].reverse().map(this.renderBadge)
                            }
                        </UIButtonGroup>
                        <UIButtonGroup style={[UIStyle.margin.topDefault(), UIStyle.common.justifySpaceBetween(), { maxWidth: 345 }]} gutter={0}>
                            {
                                [1, 2, 3, 4, 5].reverse().map(this.renderBadge)
                            }
                        </UIButtonGroup>
                        <UIButtonGroup style={[UIStyle.margin.topDefault(), { maxWidth: 345 }]} gutter={0}>
                            {
                                ['To abstain', 'Reject'].map(this.renderBadge)
                            }
                        </UIButtonGroup>
                        <UIDetailsInput
                            value={this.state.publicComment}
                            placeholder="Public comment"
                            onChangeText={(publicComment) => { this.setStateSafely({ publicComment: publicComment.substr(0, 120) }); }}
                            containerStyle={[{ height: 72 }, UIStyle.margin.topBig()]}
                        />
                    </View>
                    }

                    {this.renderSeed()}

                    <UIButton
                        title={TONLocalized.Contests.SignAndVote}
                        onPress={this.onSubmit}
                        disabled={this.isSubmitDisabled()}
                        showIndicator={this.state.proccessing}
                        style={[UIStyle.margin.topHuge(), UIStyle.margin.bottomMajor()]}
                    />
                </ScrollView>
            </View>
        );
    }
}
