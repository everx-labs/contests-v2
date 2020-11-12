import { TONAddressStringVariant } from 'ton-client-js/src/modules/TONContractsModule';
import { TONKeystore, TONTokensWallet } from '../../helpers/TONWallet';

import FBInfoRequests from '../../services/Firebase/FBInfoRequests';
import Configs from '../../configs';
import ContestPackageAbi from './Contest.abi.json';
import SubmissionPackageAbi from './Submission.abi.json';
import EnvManager from './helpers/EnvManager';

const mltsgPackage = require('./SafeMultisigWallet.js');

// 0:1234567890123456789012345678901234567890123456789012345678901234

const PROPOSALS_TABLE = EnvManager.getProposalsTable();
const FREETON_PROPOSALS_TABLE = EnvManager.getProposalsTable('freeton');
const SUBMISSIONS_TABLE = Configs.isContestsTest() ? FBInfoRequests.SUBMISSIONS_TEST : FBInfoRequests.SUBMISSIONS;
const ERRORS_TABLE = FBInfoRequests.ERRORS;

const contestsOld = [
    '0:9065c4e843ac40324e8760586078ad351dcf653b200b3d1ae15d5f7f4ed427a6', // 'Airdrop Mechanics 1',
    '0:af5ed7c0973f357765c431fb201499f3187900bf67852e41d80d54704497d3ce', // 'Developers Contest: Soft Majority Voting system',
    '0:f3e2a2931f9145edaec74c8025910a254977dd95775d2596e27873515e41d3e0', // 'Validator Contest: Devops tools',
    '0:1f61b57e69298f23cdeea203bc704f189912f0b40eb658cd2a9351cd29c36b95', // 'Decentralized Support I -- Present Supporters',
    '0:28134d2ab5a4c24368c269cf254e45335225c3d236f52496178f77cb5719f955', // 'Decentralized Promotion',
    '0:4fcf06a199a9e14127a12cfe2423cb8010a4f82dc0bd6fe18f4846da6aae29b8', // 'Idea Management System Contest',
];

const exit_codes_contest = {
    101: 'Not authorized to administer contest',
    102: 'Message requires a jury member signature',
    103: 'This juror has exceeded maximum voting attempts for the entry',
    104: 'Entry not found',
    105: 'Contest does not accept entries at this time',
    106: 'Votes are not accepted at this time',
    107: 'Assessment with this ID does not exist',
    111: 'Can be called only by the contract itself',
    112: 'Contender ID must be 1 or more',
    113: 'Contender ID exceeds total count of applicants',
    114: 'Final results are not available at this time',
};

const exit_codes_proposal = {
    100: 'message sender is not a custodian',
    102: 'transaction does not exist',
    103: 'operation is already confirmed by this custodian',
    107: 'input value is too low',
    108: 'wallet should have only one custodian',
    113: 'Too many requests for one custodian',
    117: 'invalid number of custodians',
    121: 'payload size is too big',
};

function convertError(error, contractType = 'contest') {
    const exit_codes = contractType === 'contest' ? exit_codes_contest : exit_codes_proposal;
    let resultError = error;
    if (error.code == 3025 && error.data && error.data.exit_code) {
        resultError = new Error(`Failed: ${exit_codes[error.data.exit_code]} (${error.data.exit_code})`);
    } else {
        const message = error.message.length > 64 ? `${error.message.substr(0, 64)}...` : error.message;
        resultError = new Error(`Failed: ${message} ${error.code ? `(${error.code})` : ''}`);
    }
    return resultError;
}

const getList = (snapshot, table) => {
    const list = [];
    snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.ref.id, table });
    });
    return list;
};

function getSubmissionData(contestAddress, subm, functionName) {
    return window.TONClient.contracts.runLocal({
        address: contestAddress,
        abi: ContestPackageAbi,
        functionName,
        input: { id: subm.submissionId },
        keyPair: null,
    }).catch((error) => {
        console.log(`${functionName} failed: `, error);
        throw error;
    });
}

function getProposalCustodians(judgeWalletAddress) {
    return window.TONClient.contracts.runLocal({
        address: judgeWalletAddress,
        abi: mltsgPackage.abi,
        functionName: 'getCustodians',
        input: {},
        keyPair: null,
    });
}

function getJuryKeys(contestAddress) {
    return window.TONClient.contracts.runLocal({
        address: contestAddress,
        abi: ContestPackageAbi,
        functionName: 'getContestInfo',
        input: {},
        keyPair: null,
    }).then((result) => {
        return result.output.juryKeys;
    });
}

function getContractSubmissions(contestAddress) {
    return window.TONClient.contracts.runLocal({
        address: contestAddress,
        abi: ContestPackageAbi,
        functionName: 'getContendersInfo',
        input: { },
        keyPair: null,
    }).then((result) => {
        return result.output;
    }).catch((error) => {
        console.log('ERROR getContractSubmissions: ', error);
        return { ids: [] };
    });
}

function submitSubmission(contestAddress, participant, forumLink, fileLink, hash, contact) {
    const input = {
        participant,
        forumLink: Buffer.from(forumLink).toString('hex'),
        fileLink: Buffer.from(fileLink).toString('hex'),
        hash,
    };

    if (contact) { input.contact = contact; }

    return window.TONClient.contracts.run({
        address: contestAddress,
        abi: ContestPackageAbi,
        functionName: contact ? 'submitWithContact' : 'submit',
        input,
        keyPair: null,
    }).then((resultSuccess) => {
        // console.log('submitSubmission, resultSuccess: ', resultSuccess);
        const exit_code = resultSuccess.transaction.compute.exit_code;
        if (exit_code !== 0) {
            throw { code: 3025, data: { exit_code } };
        }
    }).catch((error) => {
        throw convertError(error);
    });
}

function getOldVote(subm) {
    return Promise.all([
        window.TONClient.contracts.runLocal({
            address: subm.submissionAddress,
            abi: SubmissionPackageAbi,
            functionName: 'getTotalRating',
            input: { },
        }),
        window.TONClient.contracts.runLocal({
            address: subm.submissionAddress,
            abi: SubmissionPackageAbi,
            functionName: 'getVotes',
            input: { },
        }),
    ]).then(([totalResult, votesResult]) => {
        subm.totalRating = totalResult ? parseInt(totalResult?.output?.rating, 16) : 0;
        subm.jurorsVoted = votesResult ? parseInt(votesResult?.output?.votes, 16) : 0;
        if (subm.jurorsVoted) {
            subm.ave = (subm.totalRating / subm.jurorsVoted);
        }
    }).catch((err) => {
        console.log('getOldVote error', err);
    }).then(() => {
        return subm;
    });
}

function getSubmissionStats(contest, subm) {
    const contestAddress = contest.contestAddress;

    subm.totalRating = 0;
    subm.jurorsVoted = 0;
    subm.ave = 0;
    subm.accepted = 0;
    subm.abstained = 0;
    subm.rejected = 0;
    subm.isFinalized = contest.isFinalized;
    subm.juryKeys = contest.juryKeys;

    if (!contestAddress) return new Promise(resolve => resolve(subm));

    return Promise.all([
        getSubmissionData(contestAddress, subm, contest.isFinalized ? 'getFinalStatsFor' : 'getStatsFor').then((result) => {
            // console.log('getFinalStatsFor/getStatsFor OK', result);
            subm.totalRating = parseInt(result?.output?.totalPoints, 16);
            subm.ave = (parseInt(result?.output?.avgHi, 16) * 100 + parseInt(result?.output?.avgLo, 16)) / 100.0;
            subm.jurorsVoted = parseInt(result?.output?.jurorsVoted, 16);
            subm.accepted = parseInt(result?.output?.accepted, 16);
            subm.abstained = parseInt(result?.output?.abstained, 16);
            subm.rejected = parseInt(result?.output?.rejected, 16);
            subm.passed = result?.output?.status;
        }),
        getSubmissionData(contestAddress, subm, 'getVotesPerJuror').then((result) => {
            // console.log('getVotesPerJuror OK', result);
            subm.jurorsStats = [];
            result.output.jurorsFor.forEach((jur, rank) => {
                subm.jurorsStats.push({
                    juryAddress: jur, // parseInt(jur, 16),
                    rate: parseInt(result.output.marks[rank], 16),
                    comment: Buffer.from(result.output.commentsFor[rank], 'hex').toString(),
                });
            });
            result.output.jurorsAbstained.forEach((jur, rank) => {
                subm.jurorsStats.push({
                    juryAddress: jur, // parseInt(jur, 16),
                    rate: 'Abstain',
                    comment: Buffer.from(result.output.commentsAbstained[rank], 'hex').toString(),
                });
            });
            result.output.jurorsAgainst.forEach((jur, rank) => {
                subm.jurorsStats.push({
                    juryAddress: jur, // parseInt(jur, 16),
                    rate: 'Reject',
                    comment: Buffer.from(result.output.commentsAgainst[rank], 'hex').toString(),
                });
            });
        }),
    ])
        .catch((err) => {
            console.log('getSubmissionStats error', err);
        })
        .then(() => {
            // console.log('getSubmissionStats OK', subm);
            return subm;
        });
}

function getOldSubmissions(proposalAddress, withStats = true) {
    return FBInfoRequests.getCollection(SUBMISSIONS_TABLE)
        .where('contestAddress', '==', proposalAddress)
        .orderBy('createdAt', 'asc')
        .get()
        .then((snapshot) => {
            const submissions = getList(snapshot);
            submissions.forEach((subm, rank) => {
                subm.title = `Submission ${rank + 1}`;
                subm.submissionId = rank + 1;
                subm.createdAt = subm.createdAt.toDate();
                subm.submissionsCount = submissions.length;
            });
            return withStats ? Promise.all(submissions.map(subm => getOldVote(subm))) : submissions;
        });
}

function getContestSubmissions(contest, submissionId = '', withStats = true) {
    const proposalAddress = contest.proposalWalletAddress;
    const contestAddress = contest.contestAddress;
    let submissions = [];
    if (!contestAddress) return new Promise(resolve => resolve([]));
    if (contestsOld.includes(contestAddress)) {
        return getOldSubmissions(proposalAddress, withStats).then((oldSubmissions) => {
            submissions = oldSubmissions;
            // console.log('oldSubmissions: ', submissions);
            if (submissionId) submissions = submissions.filter(subm => subm.submissionId === parseInt(submissionId));
            return submissions;
        }).catch((error) => {
            console.log('getOldSubmissions error: ', error);
            return [];
        });
    }
    return getContractSubmissions(contestAddress)
        .then((contractSubmissions) => {
            // console.log('getContestSubmissions contractSubmissions: ', contractSubmissions);
            contractSubmissions.ids.forEach((id, rank) => {
                const createdAtTimestamp = parseInt(contractSubmissions.appliedAts[rank].substr(0, 10), 16);
                const createdAtDate = new Date(createdAtTimestamp * 1000);
                submissions.push({
                    submissionId: parseInt(id, 16),
                    title: `Submission ${parseInt(id, 16)}`,
                    participantAddress: contractSubmissions.addrs[rank],
                    discussionLink: Buffer.from(contractSubmissions.forumLinks[rank], 'hex').toString(),
                    fileLink: Buffer.from(contractSubmissions.fileLinks[rank], 'hex').toString(),
                    hash: contractSubmissions.hashes[rank],
                    createdAt: createdAtDate,
                    contactAddress: contractSubmissions.contacts[rank],
                    submissionsCount: contractSubmissions.ids.length,
                });
            });
            if (submissionId) submissions = submissions.filter(subm => subm.submissionId === parseInt(submissionId));
            // console.log(`submissions filtered by ${submissionId}`, submissions);
            return withStats ?
                Promise.all(submissions.map(subm => this.getSubmissionStats(contest, subm))) :
                submissions;
        })
        .then((submissionsReady) => {
            if (withStats) {
                const weightBase = (submissionsReady.length * contest.juryKeys.length);
                const jurorsMap = new Map();
                submissionsReady.forEach((subm) => {
                    subm.jurorsStats && subm.jurorsStats.length && subm.jurorsStats.forEach((jur) => {
                        const juryAddress = jur.juryAddress;
                        const pointsAwarded = isNaN(jur.rate) ? 0 : jur.rate;
                        const item = jurorsMap.get(juryAddress);
                        if (!item) {
                            jurorsMap.set(juryAddress, {
                                juryAddress,
                                submissionVotes: 1,
                                pointsAwarded,
                                weight: 1 * 100.0 / weightBase,
                            });
                        } else {
                            jurorsMap.set(juryAddress, {
                                juryAddress,
                                submissionVotes: item.submissionVotes + 1,
                                pointsAwarded: item.pointsAwarded + pointsAwarded,
                                weight: (item.submissionVotes + 1) * 100.0 / weightBase,
                            });
                        }
                    });
                });
                contest.jurorsStats = [];
                jurorsMap.forEach((value, key) => {
                    contest.jurorsStats.push(value);
                });
            }
            return submissionsReady;
        })
        .catch((error) => {
            console.log('getContestSubmissions error: ', error);
            return [];
        });
}

function getContestData(contestAddress, functionName) {
    return window.TONClient.contracts.runLocal({
        address: contestAddress,
        abi: ContestPackageAbi,
        functionName,
        input: {},
        keyPair: null,
    });
}

function queryBalance(address, cb = null) {
    const filter = {
        id: { eq: address },
    };
    let balance = null;
    return window.TONClient.queries.accounts.query(filter, 'id balance')
        .then((balanceResult) => {
            if (balanceResult.length && balanceResult[0] && balanceResult[0].balance) {
                balance = parseInt(balanceResult[0].balance, 16);
                balance /= 1000000000;
            }
        })
        .catch(() => {
            console.log('accounts.query balance error');
        })
        .finally(() => {
            if (cb) cb(balance);
            return balance;
        });
}

function getContest(proposal) {
    // console.log(`getContest for ${proposal.title} ${proposal.contestAddress}`);
    if (
        !proposal.status === 'Passed' ||
        !proposal.contestAddress
    ) { return proposal; }

    const isOld = contestsOld.includes(proposal.contestAddress);
    const old = new Promise(resolve => resolve());

    const filter = {
        id: { eq: proposal.contestAddress },
    };

    return Promise.all([
        isOld ? old : getJuryKeys(proposal.contestAddress).then((juryKeys) => {
            proposal.juryKeys = juryKeys;
        }).catch((error) => {
            console.log('juryKeys failed', error);
        }),
        isOld ? old : getContestData(proposal.contestAddress, 'contestStartCountdown').then((result) => {
            // console.log(`contestStartCountdown: ${result.output.secondsLeft}`);
            proposal.contestStartCountdown = parseInt(result.output.secondsLeft, 16);
        }).catch((error) => {
            console.log('contestStartCountdown failed', error);
        }),
        isOld ? old : getContestData(proposal.contestAddress, 'contestCountdown').then((result) => {
            // console.log(`contestCountdown: ${result.output.secondsLeft}`);
            proposal.contestCountdown = parseInt(result.output.secondsLeft, 16);
        }).catch((error) => {
            console.log('contestCountdown failed', error);
        }),
        isOld ? old : getContestData(proposal.contestAddress, 'votingCountdown').then((result) => {
            // console.log(`votingCountdown: ${result.output.secondsLeft}`);
            proposal.votingCountdown = parseInt(result.output.secondsLeft, 16);
        }).catch((error) => {
            console.log('votingCountdown failed', error);
        }),
        isOld ? old : window.TONClient.queries.accounts.query(filter, 'id balance')
            .then((balanceResult) => {
                if (balanceResult.length && balanceResult[0] && balanceResult[0].balance) {
                    proposal.contestBalance = parseInt(balanceResult[0].balance, 16);
                    proposal.contestBalance /= 1000000000;
                }
            })
            .catch(() => { console.log('accounts.query balance error'); }),
    ]).then(() => {
        const now = Date.now();
        if (proposal.dateStart) { // in DB string is set
            proposal.dateStart = new Date(proposal.dateStart);
        } else {
            proposal.dateStart = new Date(now + proposal.contestStartCountdown * 1000);
        }
        if (proposal.dateEnd) { // in DB string is set
            proposal.dateEnd = new Date(proposal.dateEnd);
        } else {
            proposal.dateEnd = new Date(now + proposal.contestCountdown * 1000);
        }
        proposal.dateVotingEnd = new Date(now + proposal.votingCountdown * 1000);
        if (proposal.contestStartCountdown > 0) {
            proposal.contestStatus = 'Upcoming';
        } else if (proposal.contestCountdown > 0) {
            proposal.contestStatus = 'Underway';
        } else if (proposal.votingCountdown > 0) {
            proposal.contestStatus = 'Voting';
        } else {
            proposal.contestStatus = 'Ended';
        }
    })
        .then(() => {
            if (proposal.contestStatus !== 'Voting' && proposal.contestStatus !== 'Ended') { return null; }
            return isOld ? null : getContestData(proposal.contestAddress, 'resultsFinalized');
        })
        .then((result) => {
            if (!result) return null;
            // console.log('resultsFinalized result', result);
            proposal.isFinalized = result.output.flag;
            return getContestData(
                proposal.contestAddress,
                proposal.isFinalized ? 'getFinalContestStats' : 'getContestStats',
            );
        })
        .then((result) => {
            if (!result) return null;
            // console.log('getContestStats/getFinalContestStats result', result);
            const data = result?.output || null;
            proposal.totalScore = data ? parseInt(data.totalScore, 16) : 0;
            proposal.jurorsVoted = data ? parseInt(data.jurorsVoted, 16) : 0;
            proposal.entriesCount = data ? parseInt(data.entries, 16) : 0;
            proposal.passed = data && data.passed ? parseInt(data.passed, 16) : 0;
            proposal.rejected = data && data.rejected ? parseInt(data.rejected, 16) : 0;
            proposal.ave = data ? (parseInt(data.avgHi, 16) * 100 + parseInt(data.avgLo, 16)) / 100.0 : 0;
        })
        .catch((error) => {
            console.log('getContest error:', error);
        })
        .then(() => {
            return proposal;
        });
}

function getProposals(proposalAddresses = [], isGlobal = false, withStats = true) {
    return FBInfoRequests.getCollection(isGlobal ? FREETON_PROPOSALS_TABLE : PROPOSALS_TABLE)
        .get()
        .then((snapshotProposals) => {
            let bdProposals = getList(snapshotProposals, isGlobal ? FREETON_PROPOSALS_TABLE : PROPOSALS_TABLE);
            bdProposals = bdProposals.sort((pr1, pr2) => {
                return (pr1.createdAt > pr2.createdAt) ? -1 : 1;
            });
            bdProposals.forEach((pr, rank) => {
                pr.order = bdProposals.length - rank;
                pr.title = `#${pr.order} ${pr.title}`;
            });
            if (proposalAddresses && proposalAddresses.length) bdProposals = bdProposals.filter(p => proposalAddresses.includes(p.proposalWalletAddress));
            return withStats ? Promise.all(bdProposals.map(getProposal)) : bdProposals;
        })
        .then((proposals) => {
            return proposals;
        })
        .catch((error) => { console.log('getProposals error', error); });
}

function getProposalTransactions(proposal) {
    return window.TONClient.contracts.runLocal({
        address: proposal.judgeWalletAddress,
        abi: mltsgPackage.abi,
        functionName: 'getTransactions',
        input: {},
        keyPair: null,
    }).then((result) => {
        if (!result.output) return proposal;
        if (proposal.votingStarted && proposal.votingStarted.seconds) {
            proposal.votingStarted = new Date(proposal.votingStarted.seconds * 1000);
        }
        const txns = result.output.transactions;
        const txn = txns.find(txn => (txn.dest == proposal.proposalWalletAddress));
        if (txn) {
            proposal.status = 'Voting';
            proposal.signsReceived = txn.signsReceived;
            proposal.trid = txn.id;

            if (!proposal.votingStarted) {
                const createdAtTimestamp = parseInt(txn.id.substr(0, 10), 16);
                const createdAtDate = new Date(createdAtTimestamp * 1000);
                proposal.votingStarted = createdAtDate;
                FBInfoRequests.getCollection(proposal.table)
                    .doc(proposal.id)
                    .update({ votingStarted: proposal.votingStarted });
            }
        } else if (
            (Date.now() - proposal.createdAt.toDate().getTime() > 7 * 24 * 60 * 60 * 1000) ||
            (proposal.votingStarted && (Date.now() - proposal.votingStarted.getTime() > 24 * 60 * 60 * 1000))
        ) {
            proposal.status = 'Rejected';
        }
        return proposal;
    });
}

function getProposal(proposal) {
    // console.log(`getProposal for ${proposal.title}`);
    const filter = {
        src: { eq: proposal.judgeWalletAddress },
        dst: { eq: proposal.proposalWalletAddress },
    };
    return getProposalCustodians(proposal.judgeWalletAddress)
        .then((result) => {
            // console.log('custodians: ', result);
            proposal.custodians = result.output.custodians;
            return window.TONClient.queries.messages.query(filter, 'id body');
        })
        .then((msgs) => {
            // console.log(`got msgs for ${proposal.title}`);
            proposal.isApproved = !!msgs.length;
            proposal.messageId = msgs.length ? msgs[0].id : null;
            if (proposal.messageId) {
                proposal.status = 'Passed';
                return getContest(proposal);
            }
            proposal.status = 'Review';
            return getProposalTransactions(proposal);
        })
        .catch((error) => {
            console.log('getProposal error: ', error);
            return proposal;
        });
}

const getKeysBySeed = async (seed) => {
    try {
        const password = '111111';
        const passwordProvider = (showHUD, callback) => {
            const hideHud = () => {};
            callback(password, hideHud);
        };
        const walletInstance = new TONTokensWallet(
            password,
            seed,
            passwordProvider,
        );
        TONTokensWallet.setWalletInstance(walletInstance);
        const keys = await TONTokensWallet.getWalletInstance()?.getGRAMAddressKeyPair();
        return keys;
    } catch (err) {
        console.log('getKeysBySeed error', err);
    }
};

const voteSubmission = async (contestAddress, submission, seed, rate, publicComment) => {
    // rate: 0-10 | reject | abstain
    let keys = null;
    let functionName = '';
    try {
        keys = await getKeysBySeed(seed);
        /* const custodian = submission.juryKeys.find((pubkey) => { return pubkey === `0x${keys.public}`; });
        if (!custodian) { throw new Error('Invalid jury key'); } */
        functionName = rate === 'To abstain' ? 'abstain' : rate === 'Reject' ? 'voteAgainst' :
            'voteForCommented';
        const comment = Buffer.from(publicComment || 'none').toString('hex');

        const input = {
            id: submission.submissionId,
            comment,
        };
        if (functionName === 'voteForCommented') {
            input.mark = rate;
        }
        const resultSuccess = await window.TONClient.contracts.run({
            address: contestAddress,
            abi: ContestPackageAbi,
            functionName,
            input,
            keyPair: keys,
        });
        // console.log('resultSuccess', resultSuccess);
        const exit_code = resultSuccess.transaction.compute.exit_code;
        if (exit_code !== 0) {
            throw { code: 3025, data: { exit_code } };
        }
        return { success: true };
    } catch (err) {
        console.log('Vote error', err);
        FBInfoRequests.add({
            ...err,
            pubkey: keys.public,
            functionName,
            contestAddress,
            id: submission.submissionId,
        }, ERRORS_TABLE);
        return convertError(err);
    }
    return false;
};

export default {
    getSubmissionStats,
    getContestSubmissions,
    voteSubmission,
    getProposal,
    getProposals,
    submitSubmission,
    convertError,
    queryBalance,
    getProposalTransactions,
};
