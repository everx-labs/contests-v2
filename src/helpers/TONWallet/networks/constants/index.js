// @flow

export const netNames = Object.freeze({ // Corresponds to Firebase account `net` values!
    devnet: 'tonlabs', // net.ton.dev
    mainnet: 'mainnet', // main.ton.dev
    testnet: 'testnet', // testnet.ton.dev
    privatnet: 'private', // private.ton.dev (N.B. DO NOT store in Firebase!)
    ethereumnet: 'ethereum', // deprecated one (TODO: remove it later)
});
