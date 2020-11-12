import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text, Clipboard, TouchableOpacity } from 'react-native';

import {
    UIStyle,
    UIComponent,
    UILocalized,
    UIButton,
    UILink,
    UIColor,
    UIButtonGroup,
    UIToastMessage,
    UIGrid,
    UIGridColumn,
    UIConstant,
    UISeparator,
} from '../../services/UIKit/UIKit';

import { TONKeystore, TONTokensWallet } from '../../helpers/TONWallet';

import GovernanceScreen from './GovernanceScreen';
import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';
import FBInfoRequests from '../../services/Firebase/FBInfoRequests';
import SeedInputModal from '../../components/SeedInputModal';
import EnvManager from './helpers/EnvManager';

import Table from '../../components/Table';
import TabbedBar from './TabbedBar';

import ProposalStatus from './ProposalStatus';
import imgProposalWallet from '../../assets/manifest/contest/wallet.png';
import imgProposalWalletHover from '../../assets/manifest/contest/wallet-hover.png';
import imgJudgeWallet from '../../assets/manifest/contest/custody-off.png';
import imgJudgeWalletHover from '../../assets/manifest/contest/custody-hover.png';
import imgProfile from '../../assets/manifest/contest/profile.png';
import imgProfileHover from '../../assets/manifest/contest/profile.png';
import imgPdfLink from '../../assets/manifest/contest/doc.png';
import imgPdfLinkHover from '../../assets/manifest/contest/doc-hover.png';
import imgApproved from '../../assets/manifest/contest/vote.png';
import imgLock from '../../assets/manifest/contest/lock.png';
import SubmissionsFunctions from './SubmissionsFunctions';
import imgUpRight from '../../assets/arrow-up-right.png';
import imgUpRightAction from '../../assets/arrow-up-right-action.png';

const mltsgPackage = require('./SafeMultisigWallet.js');

const TOP_MENU_OFFSET_NARROW = 212 + 88;
const TOP_MENU_OFFSET_LARGE = 132 + 88;

const getTopOffset = isNarrow => (isNarrow ? TOP_MENU_OFFSET_NARROW : TOP_MENU_OFFSET_LARGE);

const transferAbi = {
    'ABI version': 1,
    functions: [
        {
            name: 'transfer',
            id: '0x00000000',
            inputs: [{ name: 'comment', type: 'bytes' }],
            outputs: [],
        },
    ],
    events: [],
    data: [],
};

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
    noLetterSpacing: { letterSpacing: 0 },
});

export class ManifestProposalsScreen extends GovernanceScreen {
    static navigationOptions: CreateNavigationOptions = GovernanceScreen.createNavigationOptions();

    constructor(props) {
        super(props);
        this.state = {
            gridColumns: 8,
            proposals: [],
            ready: false,
            waitForFBAuth: false,
            scrollViewHeight: 0,
            contentWidth: 0,
            topMenuOffset: getTopOffset(props.isNarrow),
            showAbsContent: false,
            tabName: 'contests',
            multisigBalance: null,
            giverBalance: null,
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.tryUpdateProposalsList();
        this.subs = [
            this.props.navigation.addListener('willFocus', this.onProposalsFocus),
        ];
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.subs.forEach(sub => sub.remove());
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.isLoggedIn &&
            prevProps.isLoggedIn !== this.props.isLoggedIn &&
            this.state.waitForFBAuth
        ) {
            this.updateProposalsList();
            this.setStateSafely({ waitForFBAuth: false });
        }
    }

    onProposalsFocus = () => {
        const { section } = this.getNavigationParams();
        const tabName = (section === 'proposals' || section === 'contests' || section === 'globals') ? section : 'contests';
        this.setStateSafely({
            topMenuOffset: getTopOffset(this.props.isNarrow),
            showAbsContent: false,
            tabName,
        });
        this.tryUpdateProposalsList();
    }

    onTimerOut = () => {
        this.tryUpdateProposalsList();
    }

    tryUpdateProposalsList() {
        if (this.props.isLoggedIn) {
            this.updateProposalsList();
        } else {
            this.setStateSafely({
                waitForFBAuth: true,
            });
        }
    }

    updateProposalsList() {
        this.setStateSafely({ ready: false });
        const multisigAddress = Constant.juryWalletAddress(EnvManager.getGovernance());
        multisigAddress && SubmissionsFunctions.queryBalance(multisigAddress, (balance) => {
            const multisigBalance = Math.trunc(balance * 1000) / 1000;
            this.setStateSafely({ multisigBalance });
        });

        let proposals = [];
        let globalProposals = [];
        SubmissionsFunctions.getProposals().then((proposalsResult) => {
            proposals = proposalsResult;
            // and now get submissions
            return Promise.all(proposals.map((proposal) => {
                return SubmissionsFunctions.getContestSubmissions(proposal, '', false).then((submissions) => {
                    proposal.submissions = submissions;
                });
            }));
        })
            .catch((error) => {
                console.log('FBProposals error: ', error);
            })
            .then(() => {
                if (EnvManager.isFreeton()) return;
                // Subgovernance
                return FBInfoRequests.getCollection(FBInfoRequests.SUBGOVERNANCES)
                    .doc(EnvManager.getGovernance())
                    .get();
            })
            .then((subgovernanceTable) => {
                if (!subgovernanceTable || !subgovernanceTable.exists) return [];
                const giverAddress = subgovernanceTable.data().giver;
                giverAddress && SubmissionsFunctions.queryBalance(giverAddress, (balance) => {
                    const giverBalance = Math.trunc(balance * 1000) / 1000;
                    this.setStateSafely({ giverBalance });
                });
                let globals = subgovernanceTable.data().globals;
                globals = globals?.split(',');
                if (globals && globals.length >= 1) {
                    return SubmissionsFunctions.getProposals(
                        globals,
                        true,
                    );
                }
                return [];
            })
            .then((globalProposalsResult) => {
                globalProposals = globalProposalsResult;
                // and now get submissions for global proposals
                return Promise.all(globalProposals.map((proposal) => {
                    return SubmissionsFunctions.getContestSubmissions(proposal, '', false).then((submissions) => {
                        proposal.submissions = submissions;
                    });
                }));
            })
            .catch((error) => {
                console.log('Global proposals error: ', error);
            })
            .finally(() => {
                // console.log('updateProposalsList, proposals:', proposals);
                this.setStateSafely({ proposals, globalProposals, ready: true });
            });
    }

    copyProposalAddress(address) {
        Clipboard.setString(address);
        UIToastMessage.showMessage('Proposal address copied to clipboard.', 1500);
    }

    copyContestAddress(address) {
        Clipboard.setString(address);
        UIToastMessage.showMessage('Contest address copied to clipboard.', 1500);
    }

    getMenuItems() {
        const items = [
            {
                title: TONLocalized.Contests.Contests,
                note: this.state.proposals.filter(pr => (pr.contestAddress && (pr.contestStatus === 'Underway' || pr.contestStatus === 'Voting'))).length,
                tabName: 'contests',
                onPress: () => { this.onSelectTab('contests'); },
            },
            {
                title: TONLocalized.Contests.Proposals,
                note: this.state.proposals.filter(pr => (pr.status === 'Review' || pr.status === 'Voting' || (pr.status === 'Passed' && !pr.contestAddress && !pr.isProposalOnly))).length,
                tabName: 'proposals',
                onPress: () => { this.onSelectTab('proposals'); },
            },
        ];

        if (!EnvManager.isFreeton()) {
            items.push({
                title: TONLocalized.Contests.GlobalProposals,
                note: 0,
                tabName: 'globals',
                onPress: () => { this.onSelectTab('globals'); },
            });
            const tgGroup = EnvManager.getTelegramGroup(EnvManager.getGovernance());
            if (tgGroup) {
                items.push({
                    title: 'Telegram Group',
                    icon: imgUpRight,
                    iconHover: imgUpRightAction,
                    note: 0,
                    link: tgGroup,
                });
            }
        }

        return items;
    }

    onSelectTab = (tabName: string) => {
        this.setStateSafely({ tabName });
        this.scrollTo(getTopOffset(this.props.isNarrow) + 1);
        window.history.pushState(null, '', `${window.location.pathname}?section=${tabName}`);
    }

    onScroll = (e: any) => {
        const { contentOffset, contentSize } = e.nativeEvent;
        const y = contentOffset.y;
        if (y > getTopOffset(this.props.isNarrow)) {
            if (!this.state.showAbsContent) this.setStateSafely({ showAbsContent: true });
        } else if (this.state.showAbsContent) this.setStateSafely({ showAbsContent: false });
    }

    setTopMenuOffset(topMenuOffset: number) {
        this.setStateSafely({ topMenuOffset });
    }

    getTopMenuOffset() {
        return this.state.topMenuOffset;
    }

    getShortProposalTitle(title) {
        const MAX_TITLE_LENGTH = 60;
        return title.length <= MAX_TITLE_LENGTH ?
            title :
            `${title.substring(0, MAX_TITLE_LENGTH)}...`;
    }

    renderContest = (doc, rank) => {
        const title = doc.title;// this.getShortProposalTitle(doc.title);
        return (
            <View key={`contest-${rank}`}>
                <TouchableOpacity
                    style={[UIStyle.common.flex(), UIStyle.margin.topMedium()]}
                    onPress={
                        () => this.props.navigation.push(
                            'ProposalScreen',
                            { proposalAddress: doc.proposalWalletAddress },
                        )}
                >
                    <Text style={[
                        UIStyle.text.primaryAccentMedium(),
                        styles.noLetterSpacing,
                        UIStyle.common.flex(),
                    ]}
                    >{title}
                    </Text>
                </TouchableOpacity>

                <View style={[UIStyle.common.flexRow(), UIStyle.common.justifySpaceBetween()]}>
                    <View>
                        <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                            {ProposalStatus.getContestDateString(doc)}
                        </Text>
                        <ProposalStatus contest proposal={doc} style={UIStyle.margin.topTiny()} onTimerOut={this.onTimerOut} />
                        {(doc.contestStatus === 'Upcoming' || doc.contestStatus === 'Underway') &&
                        <UIButtonGroup style={[UIStyle.margin.topMedium()]}>
                            <UIButton
                                title={TONLocalized.Contests.AddSubmission}
                                disabled={doc.contestStatus === 'Upcoming'}
                                onPress={() => this.props.navigation.push(
                                    'NewSubmissionScreen',
                                    { proposalAddress: doc.proposalWalletAddress },
                                )}
                                buttonShape={UIButton.ButtonShape.Rounded}
                                buttonSize={UIButton.ButtonSize.Small}
                            />
                            {doc.submissions?.length &&
                            <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                                {`${doc.submissions?.length} on review`}
                            </Text>
                            }
                        </UIButtonGroup>
                        }
                    </View>
                    <View style={UIStyle.common.alignEnd()}>
                        <TouchableOpacity onPress={() => {
                            this.copyContestAddress(doc.contestAddress);
                        }}
                        >
                            <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                                {doc.contestAddress.substr(0, 6)}
                            </Text>
                        </TouchableOpacity>
                        <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                            {doc.contestBalance && doc.contestBalance.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    onVote = async (proposal, seed) => {
        const password = '111111';
        const passwordProvider = (showHUD, callback) => {
            const hideHud = () => {};
            callback(password, hideHud);
        };

        try {
            const walletInstance = new TONTokensWallet(
                password,
                seed,
                passwordProvider,
            );
            TONTokensWallet.setWalletInstance(walletInstance);
            const keys = await TONTokensWallet.getWalletInstance()?.getGRAMAddressKeyPair();

            /* const custodian = proposal.custodians.find((custodian) => { return custodian.pubkey === `0x${keys.public}`; });
            if (!custodian) {
                throw new Error('Custodian not found');
            } */

            if (proposal.status === 'Review') {
                const transferBodyBase64 = (await window.TONClient.contracts.createRunBody({
                    abi: transferAbi,
                    function: 'transfer',
                    params: { comment: Buffer.from(proposal.title).toString('hex') },
                    internal: true,
                })).bodyBase64;
                await window.TONClient.contracts.run({
                    address: proposal.judgeWalletAddress,
                    abi: mltsgPackage.abi,
                    functionName: 'submitTransaction',
                    input: {
                        dest: proposal.proposalWalletAddress,
                        value: 1e6,
                        bounce: false,
                        allBalance: false,
                        payload: transferBodyBase64,
                    },
                    keyPair: keys,
                });
                // update status
                await SubmissionsFunctions.getProposal(proposal);
                this.setStateSafely({});
                SeedInputModal.hide();
                return;
            }

            await window.TONClient.contracts.run({
                address: proposal.judgeWalletAddress,
                abi: mltsgPackage.abi,
                functionName: 'confirmTransaction',
                input: { transactionId: proposal.trid },
                keyPair: keys,
            });
            // update votes
            await SubmissionsFunctions.getProposal(proposal);
            this.setStateSafely({});
            UIToastMessage.showMessage(TONLocalized.Contests.VoteHasCast);
        } catch (error) {
            const resultError = SubmissionsFunctions.convertError(error, 'proposal');
            UIToastMessage.showMessage(resultError.message);
            // UIToastMessage.showMessage(TONLocalized.Contests.VoteFailed);
            console.log('onVote error: ', error);
        }
        SeedInputModal.hide();
    }

    vote = (proposal) => {
        // this.onVote(address, 'clarify weather oppose main name clerk silly humble curtain wave initial settle'); return;
        // three what hospital wire humble glimpse hint suggest buffalo reunion rookie neither
        SeedInputModal.show({
            onVote: this.onVote,
            address: proposal,
        });
        SeedInputModal.focus();
    }

    renderProposal = (doc, rank) => {
        const title = doc.title;// this.getShortProposalTitle(doc.title);
        const isGlobal = this.state.globalProposals &&
          this.state.globalProposals.length &&
          !!this.state.globalProposals.find(pr => doc.proposalWalletAddress === pr.proposalWalletAddress);

        return (
            <View key={`proposal-${rank}`}>
                <View style={[UIStyle.margin.topMedium(), UIStyle.common.flexRow(), UIStyle.common.justifySpaceBetween(), UIStyle.common.alignCenter()]}>
                    <TouchableOpacity
                        style={UIStyle.common.flex()}
                        onPress={
                            () => this.props.navigation.push(
                                'ProposalScreen',
                                {
                                    proposalAddress: doc.proposalWalletAddress,
                                    isGlobal,
                                },
                            )}
                    >
                        <Text style={[
                            UIStyle.text.primaryAccentMedium(),
                            styles.noLetterSpacing,
                            UIStyle.common.flex(),
                        ]}
                        >{title}
                        </Text>
                    </TouchableOpacity>

                    <UILink
                        icon={imgPdfLink}
                        iconHover={imgPdfLinkHover}
                        href={doc.proposalFile}
                        target="_blank"
                        iconStyle={{ tintColor: '' }}
                        iconHoverStyle={{ tintColor: '' }}
                        style={{ paddingLeft: 0 }}
                        textAlign={UILink.TextAlign.Left}
                        tooltip=".PDF"
                    />
                </View>
                <ProposalStatus proposal={doc} style={UIStyle.margin.topTiny()} onTimerOut={this.onTimerOut} />
                <UIButtonGroup style={[UIStyle.margin.topDefault()]} gutter={8}>
                    {(doc.status === 'Voting' || doc.status === 'Review') &&
                    <UILink
                        title={TONLocalized.Contests.CastYourVote}
                        style={[{ paddingLeft: 0 }]}
                        textAlign={UILink.TextAlign.Left}
                        onPress={() => this.vote(doc)}
                    />
                    }
                    {doc.status === 'Voting' && doc.signsReceived && doc.custodians && doc.custodians.length &&
                    <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                        {`${Math.floor(parseInt(doc.signsReceived, 16) * 100 / doc.custodians.length)}% said “Yes”`}
                    </Text>}
                    {doc.status === 'Passed' &&
                    <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                        {`More than 50% said “Yes”${!doc.contestAddress && !doc.isProposalOnly ? ' \uD83D\uDEA9' : ''}`}
                    </Text>}
                    {doc.status === 'Rejected' &&
                    <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing]}>
                        {'Less than 50% said “Yes”'}
                    </Text>}
                </UIButtonGroup>

            </View>
        );
    }

    isLoading() {
        return (this.state.waitForFBAuth || !this.state.ready);
    }

    renderAbsoluteContent() {
        return (
            <View
                style={[
                    UIStyle.common.positionAbsolute(),
                    UIStyle.common.backgroundPrimaryColor(),
                    {
                        width: this.state.contentWidth,
                        top: 0,
                        opacity: this.state.showAbsContent ? 100 : 0,
                    },
                ]}
                pointerEvents={this.state.showAbsContent ? 'auto' : 'none'}
            >
                {this.renderTabsGrid()}
            </View>
        );
    }

    renderProposals(proposals) {
        return (
            <Table
                items={(proposals || this.state.proposals).sort((pr1, pr2) => {
                    return (pr1.createdAt > pr2.createdAt) ? -1 : 1;
                }).map(this.renderProposal)}
            />
        );
    }

    renderContests() {
        return (
            <Table
                items={
                    this.state.proposals
                        .filter(pr => !!pr.contestAddress)
                        .sort((pr1, pr2) => {
                            return (pr1.dateEnd > pr2.dateEnd) ? -1 : 1;
                        })
                        .map(this.renderContest)}
            />
        );
    }

    renderBottomButton() {
        if (this.state.tabName !== 'proposals') return <View style={{ marginBottom: 128 }} />;
        return (
            <UIButton
                style={[
                    UIStyle.common.alignSelfCenter(),
                    UIStyle.width.half(),
                    UIStyle.margin.bottomHuge(),
                    UIStyle.margin.topSpacious(),
                ]}
                buttonShape={UIButton.ButtonShape.Rounded}
                title={TONLocalized.Contests.MakeProposal}
                onPress={() => this.props.navigation.push('NewProposalScreen')}
            />
        );
    }

    renderSection(): ?React$Node {
        const section = this.state.tabName;
        if (!section || section === 'contests') {
            return this.renderContests();
        }
        if (section === 'proposals') {
            return this.renderProposals();
        }
        if (section === 'globals') {
            return this.renderProposals(this.state.globalProposals);
        }
    }

    renderTitleGrid() {
        const withCommas = (n) => {
            return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };

        const cards = [];
        if (this.state.giverBalance) {
            cards.push({
                balance: this.state.giverBalance,
                note: 'Budget',
                link: `https://ton.live/accounts?section=details&id=${Constant.juryWalletAddress(EnvManager.getGovernance())}`,
            });
        }
        if (this.state.multisigBalance) {
            cards.push({
                balance: this.state.multisigBalance,
                note: 'Gas',
                link: `https://ton.live/accounts?section=details&id=${Constant.juryWalletAddress(EnvManager.getGovernance())}`,
            });
        }

        return (
            <UIGrid
                type={UIGrid.Type.C8}
                style={{
                    backgroundColor: UIColor.white(),
                }}
                ref={this.onRef}
                onLayout={this.onGridLayout}
            >
                <UIGridColumn medium={2} />
                <UIGridColumn medium={4}>
                    <Text style={[
                        UIStyle.text.primaryTitleBold(),
                        styles.noLetterSpacing,
                        this.props.isNarrow ? UIStyle.margin.topGiant() : UIStyle.margin.topBig(),
                    ]}
                    >
                        {EnvManager.governancePageTitle(EnvManager.getGovernance())}
                    </Text>
                    <View style={UIStyle.margin.topDefault()} />
                    {!!(cards && cards.length) &&
                        <UIButtonGroup gutter={48}>
                            {cards.map(card =>
                                (<TouchableOpacity key={`balance-${card.balance}`} onPress={() => { window.open(card.link, '_blank'); }}>
                                    <View style={{ marginTop: 12 }} />
                                    <Text style={[UIStyle.text.primaryBodyBold(), { fontSize: 20 }]}>
                                        {withCommas(card.balance)}
                                    </Text>
                                    <View style={UIStyle.margin.topTiny()} />
                                    <Text style={[UIStyle.text.secondarySmallRegular()]}>
                                        {card.note}
                                    </Text>
                                </TouchableOpacity>))}
                        </UIButtonGroup>
                    }
                </UIGridColumn>
                <UIGridColumn medium={2} />
            </UIGrid>
        );
    }

    renderTabsGrid() {
        return (
            <React.Fragment>
                <UIGrid
                    type={UIGrid.Type.C8}
                    style={{ backgroundColor: UIColor.white() }}
                >
                    <UIGridColumn medium={2} />
                    <UIGridColumn medium={6}>
                        <TabbedBar
                            activeTab={this.state.tabName}
                            menuItems={this.getMenuItems()}
                        />
                    </UIGridColumn>
                </UIGrid>
                <UISeparator color={UIColor.whiteLight()} />
            </React.Fragment>
        );
    }

    renderFullWidthContent = () => {
        return (
            <View>
                {this.renderTitleGrid()}
                <View style={{ marginTop: 20 }} />
                {this.renderTabsGrid()}
                <UIGrid
                    type={UIGrid.Type.C8}
                    style={{
                        backgroundColor: UIColor.white(),
                    }}
                    ref={this.onRef}
                    onLayout={this.onGridLayout}
                >
                    <UIGridColumn medium={2} />
                    <UIGridColumn medium={4}>
                        <View style={[UIStyle.margin.topSmall()]}>
                            {this.renderSection()}
                        </View>
                    </UIGridColumn>
                    <UIGridColumn medium={2} />
                </UIGrid>
            </View>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return ({
        isNarrow: state.controller.mobile,
        isLoggedIn: state.auth.isLoggedIn,
        ...ownProps,
    });
};

export default connect(mapStateToProps)(ManifestProposalsScreen);
