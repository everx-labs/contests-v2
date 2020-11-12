// @flow
import TONTokens from '../TONTokens';

import { TONNetworkStore } from './stores';

import { netNames } from './constants';

const mainNet = new TONNetworkStore({
    netName: netNames.mainnet,

    enabled: false,
    stakingEnabled: true,

    multisigSupported: true,
    stakingSupported: false,

    currencies: [TONTokens.GRM],
    stakingCurrency: TONTokens.GRMSTAKE,

    test: false,
    useBase64Address: true,
});

export default mainNet;
