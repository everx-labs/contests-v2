import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text, TouchableOpacity, Clipboard } from 'react-native';

import {
    UIStyle,
    UIComponent,
    UILocalized,
    UIButton,
    UILink,
    UIColor,
    UIButtonGroup,
    UIContractAddressInput,
    UIDetailsInput,
    UIUploadFileInput,
    UIToastMessage,
    UISeparator,
    UIUnfold,
    UINavigationBar,
} from '../../services/UIKit/UIKit';

import GovernanceScreen from './GovernanceScreen';
import Submissions from './Submissions';
import ProposalStatus from './ProposalStatus';
import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';
import FBInfoRequests from '../../services/Firebase/FBInfoRequests';
import icoBack from '@uikit/assets/ico-arrow-left/ico-arrow-left.png';
import icoClose from '@uikit/assets/ico-close/close-blue.png';
import SubmissionsFunctions from './SubmissionsFunctions';
import Table from '../../components/Table';

import icoNext from '@uikit/assets/ico-arrow-right/ico-arrow-right.png';

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
    noLetterSpacing: { letterSpacing: 0 },
});

const closeForm = (navigation) => {
    if (navigation.state?.params?.initialRoute) {
        if (navigation.state?.params?.proposalAddress && navigation.state?.params?.stats) {
            navigation.navigate('ManifestProposalScreen', { proposalAddress: navigation.state?.params?.proposalAddress });
        } else {
            navigation.navigate('ContestsScreen');
        }
    } else {
        navigation.pop();
    }
};

export class ManifestProposalScreen extends GovernanceScreen {
    static navigationOptions: CreateNavigationOptions = ({ navigation }) => {
        if (!navigation.state.params) return { header: null };
        const {
            topBarDivider, stats, onPrev, onNext,
        } = navigation.state.params;
        const dividerStyle = topBarDivider ? styles.topDivider : null;
        return {
            header: (
                <UINavigationBar
                    containerStyle={[
                        UIStyle.width.full(),
                        dividerStyle,
                    ]}
                    headerLeft={(
                        <UILink
                            textAlign={UILink.TextAlign.Left}
                            icon={stats ? icoClose : icoBack}
                            title={stats ? 'Close' : 'Back'}
                            onPress={stats ? () => closeForm(navigation) : () => navigation.navigate('ContestsScreen')}
                            buttonSize={UIButton.buttonSize.medium}
                        />
                    )}
                    headerRight={
                        <UIButtonGroup>
                            <UILink
                                textAlign={UILink.TextAlign.Left}
                                iconR={icoBack}
                                title=""
                                onPress={onPrev}
                                buttonSize={UIButton.buttonSize.medium}
                            />
                            <UILink
                                textAlign={UILink.TextAlign.Left}
                                iconR={icoNext}
                                title=""
                                onPress={onNext}
                                buttonSize={UIButton.buttonSize.medium}
                            />
                        </UIButtonGroup>
                    }
                />
            ),
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            gridColumns: 8,
            proposal: [],
            relatedProposals: [],
            contest: null,
            waitForFBAuth: false,
            ready: false,
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.tryGetProposal();
        this.subs = [
            this.props.navigation.addListener('willFocus', this.onSubmissionsFocus),
        ];
        this.props.navigation.setParams({
            ...this.props.navigation.state.params,
            onPrev: this.onPrev,
            onNext: this.onNext,
        });
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
            this.getProposal();
            this.setStateSafely({ waitForFBAuth: false });
        }
    }

    onSubmissionsFocus = () => {
        this.tryGetProposal();
    }

    tryGetProposal() {
        if (this.props.isLoggedIn) {
            this.getProposal();
        } else {
            this.setStateSafely({
                waitForFBAuth: true,
            });
        }
    }

    copyData(data) {
        Clipboard.setString(data);
        UIToastMessage.showMessage('Copied to clipboard.', 1500);
    }

    getIndexOfCurrentProposal() {
        return this.state.proposalsWithNoStats
            .map(pr => pr.title)
            .indexOf(this.state.proposal.title);
    }

    gotoProposal(proposalAddress) {
        this.props.navigation.push(
            'ManifestProposalScreen',
            { proposalAddress },
        );
    }

    onPrev = () => {
        if (!this.state.proposalsWithNoStats) return;
        const indexOfProposal = this.getIndexOfCurrentProposal();
        let nextIndex = 0;
        if (indexOfProposal === 0) {
            nextIndex = this.state.proposalsWithNoStats.length - 1;
        } else {
            nextIndex = indexOfProposal - 1;
        }
        this.gotoProposal(this.state.proposalsWithNoStats[nextIndex].proposalWalletAddress);
    }

    onNext = () => {
        if (!this.state.proposalsWithNoStats) return;
        const indexOfProposal = this.getIndexOfCurrentProposal();
        let nextIndex = 0;
        if (indexOfProposal >= this.state.proposalsWithNoStats.length - 1) {
            nextIndex = 0;
        } else {
            nextIndex = indexOfProposal + 1;
        }
        this.gotoProposal(this.state.proposalsWithNoStats[nextIndex].proposalWalletAddress);
    }

    getProposal() {
        let proposal = null;
        let relatedProposals = [];
        this.setStateSafely({ ready: false });
        const { proposalAddress, isGlobal, stats } = this.getNavigationParams();

        //    for next/prev functionality:
        SubmissionsFunctions.getProposals([], false, false).then((proposalsWithNoStats) => {
            this.setStateSafely({ proposalsWithNoStats: proposalsWithNoStats.reverse() });
        });

        SubmissionsFunctions.getProposals([proposalAddress], isGlobal).then((proposals) => {
            [proposal] = proposals;
        }).then(() => {
            // dirty. it should be removed when overall functionality appears in contract
            if (stats) return SubmissionsFunctions.getContestSubmissions(proposal);
        }).then(() => {
            if (proposal.relatedProposals) {
                const relatedAddresses = proposal.relatedProposals.split(',');
                console.log('relatedAddresses: ', relatedAddresses);
                return SubmissionsFunctions.getProposals(relatedAddresses, isGlobal);
            }
            return [];
        })
            .then((relatedProposalsResult) => {
                relatedProposals = relatedProposalsResult;
            })
            .catch((error) => {
                console.log('getProposal error: ', error);
            })
            .finally(() => {
                if (!proposal) this.props.navigation.navigate('ErrorScreen');
                else this.setStateSafely({ proposal, relatedProposals, ready: true });
            });
    }

    isLoading() {
        return (this.state.waitForFBAuth || !this.state.ready);
    }

    renderUnfoldContent() {
        const { proposal } = this.state;
        const content = (
            <React.Fragment>
                <TouchableOpacity onPress={() => this.copyData(proposal.proposalWalletAddress)}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.ProposalWalletAddress}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {proposal.proposalWalletAddress}
                    </Text>
                </TouchableOpacity>
                {proposal.messageId &&
                <TouchableOpacity onPress={() => this.copyData(proposal.messageId)}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.MessageID}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {proposal.messageId}
                    </Text>
                </TouchableOpacity>
                }
                <TouchableOpacity onPress={() => this.copyData(proposal.judgeWalletAddress)}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.ProposalJudgeAddress}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {proposal.judgeWalletAddress}
                    </Text>
                </TouchableOpacity>

                {proposal.contestAddress &&
                <TouchableOpacity onPress={() => this.copyData(proposal.contestAddress)}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.ContestAddress}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {proposal.contestAddress}
                    </Text>
                </TouchableOpacity>
                }

                {proposal.discussionLink &&
                <TouchableOpacity onPress={this.openDiscussionLink}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.ToDiscuss}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {proposal.discussionLink}
                    </Text>
                </TouchableOpacity>
                }
            </React.Fragment>
        );
        if (!proposal.contestAddress) return content;
        return (
            <UIUnfold
                content={content}
                style={UIStyle.margin.topHuge()}
                titleHide="Hide"
                titleShow="Show more"
                unfolded={this.state.unfolded}
                onPress={unfolded => this.setStateSafely({ unfolded })}
                showButton={false}
            />
        );
    }

    isContest() {
        return !!this.state.proposal.contestStatus;
    }

    openDiscussionLink = () => {
        const link = this.state.proposal.discussionLink;
        window.open && window.open(
            link.startsWith('https') ? `${link}` : `https://${link}`,
            '_blank',
        );
    }

    openNewSubmissionForm = () => {
        this.props.navigation.push('NewSubmissionScreen', this.getNavigationParams());
    }

    renderBottomButton() {
        const { stats } = this.getNavigationParams();
        if (stats) return null;
        const { proposal } = this.state;
        let title = TONLocalized.Contests.ToDiscuss;
        let onPress = this.openDiscussionLink;
        let disabled = false;
        if (this.isContest() && (proposal.contestStatus === 'Upcoming' || proposal.contestStatus === 'Underway')) {
            title = TONLocalized.Contests.AddSubmission;
            onPress = this.openNewSubmissionForm;
            disabled = proposal.contestStatus === 'Upcoming';
        }
        return (
            <UIButton
                style={[
                    UIStyle.common.alignSelfCenter(),
                    UIStyle.width.half(),
                    UIStyle.margin.bottomHuge(),
                    UIStyle.margin.topSpacious(),
                ]}
                buttonShape={UIButton.ButtonShape.Rounded}
                title={title}
                onPress={onPress}
                disabled={disabled}
            />
        );
    }

    renderStat = (doc, rank) => {
        let valueColor = null;
        if (doc.text === 'Passed') valueColor = UIColor.success();
        if (doc.text === 'Not passed') valueColor = UIColor.error();
        return (
            <View key={`stat-${rank}`} style={[UIStyle.common.flexRow(), UIStyle.common.justifySpaceBetween(), UIStyle.common.alignCenter()]}>
                <Text style={[UIStyle.text.secondaryBodyRegular(), styles.noLetterSpacing]}>
                    {doc.text}
                </Text>
                <Text style={[
                    UIStyle.text.secondaryBodyBold(),
                    styles.noLetterSpacing,
                    valueColor ? { color: valueColor } : null]}
                >
                    {doc.value}
                </Text>
            </View>
        );
    }

    renderStatsPerJurors() {
        const { proposal } = this.state;
        if (!proposal.jurorsStats || !proposal.jurorsStats.length) return null;
        return (
            <View style={[UIStyle.margin.bottomMassive()]}>
                <UISeparator color={UIColor.whiteLight()} style={[UIStyle.margin.topHuge()]} />
                <Text style={[UIStyle.text.primarySubtitleBold(), styles.noLetterSpacing, UIStyle.margin.topGreat()]}>
                    {'Overall Juror Activity'}
                </Text>
                {
                    proposal.jurorsStats.map((jur, rank) => {
                        const addrStart = jur.juryAddress.substr(0, 9);
                        const addrEnd = jur.juryAddress.substr(jur.juryAddress.length - 9, 9);
                        const addr = `${addrStart} ···· ${addrEnd}`;
                        return (
                            <View key={`overall-juror-${rank}`}>
                                <View style={[UIStyle.common.flexRow(), UIStyle.margin.topHuge(), UIStyle.common.justifySpaceBetween()]}>
                                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing]}>
                                        {addr}
                                    </Text>
                                    <Text style={[UIStyle.text.primaryBodyBold(), styles.noLetterSpacing]}>
                                        {jur.weight.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={[UIStyle.common.flexRow(), UIStyle.margin.topTiny()]}>
                                    <Text style={[UIStyle.text.secondaryCaptionRegular(), styles.noLetterSpacing]}>
                                        {`${jur.submissionVotes} submisson votes`}
                                    </Text>
                                    <Text style={[UIStyle.text.tertiaryCaptionRegular(), styles.noLetterSpacing, { marginLeft: 8 }]}>
                                        {`${jur.pointsAwarded} points awarded`}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
            </View>
        );
    }

    renderStatsOnly() {
        const { proposal } = this.state;
        const items = [
            { text: 'Total points awarded', value: proposal.totalScore },
            { text: 'Total votes', value: proposal.jurorsVoted },
            { text: 'Avg. score', value: proposal.ave?.toFixed(2) },
            { text: 'Submissions', value: proposal.entriesCount },
        ];
        if (proposal.isFinalized) {
            items.push({ text: 'Passed', value: proposal.passed });
            items.push({ text: 'Not passed', value: proposal.rejected });
        }
        return (
            <View>
                <Text style={[UIStyle.text.primaryTitleBold(), styles.noLetterSpacing, UIStyle.margin.topVast()]}>
                    {'Contest Voting Statistics'}
                </Text>
                <Table
                    style={UIStyle.margin.topDefault()}
                    items={items.map(this.renderStat)}
                />
                {this.renderStatsPerJurors()}
            </View>
        );
    }

    renderCenterColumn() {
        const { proposal } = this.state;
        const dateStr = this.isContest() ?
            ProposalStatus.getContestDateString(proposal) :
            null;

        const { proposalAddress, stats } = this.getNavigationParams();
        if (this.isContest() && stats) {
            return this.renderStatsOnly();
        }

        return (
            <View>
                <Text style={[
                    UIStyle.text.primaryTitleBold(),
                    styles.noLetterSpacing,
                    UIStyle.margin.topVast(),
                    UIStyle.margin.bottomHuge()]}
                >
                    {proposal.title}
                </Text>

                {dateStr &&
                <View style={UIStyle.margin.topHuge()}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                        {TONLocalized.Contests.Date || 'Contest date'}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                        {dateStr}
                    </Text>
                </View>
                }

                <View style={UIStyle.margin.topHuge()}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                        {TONLocalized.Contests.Status}
                    </Text>
                    <ProposalStatus
                        contest={this.isContest()}
                        proposal={proposal}
                        statusTextStyle={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing]}
                        dateTextStyle={[UIStyle.text.tertiaryBodyRegular(), styles.noLetterSpacing]}
                    />
                </View>

                {proposal.status !== 'Review' &&
                <View>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topMedium()]}>
                        {TONLocalized.Contests.ProposalResult || 'Proposal result'}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                        {
                            proposal.status === 'Voting' && proposal.signsReceived && proposal.custodians && proposal.custodians.length ?
                                `${Math.floor(parseInt(proposal.signsReceived, 16) * 100 / proposal.custodians.length)}% said “Yes”` :
                                proposal.status === 'Passed' ? 'More than 50% said “Yes”' :
                                    proposal.status === 'Rejected' ? 'Less than 50% said “Yes”' : 'Cannot calculate'
                        }
                    </Text>
                </View>
                }

                <TouchableOpacity onPress={() => { window.open && window.open(proposal.proposalFile, '_blank'); }}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                        {TONLocalized.Contests.Description}
                    </Text>
                    <Text style={[UIStyle.text.bodyRegular(), styles.noLetterSpacing, { color: UIColor.primary() }, UIStyle.margin.topTiny()]}>
                        {`${proposal.title}.pdf`}
                    </Text>
                    {
                        !!this.state.relatedProposals.length &&
                        this.state.relatedProposals.map(rel => (
                            <TouchableOpacity
                                key={rel.title}
                                onPress={() => { window.open && window.open(rel.proposalFile, '_blank'); }}
                            >
                                <Text style={[UIStyle.text.bodyRegular(), styles.noLetterSpacing, { color: UIColor.primary() }, UIStyle.margin.topTiny()]}>
                                    {`${rel.title}.pdf`}
                                </Text>
                            </TouchableOpacity>
                        ))
                    }
                </TouchableOpacity>

                {!!proposal.contestComment && <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                    {'Comments'}
                </Text>}
                {!!proposal.contestComment && <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                    {proposal.contestComment}
                </Text>}

                {this.renderUnfoldContent()}

                {!!proposal.proposalOnlyComment && <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, UIStyle.margin.topHuge()]}>
                    {'Comment'}
                </Text>}

                {!!proposal.proposalOnlyComment &&
                <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny(), UIStyle.common.flex()]}>
                    {proposal.proposalOnlyComment}
                </Text>}

                {proposal.contestAddress && <Submissions navigation={this.props.navigation} proposal={proposal} />}
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

export default connect(mapStateToProps)(ManifestProposalScreen);
