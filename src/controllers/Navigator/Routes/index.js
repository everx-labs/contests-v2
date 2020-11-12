// @flow
import { UINavigator } from '../../../services/UIKit';

import ErrorScreen from '../../ErrorScreen';

import NewProposalScreen from '../../Contests/NewProposalScreen';
import NewSubmissionScreen from '../../Contests/NewSubmissionScreen';
import ProposalsScreen from '../../Contests/ProposalsScreen';
import ProposalScreen from '../../Contests/ProposalScreen';
import SubmissionScreen from '../../Contests/SubmissionScreen';

import configs from '../../../configs';

const error = {
    name: 'ErrorScreen',
    screen: ErrorScreen,
    path: '404',
};

export default class Routes {
    static routing = UINavigator.createRouting([
        {
            name: 'NewProposalScreen',
            screen: NewProposalScreen,
            path: 'create-proposal',
        },
        {
            name: 'NewSubmissionScreen',
            screen: NewSubmissionScreen,
            path: 'create-submission',
            dynamicParameters: {
                proposalAddress: true,
            },
        },
        {
            name: 'ProposalScreen',
            screen: ProposalScreen,
            path: 'proposal',
            dynamicParameters: {
                proposalAddress: true,
            },
        },
        {
            name: 'SubmissionScreen',
            screen: SubmissionScreen,
            path: 'submission',
            dynamicParameters: {
                proposalAddress: true,
                submissionId: true,
            },
        },
        {
            name: 'ManifestStatsScreen',
            screen: ProposalScreen,
            path: 'contest-stats',
            dynamicParameters: {
                proposalAddress: true,
                stats: true,
            },
        },
        {
            name: 'ContestsScreen',
            screen: ProposalsScreen,
            path: 'main',
        },
        error,
    ]);

    static errorScreen() {
        return 'ErrorScreen';
    }

    static defaultScreen() {
        return 'ContestsScreen';
    }
}
