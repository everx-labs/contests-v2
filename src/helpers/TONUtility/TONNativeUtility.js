// @flow

import type { TONStringLocaleInfo } from './TONString';

export type AndroidDisplayCutout = {
    left: number,
    top: number,
    right: number,
    bottom: number,
};

export const emptyDisplayCutout: AndroidDisplayCutout = Object.freeze({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
});

export interface TONNativeUtility {
    getLocaleInfo(): Promise<TONStringLocaleInfo>;

    getAndroidDisplayCutout(): Promise<AndroidDisplayCutout>;
}

