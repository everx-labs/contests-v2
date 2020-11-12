// @flow
import TONTokens from '../TONTokens';

import { TONNetworkStore } from './stores';

import { netNames } from './constants';

const privateNet = new TONNetworkStore({
    netName: netNames.privatnet,

    enabled: true,
    stakingEnabled: false,

    multisigSupported: false,
    stakingSupported: false,

    currencies: [TONTokens.GRAM], // TODO: pick different if needed!
    stakingCurrency: undefined,

    test: false,
    useBase64Address: false,
});

export default privateNet;
