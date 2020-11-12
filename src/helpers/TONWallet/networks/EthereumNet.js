// @flow
import TONTokens from '../TONTokens';

import { TONNetworkStore } from './stores';

import { netNames } from './constants';

const ethereumNet = new TONNetworkStore({
    netName: netNames.ethereumnet,

    enabled: false, // Net is deprecated. Should be removed in the future!
    stakingEnabled: false,

    multisigSupported: false,
    stakingSupported: false,

    currencies: [TONTokens.ETH, TONTokens.BNB],
    stakingCurrency: undefined,

    test: true,
    useBase64Address: false,
});

export default ethereumNet;
