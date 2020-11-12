const functions = require('firebase-functions');
const admin = require('firebase-admin');

const validatorsConfig = require('./configs/ValidatorsConfig');

admin.initializeApp();

exports.checkProposalKey= functions.https.onCall((data, context) => {
    return new Promise(resolve => {
        const validatorKeys = validatorsConfig.VALIDATOR_KEYS[data.governance];
        const existingKey = validatorKeys.find(
            validatorKey => validatorKey.key === data.proposalKey
        );
        resolve({success: !!existingKey});
    });
});
