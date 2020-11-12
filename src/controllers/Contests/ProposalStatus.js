import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';

import {
    UIStyle,
    UIComponent,
    UIColor,
    UIButtonGroup,
} from '../../services/UIKit/UIKit';

import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';

const styles = StyleSheet.create({
    noLetterSpacing: { letterSpacing: 0 },
});

function localDateToUTC(localDate) {
    return new Date(
        localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(),
        localDate.getUTCHours(), localDate.getUTCMinutes(), localDate.getUTCSeconds(),
    );
}

export default class ProposalStatus extends UIComponent {
    static getContestDateString(proposal) {
        try {
            if (!proposal.dateStart || !proposal.dateEnd) return 'Unknown';

            const isUnderway = proposal.contestStatus === 'Underway';
            const params = { month: 'long', day: 'numeric' };

            const dateStart = localDateToUTC(proposal.dateStart);
            const dateEnd = localDateToUTC(proposal.dateEnd);

            // console.log('proposal.dateEnd:', proposal.dateEnd);
            // console.log('UTC dateEnd:', dateEnd);

            // console.log(`for ${proposal.title} proposal.dateStart, proposal.dateEnd`, proposal.dateStart, proposal.dateEnd);
            const startedAtStr = dateStart.toLocaleDateString('en-US', params);
            const endedAtStr = dateEnd.toLocaleDateString('en-US', params);
            const yearStr = dateEnd.toLocaleDateString('en-US', { year: 'numeric' });
            const dateStr = true/* isUnderway */ ?
                `${startedAtStr} - ${endedAtStr}, ${yearStr}, ${ProposalStatus.getLocalTimePart(dateEnd)} UTC` :
                `${startedAtStr} - ${endedAtStr}, ${yearStr} UTC`;
            return dateStr;
        } catch (err) {
            // console.log(err);
            return 'Unknown';
        }
    }

    static getLocalTimePart(date) {
        return date.toLocaleTimeString(
            'en-GB',
            { hour: '2-digit', minute: '2-digit' },
        );
    }

    static getCreatedAtDateString(proposal) {
        const createdAtDate = proposal.createdAt.toDate();
        const createdAtStr = createdAtDate.toLocaleDateString(
            'en-US',
            { year: 'numeric', month: 'long', day: 'numeric' },
        );
        return `${TONLocalized.Contests.Created} ${createdAtStr}, ${ProposalStatus.getLocalTimePart(createdAtDate)}`;
    }

    constructor(props) {
        super(props);
        this.state = {
            left: '',
        };
        this.timerId = null;
    }

    runTimer() {
        if (
            this.props.proposal.status === 'Voting' ||
            this.props.proposal.contestStatus === 'Underway' ||
            this.props.proposal.contestStatus === 'Voting' ||
            this.props.proposal.contestStatus === 'Upcoming'
        ) {
            if (!this.timerId) {
                this.onTimer();
                this.timerId = setInterval(() => this.onTimer(), 1000);
            }
        }
    }

    componentDidMount() {
        super.componentDidMount();
        this.runTimer();
    }

    componentDidUpdate() {
        this.runTimer();
    }

    onTimer = () => {
        const proposal = this.props.proposal;
        let dateEnd = null;
        if (proposal.status === 'Voting') {
            dateEnd = new Date(proposal.votingStarted);
            dateEnd.setDate(dateEnd.getDate() + 1);
        } else if (proposal.contestStatus === 'Underway') {
            dateEnd = proposal.dateEnd;
        } else if (proposal.contestStatus === 'Voting') {
            dateEnd = proposal.dateVotingEnd;
        } else if (proposal.contestStatus === 'Upcoming') {
            dateEnd = proposal.dateStart;
        }

        if (!dateEnd) return;

        const diffMs = dateEnd.getTime() - Date.now();
        if (diffMs < 0) {
            // this.props.onTimerOut && this.props.onTimerOut();
            return;
        }

        const diffSec = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSec / 60 / 60);
        let days = 0;
        if (hours > 24) days = Math.floor(hours / 24);
        const minutes = Math.floor(diffSec / 60) - hours * 60;
        const seconds = diffSec - minutes * 60 - hours * 60 * 60;
        const leftTime = `${hours > 9 ? hours : `0${hours}`}:${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`;
        const isUpcoming = proposal.contestStatus === 'Upcoming';
        const leftStr = days ? (!isUpcoming ? `${days} days left` : `in ${days} days`) :
            (!isUpcoming ? `${leftTime} left` : `in ${leftTime}`);
        this.setStateSafely({ left: leftStr });
    }

    componentWillUnmount() {
        clearInterval(this.timerId);
    }

    getStringStatus(status) {
        if (status === 'Review') return TONLocalized.Contests.Review;
        return status;
    }

    renderContestStatus() {
        const contestStatus = this.props.proposal.contestStatus;
        if (!contestStatus) return null;

        const color = contestStatus === 'Underway' ? UIColor.success() :
            contestStatus === 'Ended' ? UIColor.black() :
                contestStatus === 'Voting' ? UIColor.primary() :
                    '#5E6E77'; // 'Upcoming'

        return (
            <Text style={[
                UIStyle.text.smallMedium(),
                styles.noLetterSpacing,
                { color },
                this.props.statusTextStyle,
            ]}
            >
                {contestStatus}
            </Text>
        );
    }

    renderStatus() {
        const proposal = this.props.proposal;
        if (this.props.contest) return this.renderContestStatus();
        let color = UIColor.blackLight();
        if (proposal.status === 'Voting') {
            color = UIColor.black();
        }
        if (proposal.status === 'Passed') {
            color = UIColor.success();
        }
        if (proposal.status === 'Rejected') {
            color = UIColor.error();
        }
        return (<Text style={[UIStyle.text.smallMedium(), styles.noLetterSpacing, { color }, this.props.statusTextStyle]}>
            {proposal.status === 'Rejected' ? 'Not passed' : this.getStringStatus(proposal.status)}
                </Text>);
    }

    renderContestDateString() {
        const proposal = this.props.proposal;
        // timer
        if (proposal.contestStatus === 'Underway' || proposal.contestStatus === 'Voting' || proposal.contestStatus === 'Upcoming') {
            return this.state.left;
        }
        // Ended
        return proposal.aveScore ? `Avg. ${proposal.aveScore} score` : '';
    }

    renderDateString() {
        const proposal = this.props.proposal;
        if (this.props.contest) return this.renderContestDateString();
        // timer
        if (proposal.status === 'Voting') {
            return this.state.left;
        }
        if (proposal.status === 'Review' || proposal.status === 'Passed' || proposal.status === 'Rejected') {
            return ProposalStatus.getCreatedAtDateString(proposal);
        }
    }

    render() {
        const proposal = this.props.proposal;
        return (
            <UIButtonGroup style={this.props.style} gutter={this.props.separator ? 0 : 8}>
                {this.renderStatus()}
                <Text style={[UIStyle.text.tertiarySmallRegular(), styles.noLetterSpacing, this.props.dateTextStyle]}>
                    {
                        this.props.separator ?
                            ` ${this.props.separator} ${this.renderDateString()}` :
                            this.renderDateString()
                    }
                </Text>
            </UIButtonGroup>
        );
    }
}
