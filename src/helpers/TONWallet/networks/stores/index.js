// @flow
import { action, observable } from 'mobx';
import { TONClient } from 'ton-client-js';

import { TONCommonStore } from '../../../TONUtility';

import type { TONToken } from '../../TONTokens';

import type {
    TONNetwork,
    TONNetName,
    TONNetworkOptions,
    TONNetworkConfigureOptions,
} from '../types';

class TONNetworkStore extends TONCommonStore implements TONNetwork {
    netName: TONNetName;

    @observable enabled: boolean;
    @observable stakingEnabled: boolean;

    multisigSupported: boolean;
    @observable stakingSupported: boolean;

    currencies: TONToken[] = [];
    stakingCurrency: ?TONToken;

    test: boolean;

    useBase64Address: boolean;

    client: TONClient = new TONClient();
    stakingOwnerAddress: ?string;

    // Constructor
    constructor(options: TONNetworkOptions) {
        super();

        this.netName = options.netName;

        this.enabled = options.enabled;
        this.stakingEnabled = options.stakingEnabled;

        this.multisigSupported = options.multisigSupported;
        this.stakingSupported = options.stakingSupported;

        this.currencies = options.currencies;
        this.stakingCurrency = options.stakingCurrency;

        this.test = options.test;

        this.useBase64Address = options.useBase64Address;
    }

    get referralCurrency(): TONToken {
        return this.currencies[0];
    }

    // Actions
    configure = async (options: TONNetworkConfigureOptions) => {
        this.client.config.setData(options.clientConfigData);
        await this.client.setup();

        this.stakingOwnerAddress = options.stakingOwnerAddress;

        await this.load();
    }

    /**
     * @overridden
     */
    @action
    onLoad = async () => {
        await this.loadOptions();
    };

    /**
     * @overridden
     */
    @action
    onUnload = async () => {
        // nothing
    };

    // Actions
    @action
    enableNetwork = async () => {
        if (this.enabled) {
            this.log.debug('Network is already enabled');
            return;
        }
        this.enabled = true;
        await this.storeOptions();
    }

    @action
    disableNetwork = async () => {
        if (!this.enabled) {
            this.log.debug('Network is already disabled');
            return;
        }
        this.enabled = false;
        await this.storeOptions();
    }

    @action
    enableStakingSupport = async () => {
        if (!this.stakingEnabled) {
            throw new Error(`Staking is not enabled for net: ${this.netName}`);
        }
        if (this.stakingSupported) {
            this.log.debug('Staking is already enabled');
            return;
        }
        this.stakingSupported = true;
        await this.storeOptions();
    }

    // Internal
    loadOptions = async () => {
        // TODO: load TONNetworkOptions from AsyncStore if we change them dynamically
    }

    storeOptions = async () => {
        // TODO: store the updated TONNetworkOptions in AsyncStore
    }
}

export { TONNetworkStore };
