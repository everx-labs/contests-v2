// @flow

import MulticastPromise from './MulticastPromise';
import TONAsync from './TONAsync';
import TONCache, { TONCacheMap } from './TONCache';
import TONEnvironment from './TONEnvironment';
import TONFunction from './TONFunction';
import TONLimitedFetcher from './TONLimitedFetcher';
import TONLog, { TONLogSettings } from './TONLog';
import TONMultiLoader from './TONMultiLoader';
import { emptyDisplayCutout } from './TONNativeUtility';
import TONNativeUtilityReactNative from './TONNativeUtilityReactNative';
import TONString from './TONString';
import TONSubscriptionCenter from './TONSubscriptionCenter';
import TONWorkerThread from './TONWorkerThread';
import { TONCommonStore } from './TONCommonStore';

import type { TONAsyncOperation } from './TONAsync';
import type {
    TONAsyncStorage,
    TONCacheObserver,
    TONCacheConfigurator,
    TONCacheValueListener,
} from './TONCache';
import type {
    TONLimitedFetcherListenerOptions,
    TONLimitedFetcherListener,
} from './TONLimitedFetcher';
import type {
    TONLoader,
    TONLoaderDataObject,
    TONLoaderData,
    TONLoaderSections,
    TONLoaderDataCallback,
} from './TONMultiLoader';
import type {
    AndroidDisplayCutout,
    TONNativeUtility,
} from './TONNativeUtility';
import type {
    TONNumberParts,
    TONNumberPartsOptions,
    TONStringHighlight,
} from './TONString';
import type {
    TONSubscription,
    TONAsyncListener,
    TONListener,
} from './TONSubscriptionCenter';

export {
    MulticastPromise,
    TONAsync,
    TONCache,
    TONCacheMap,
    TONEnvironment,
    TONFunction,
    TONLimitedFetcher,
    TONLog,
    TONLogSettings,
    TONMultiLoader,
    TONNativeUtilityReactNative,
    TONString,
    TONSubscriptionCenter,
    TONWorkerThread,
    TONCommonStore,
};

export type {
    TONAsyncOperation,
    TONAsyncListener,
    TONCacheObserver,
    TONCacheConfigurator,
    TONCacheValueListener,
    TONListener,
    TONLimitedFetcherListenerOptions,
    TONLimitedFetcherListener,
    TONLoader,
    TONLoaderDataObject,
    TONLoaderData,
    TONLoaderSections,
    TONLoaderDataCallback,
    TONNumberParts,
    TONNumberPartsOptions,
    TONStringHighlight,
    TONSubscription,
};

const log = new TONLog('TONUtility');

export default class TONUtility {
    static getAndroidDisplayCutout(): AndroidDisplayCutout {
        return TONUtility.androidDisplayCutout;
    }

    static async setup(
        nativeFactory: () => Promise<TONNativeUtility>,
        asyncStorage?: TONAsyncStorage,
    ): Promise<void> {
        TONUtility.native = await nativeFactory();
        try {
            if (asyncStorage) {
                TONCache.setAsyncStorage(asyncStorage);
            }
            const localeInfo = await TONUtility.native.getLocaleInfo();
            if (localeInfo) {
                TONString.setLocaleInfo(localeInfo);
            }
            if (TONUtility.native.getAndroidDisplayCutout) {
                TONUtility.androidDisplayCutout = await TONUtility.native.getAndroidDisplayCutout();
            }
        } catch (error) {
            log.error('setup failed: ', error);
        }
    }

    // Internals

    static native: TONNativeUtility;
    static androidDisplayCutout = emptyDisplayCutout;
}
