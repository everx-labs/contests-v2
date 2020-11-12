// @flow

import { emptyDisplayCutout } from './TONNativeUtility';
import type { TONNativeUtility } from './TONNativeUtility';
import TONString from './TONString';

export default function TONNativeUtilityNodeJs(): Promise<TONNativeUtility> {
    return Promise.resolve({
        getLocaleInfo() {
            return Promise.resolve(TONString.getLocaleInfo());
        },
        getAndroidDisplayCutout() {
            return Promise.resolve(emptyDisplayCutout);
        },
    });
}

