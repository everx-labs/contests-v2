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

import Table from '../../components/Table';
import ProposalStatus from './ProposalStatus';
import SeedInputModal from '../../components/SeedInputModal';
import GovernanceScreen from './GovernanceScreen';
import Submissions from './Submissions';
import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';
import icoBack from '@uikit/assets/ico-arrow-left/ico-arrow-left.png';
import icoNext from '@uikit/assets/ico-arrow-right/ico-arrow-right.png';
import icoClose from '@uikit/assets/ico-close/close-blue.png';
import SubmissionsFunctions from './SubmissionsFunctions';

const contestsOld = [
    '0:9065c4e843ac40324e8760586078ad351dcf653b200b3d1ae15d5f7f4ed427a6', // 'Airdrop Mechanics 1',
    '0:af5ed7c0973f357765c431fb201499f3187900bf67852e41d80d54704497d3ce', // 'Developers Contest: Soft Majority Voting system',
    '0:f3e2a2931f9145edaec74c8025910a254977dd95775d2596e27873515e41d3e0', // 'Validator Contest: Devops tools',
    '0:1f61b57e69298f23cdeea203bc704f189912f0b40eb658cd2a9351cd29c36b95', // 'Decentralized Support I -- Present Supporters',
    '0:28134d2ab5a4c24368c269cf254e45335225c3d236f52496178f77cb5719f955', // 'Decentralized Promotion',
    '0:4fcf06a199a9e14127a12cfe2423cb8010a4f82dc0bd6fe18f4846da6aae29b8', // 'Idea Management System Contest',
];

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
    noLetterSpacing: { letterSpacing: 0 },
});

const closeForm = (navigation) => {
    if (navigation.state?.params?.proposalAddress) {
        navigation.navigate('ProposalScreen', { proposalAddress: navigation.state?.params?.proposalAddress });
    } else {
        navigation.navigate('ContestsScreen');
    }
};

class ManifestSubmissionScreen extends GovernanceScreen {
    static navigationOptions: CreateNavigationOptions = ({ navigation }) => {
        if (!navigation.state.params) return { header: null };
        const {
            topBarDivider, proposalAddress, submissionId, submission,
        } = navigation.state.params;
        const dividerStyle = topBarDivider ? styles.topDivider : null;

        const nextSubmissionId = !submission ? null :
            submission.submissionsCount === submission.submissionId ? 1 :
                submission.submissionId + 1;
        // console.log('nextSubmissionId', nextSubmissionId);

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
                            icon={icoClose}
                            title="Close"
                            onPress={() => closeForm(navigation)}
                            buttonSize={UIButton.buttonSize.medium}
                        />
                    )}
                    headerRight={nextSubmissionId ? (
                        <UILink
                            textAlign={UILink.TextAlign.Left}
                            iconR={icoNext}
                            title={`Submission ${nextSubmissionId}`}
                            onPress={() => navigation.push('ManifestSubmissionScreen', { proposalAddress, submissionId: nextSubmissionId })}
                            buttonSize={UIButton.buttonSize.medium}
                        />
                    ) : null}
                />
            ),
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            gridColumns: 8,
            proposal: [],
            submission: null,
            contest: null,
            waitForFBAuth: false,
            ready: false,
            juryCount: 23,
            custodians: [],
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.tryGetProposal();
        this.subs = [
            this.props.navigation.addListener('willFocus', this.onSubmissionsFocus),
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

    getProposal() {
        let proposal = null;
        let submission = null;
        const { proposalAddress, submissionId } = this.getNavigationParams();
        this.setStateSafely({ ready: false });
        SubmissionsFunctions.getProposals(proposalAddress).then((proposals) => {
            [proposal] = proposals;
            return SubmissionsFunctions.getContestSubmissions(
                proposal,
                submissionId,
            );
        })
            .then((submissionsWithStats) => {
                // console.log('submissionsWithStats: ', submissionsWithStats);
                [submission] = submissionsWithStats;
                // console.log('submission: ', submission);
            })
            .catch((error) => {
                console.log('getProposal error: ', error);
            })
            .finally(() => {
                if (!proposal) this.props.navigation.navigate('ErrorScreen');
                else {
                    this.setStateSafely({ proposal, submission, ready: true });
                    this.props.navigation.setParams({
                        ...this.props.navigation.state.params,
                        submission,
                    });
                }
            });
    }

    isLoading() {
        return (this.state.waitForFBAuth || !this.state.ready);
    }

    isContest() {
        return !!this.state.proposal.contestStatus;
    }

    getCreatedAtStr() {
        const createdAtDate = this.state.submission.createdAt;
        const createdAtDayStr = createdAtDate.toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' },
        );

        // it gives 24hour format with no seconds
        const createdAtTimeStr = createdAtDate.toLocaleTimeString(
            'en-GB',
            { hour: '2-digit', minute: '2-digit' },
        );

        const createdAtStr = `${createdAtDayStr}, ${createdAtTimeStr}`;
        return createdAtStr;
    }

    copyData(data) {
        Clipboard.setString(data);
        UIToastMessage.showMessage('Copied to clipboard.', 1500);
    }

    onVote = async (submission, seed, seedValid, rate, publicComment) => {
        const result = await SubmissionsFunctions.voteSubmission(
            this.state.proposal.contestAddress,
            this.state.submission,
            seed,
            rate,
            publicComment,
        );
        SeedInputModal.hide();
        if (result.success !== true) {
            UIToastMessage.showMessage(result.message);
            // UIToastMessage.showMessage(`${TONLocalized.Contests.VoteFailed}`);
            return;
        }
        UIToastMessage.showMessage(TONLocalized.Contests.VoteHasCast);
        // and now, update stats:
        SubmissionsFunctions.getSubmissionStats(this.state.proposal, this.state.submission)
            .then((submission) => {
                this.setStateSafely({ submission });
            })
            .catch((error) => {
                console.log('getSubmissionStats error: ', error);
            });
    }

    vote = () => {
        SeedInputModal.show({
            onVote: this.onVote,
            address: this.state.submission,
        });
        SeedInputModal.focus();
    }

    renderStat = (doc, rank) => {
        let valueColor = null;
        if (doc.text === 'Passed' || doc.text === 'Accepted') valueColor = UIColor.success();
        if (doc.text === 'Not passed' || doc.text === 'Rejected') valueColor = UIColor.error();
        if (doc.text === 'Abstained') valueColor = '#5E6E77';
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

    renderJurorInfo = (doc, rank) => {
        let valueColor = null;
        if (doc.rate === 'Reject') valueColor = UIColor.error();
        if (doc.rate === 'Abstain') valueColor = '#5E6E77';

        // 0:67f92fc ···· 36abbcfa3
        const addrStart = doc.juryAddress.substr(0, 9);
        const addrEnd = doc.juryAddress.substr(doc.juryAddress.length - 9, 9);
        const addr = `${addrStart} ···· ${addrEnd}`;

        return (
            <View>
                <View key={`stat-${rank}`} style={[UIStyle.common.flexRow(), UIStyle.common.justifySpaceBetween(), UIStyle.common.alignCenter()]}>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing]}>
                        {addr}
                    </Text>
                    <Text style={[
                        UIStyle.text.secondaryBodyBold(),
                        styles.noLetterSpacing,
                        valueColor ? { color: valueColor } : null]}
                    >
                        {!isNaN(doc.rate) ? `${doc.rate} pts` : doc.rate}
                    </Text>
                </View>
                <Text style={[UIStyle.margin.topTiny(), UIStyle.text.secondaryCaptionRegular(), styles.noLetterSpacing]}>
                    {doc.comment}
                </Text>
            </View>
        );
    }

    renderBottomButton() {
        if (
            this.state.proposal.contestStatus !== 'Voting' ||
            contestsOld.includes(this.state.proposal.contestAddress)
        ) return <View style={{ marginBottom: 128 }} />;
        return (
            <UIButton
                style={[
                    UIStyle.common.alignSelfCenter(),
                    UIStyle.width.half(),
                    UIStyle.margin.bottomHuge(),
                    UIStyle.margin.topSpacious(),
                ]}
                buttonShape={UIButton.ButtonShape.Rounded}
                title={TONLocalized.Contests.CastYourVote || 'Cast your vote'}
                onPress={this.vote}
            />
        );
    }

    renderDetails() {
        const subm = this.state.submission;
        return (
            <View>
                {!!subm.contactAddress && subm.contactAddress !== '0:0000000000000000000000000000000000000000000000000000000000000000' &&
                <TouchableOpacity onPress={() => this.copyData(subm.contactAddress)}>
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                            {TONLocalized.Contests.Contact || 'Contact'}
                        </Text>
                        <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                            {subm.contactAddress}
                        </Text>
                    </View>
                </TouchableOpacity>
                }
                <TouchableOpacity onPress={() => this.copyData(subm.participantAddress)}>
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                            {TONLocalized.Contests.AutorAddress || 'Author address'}
                        </Text>
                        <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                            {subm.participantAddress}
                        </Text>
                    </View>
                </TouchableOpacity>
                {!!subm.submissionAddress &&
                <TouchableOpacity onPress={() => this.copyData(subm.submissionAddress)}>
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                            {TONLocalized.Contests.SubmissionAddress || 'Submission address'}
                        </Text>
                        <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                            {subm.submissionAddress}
                        </Text>
                    </View>
                </TouchableOpacity>
                }
            </View>
        );
    }

    renderCenterColumn() {
        const subm = this.state.submission;
        return (
            <View>
                <Text style={[UIStyle.text.primaryTitleBold(), styles.noLetterSpacing, UIStyle.margin.topVast()]}>
                    {subm.title}
                </Text>
                <View style={UIStyle.margin.topHuge()}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                        {TONLocalized.Contests.SubmissionDate || 'Submission date'}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                        {this.getCreatedAtStr()}
                    </Text>
                </View>

                <View style={UIStyle.margin.topHuge()}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                        {TONLocalized.Contests.Contest || 'Contest'}
                    </Text>
                    <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                        {this.state.proposal.title}
                    </Text>
                </View>

                <View style={UIStyle.margin.topHuge()}>
                    <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                        {TONLocalized.Contests.Status || 'Status'}
                    </Text>
                    <ProposalStatus
                        contest
                        proposal={this.state.proposal}
                        statusTextStyle={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing]}
                        dateTextStyle={[UIStyle.text.tertiaryBodyRegular(), styles.noLetterSpacing]}
                    />
                </View>

                {this.state.proposal.contestStatus !== 'Underway' &&
                <TouchableOpacity onPress={() => window.open(subm.fileLink, '_blank')}>
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                            {TONLocalized.Contests.Description || 'Description'}
                        </Text>
                        <Text style={[UIStyle.text.bodyRegular(), { color: UIColor.primary() }, styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                            {`${subm.title.replace(' ', '-')}.pdf`}
                        </Text>
                    </View>
                </TouchableOpacity>}

                <TouchableOpacity onPress={() => window.open(
                    subm.discussionLink.startsWith('https') ? `${subm.discussionLink}` : `https://${subm.discussionLink}`,
                    '_blank',
                )}
                >
                    <View style={UIStyle.margin.topHuge()}>
                        <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                            {TONLocalized.Contests.Discussion || 'Discussion'}
                        </Text>
                        <Text style={[UIStyle.text.bodyRegular(), { color: UIColor.primary() }, styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                            {'Discuss on forum'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <UIUnfold
                    content={this.renderDetails()}
                    buttonPosition={UIUnfold.position.bottom}
                    titleHide="Hide details"
                    titleShow="Show details"
                    unfolded={this.state.unfolded}
                    onPress={unfolded => this.setStateSafely({ unfolded })}
                    showButton={false}
                />
                {(this.state.proposal.contestStatus === 'Voting' ||
                this.state.proposal.contestStatus === 'Ended') &&
                <React.Fragment>
                    <UISeparator color={UIColor.whiteLight()} style={[UIStyle.margin.topGreat()]} />
                    <Text style={[UIStyle.text.primarySubtitleBold(), styles.noLetterSpacing, UIStyle.margin.topGreat()]}>
                        {TONLocalized.Contests.VotingStatistics || 'Voting Statistics'}
                    </Text>
                    <Table
                        style={UIStyle.margin.topDefault()}
                        items={[
                            { text: 'Total points', value: subm.totalRating },
                            { text: 'Avg. points', value: subm.ave.toFixed(2) },
                            { text: 'Jurors voted', value: subm.jurorsVoted },
                            { text: 'Accepted', value: subm.accepted },
                            { text: 'Abstained', value: subm.abstained },
                            { text: 'Rejected', value: subm.rejected },
                        ].map(this.renderStat)}
                    />
                </React.Fragment>
                }
                {(subm.jurorsStats && subm.jurorsStats.length > 0) &&
                <React.Fragment>
                    <UISeparator color={UIColor.whiteLight()} style={[UIStyle.margin.topHuge()]} />
                    <Text style={[UIStyle.text.primarySubtitleBold(), styles.noLetterSpacing, UIStyle.margin.topGreat()]}>
                        {TONLocalized.Contests.PointsPerJuror || 'Points per Juror'}
                    </Text>
                    <Table
                        style={UIStyle.margin.topDefault()}
                        items={subm.jurorsStats.map(this.renderJurorInfo)}
                    />
                </React.Fragment>}
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

export default connect(mapStateToProps)(ManifestSubmissionScreen);
