// @flow
import TONTokens from '../TONTokens';

import { TONNetworkStore } from './stores';

import { netNames } from './constants';

const devNet = new TONNetworkStore({
    netName: netNames.devnet,

    enabled: true,
    stakingEnabled: true,

    multisigSupported: true,
    stakingSupported: false,

    currencies: [TONTokens.GRAM],
    stakingCurrency: TONTokens.STAKE,

    test: true,
    useBase64Address: false,
});

export default devNet;
