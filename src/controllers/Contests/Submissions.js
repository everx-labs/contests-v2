import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

import {
    UIStyle,
    UIComponent,
    UILocalized,
    UILink,
    UIColor,
    UIButton,
    UIButtonGroup,
    UISeparator,
} from '../../services/UIKit/UIKit';

import TONLocalized from '../../helpers/TONLocalized';
import Table from '../../components/Table';
import SubmissionsFunctions from './SubmissionsFunctions';
import triangle from '../../assets/24.png';

const styles = StyleSheet.create({
    noLetterSpacing: { letterSpacing: 0 },
});

export default class Submissions extends UIComponent {
    constructor(props) {
        super(props);
        this.state = {
            submissions: [],
            ready: false,
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.updateSubmissionsList();
    }

    updateSubmissionsList() {
        this.setStateSafely({ ready: false });
        let submissions = [];
        SubmissionsFunctions.getContestSubmissions(this.props.proposal)
            .then((submissionsWithStats) => {
                submissions = submissionsWithStats;
                submissions = submissions.reverse();
                // console.log('submissionsWithStats: ', submissionsWithStats);
            })
            .catch((error) => {
                console.log('getContestSubmissions error: ', error);
            })
            .finally(() => {
                this.setStateSafely({ submissions, ready: true });
            });
    }

    isLoading() {
        return (!this.state.ready);
    }

    getCreatedAtStr(subm) {
        const createdAtDate = subm.createdAt;// .toDate();
        const createdAtDayStr = createdAtDate.toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' },
        );

        // it gives 24hour format with no seconds
        const createdAtTimeStr = createdAtDate.toLocaleTimeString(
            'en-GB',
            { hour: '2-digit', minute: '2-digit', second: '2-digit' },
        );

        const createdAtStr = `${createdAtTimeStr} • ${createdAtDayStr}`;
        return createdAtStr;
    }

    renderSubmission = (doc, rank) => {
        const MAX_TITLE_LENGTH = 60;
        const createdAtStr = this.getCreatedAtStr(doc);
        const shortParticipantAddress = doc.participantAddress.substr(0, 6);
        return (
            <React.Fragment>
                <TouchableOpacity
                    onPress={() =>
                        window.open &&
                        window.open(`submission?proposalAddress=${this.props.proposal.proposalWalletAddress}&submissionId=${doc.submissionId}`, '_blank')
                    }
                >
                    <View style={this.props.isNarrow ? null : [
                        UIStyle.common.justifySpaceBetween(),
                        UIStyle.common.flexRow(),
                        UIStyle.common.flex(),
                        UIStyle.margin.topMedium(),
                    ]}
                    >
                        <View>
                            <Text style={[UIStyle.text.primaryBodyMedium(), styles.noLetterSpacing]}>
                                {doc.title}
                            </Text>
                            <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                                {`${shortParticipantAddress} • ${createdAtStr}`}
                            </Text>
                        </View>
                        {(this.props.proposal.contestStatus === 'Voting' || this.props.proposal.contestStatus === 'Ended') ?
                            <View>
                                <Text style={[UIStyle.text.secondaryBodyRegular(), styles.noLetterSpacing]}>
                                    {`Avg. ${doc.ave.toFixed(2) || 0} pts`}
                                </Text>
                                <Text style={[UIStyle.text.secondaryCaptionRegular(), UIStyle.margin.topTiny(), styles.noLetterSpacing]}>
                                    {`${doc.jurorsVoted || 0} votes`}
                                </Text>
                            </View> :
                            null/* (
                            <UILink
                                title="Description"
                                href={doc.fileLink}
                                target="_blank"
                                style={{ paddingLeft: 0 }}
                                textAlign={UILink.TextAlign.Left}
                            />) */
                        }
                    </View>
                </TouchableOpacity>
            </React.Fragment>
        );
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

    renderStats() {
        if (this.props.proposal.contestStatus !== 'Voting' &&
            this.props.proposal.contestStatus !== 'Ended') { return null; }

        return (
            <View>
                <UISeparator color={UIColor.whiteLight()} style={[UIStyle.margin.topSpacious()]} />
                <Text style={[UIStyle.text.primarySubtitleBold(), styles.noLetterSpacing, UIStyle.margin.topGreat()]}>
                    {'Contest Voting Statistics'}
                </Text>
                <Table
                    style={UIStyle.margin.topDefault()}
                    items={[
                        { text: 'Total points awarded', value: this.props.proposal.totalScore },
                        { text: 'Total votes', value: this.props.proposal.jurorsVoted },
                        { text: 'Avg. score', value: this.props.proposal.ave?.toFixed(2) },
                    ].map(this.renderStat)}
                />
                <UILink
                    title="See details"
                    textAlign={UILink.TextAlign.Left}
                    style={{ paddingLeft: 0 }}
                    onPress={() => this.props.navigation.push('ManifestStatsScreen', { proposalAddress: this.props.proposal.proposalWalletAddress, stats: true })}
                />
            </View>
        );
    }


    render() {
        if (!this.state.ready) {
            return (<UILink
                showIndicator
                indicatorAnimation={UILink.Indicator.Round}
                iconIndicator={triangle}
            />);
        }

        if (!this.state.submissions || !this.state.submissions.length) return null;

        return (
            <View>
                {this.renderStats()}
                <UISeparator color={UIColor.whiteLight()} style={[UIStyle.margin.topGreat()]} />
                <Text style={[UIStyle.text.primarySubtitleBold(), styles.noLetterSpacing, UIStyle.margin.topGreat()]}>
                    {'Submissions'}
                </Text>
                <Table style={UIStyle.margin.topDefault()} items={this.state.submissions.map(this.renderSubmission)} />
            </View>
        );
    }
}
