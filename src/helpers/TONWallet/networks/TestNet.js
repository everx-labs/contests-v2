// @flow
import TONTokens from '../TONTokens';

import { TONNetworkStore } from './stores';

import { netNames } from './constants';

const testNet = new TONNetworkStore({
    netName: netNames.testnet,

    enabled: false,
    stakingEnabled: false,

    multisigSupported: true,
    stakingSupported: false,

    currencies: [TONTokens.TG],
    stakingCurrency: TONTokens.TGSTAKE,

    test: true,
    useBase64Address: true,
});

export default testNet;
