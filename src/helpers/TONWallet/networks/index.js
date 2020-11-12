// @flow
/* eslint-disable class-methods-use-this */
import { TONClient } from 'ton-client-js';
import type { TONToken } from '../TONTokens';

import mainNet from './MainNet';
import testNet from './TestNet';
import devNet from './DevNet';
import privateNet from './PrivateNet';
import ethereumNet from './EthereumNet';

import { netNames } from './constants';
import type { TONNetwork, TONNetName, TONNetworkConfigureOptions } from './types';

const networks = [devNet, mainNet, testNet, privateNet, ethereumNet]; // devNet is set as default!

if (Object.keys(netNames).length !== networks.length) {
    throw new Error('Not all networks set up properly!');
}

class TONNetworks {
    // Getters
    get networks(): TONNetwork[] { // all available networks
        return networks;
    }

    get netNames() { // all available net names
        return netNames;
    }

    get crypto() { // crypto sub-module of any network client (as it's the same for all networks)
        return this.findClientByName(netNames.mainnet).crypto; // e.g. take it from `mainnet`
    }

    get defaultNetwork(): TONNetwork {
        return networks.find(network => network.enabled) || devNet; // First enabled network!
    }

    get enabledAccountNetworks(): TONNetwork[] { // all enabled networks with multisig support
        return networks.filter(network => network.enabled && network.multisigSupported);
    }

    get enabledStakingNetworks(): TONNetwork[] { // all enabled networks with staking support
        return this.enabledAccountNetworks.filter(network => network.stakingSupported);
    }

    get enabledAccountNets() { // used as initial accounts record for Firebase database
        let nets = {};
        this.enabledAccountNetworks.forEach((network) => {
            nets = { ...nets, ...this.enabledAccountNet(network) };
        });
        return nets;
    }

    enabledAccountNet(network: TONNetwork) {
        const type = 'account'; // for sorting (ask Dmitry Romanov to provide more details)
        return {
            [network.netName]: {
                canStake: network.stakingEnabled,
                disabled: false,
                type,
            },
        };
    }

    // Actions
    async setupNetwork(
        name: TONNetName,
        options: TONNetworkConfigureOptions,
    ): Promise<void> {
        const network = this.findNetworkByName(name);
        await network.configure(options);
    }

    // Finders
    findNetworkByName(name: TONNetName): TONNetwork {
        const network = this.networks.find(({ netName }) => netName === name);
        if (!network) {
            throw new Error(`No network found for name: ${name}`);
        }
        return network;
    }

    findNetworkByCurrency(currency: TONToken): TONNetwork {
        const network = this.networks.find(({ currencies, stakingCurrency }) => {
            return currencies.indexOf(currency) >= 0 || stakingCurrency === currency;
        });
        if (!network) {
            throw new Error(`No network found for currency: ${currency}`);
        }
        return network;
    }

    findClientByName(name: TONNetName): TONClient {
        return window.TONClient;
    }
}

export default new TONNetworks();
