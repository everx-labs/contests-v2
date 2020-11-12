// @flow
export type TONWalletConfigurationData = {
    testNet: boolean,
    ethereum: {
        nodeHost: string,
    },
};

export default class TONWalletConfiguration {
    static shared = new TONWalletConfiguration();

    privateData: TONWalletConfigurationData;
    constructor() {
        this.privateData = {
            testNet: true,
            ethereum: {
                nodeHost: '',
            },
        };
    }

    set(data: TONWalletConfigurationData) {
        this.privateData = data;
    }

    get(): TONWalletConfigurationData {
        return this.privateData;
    }
}
