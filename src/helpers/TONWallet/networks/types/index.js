// @flow
import { TONClient } from 'ton-client-js';
import type { TONConfigData } from 'ton-client-js/types';

import type { TONToken } from '../../TONTokens';

import { netNames } from '../constants';

export type TONNetName = $Values<typeof netNames>;

export type TONNetworkOptions = {
    netName: TONNetName,

    enabled: boolean,
    stakingEnabled: boolean,

    multisigSupported: boolean, // Used to know if the referralCurrency can be used with `multisig`
    stakingSupported: boolean, // Used to display "coming soon" feature!

    currencies: TONToken[],
    stakingCurrency?: TONToken,

    test: boolean,
    useBase64Address: boolean,
}

export type TONNetworkConfigureOptions = {
    clientConfigData: TONConfigData,
    stakingOwnerAddress?: string,
};

export interface TONNetwork {
    netName: TONNetName,

    enabled: boolean,
    stakingEnabled: boolean,

    multisigSupported: boolean, // Used to know if the referralCurrency can be used with `multisig`
    stakingSupported: boolean, // Used to display "coming soon" feature!

    currencies: TONToken[],
    stakingCurrency: ?TONToken,
    +referralCurrency: TONToken,

    test: boolean,
    useBase64Address: boolean,

    client: TONClient,
    stakingOwnerAddress: ?string,

    configure: (options: TONNetworkConfigureOptions) => Promise<void>,

    enableNetwork: () => Promise<void>,
    disableNetwork: () => Promise<void>,
    enableStakingSupport: () => Promise<void>,
}
