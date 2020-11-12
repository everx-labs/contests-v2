import { TONClient, setWasmOptions } from 'ton-client-web-js';

import * as UIKit from '../services/UIKit/UIKit';

const netConfig = {
    defaultWorkchain: 0,
    log_verbose: false, // true,
};

export function getAppName() {
    return 'TONLabs';
}

export default class Configs {
    static isContestsTest() {
        return process.env.MODE === 'contests-test';
    }

    static isContests() {
        return process.env.MODE === 'contests' || process.env.MODE === 'contests-test';
    }

    static isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }

    static async setupSDK() {
        setWasmOptions({
            binaryURL: '/assets/tonclient.wasm',
        });
        window.TONClient = await TONClient.create({
            ...netConfig,
            servers: Configs.isContestsTest() ? ['net.ton.dev'] : ['main.ton.dev'],
            // messageExpirationTimeout: 1000,
            // messageRetriesCount: 1,
            // messageExpirationTimeoutGrowFactor: 1,
            // messageProcessingTimeout: 1000,
            // waitForTimeout: 1000,
        });
    }

    static async setup() {
        await Promise.all([
            Configs.isContests() && this.setupSDK(),
        ]);
    }
}
