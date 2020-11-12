// @flow
import {
    Platform,
    NativeModules,
} from 'react-native';

import TONNativeUtilityWebAssembly from './TONNativeUtilityWebAssembly';
import type { TONNativeUtility } from './TONNativeUtility';

export default function TONNativeUtilityReactNative(): Promise<TONNativeUtility> {
    return Platform.OS === 'web'
        ? TONNativeUtilityWebAssembly()
        : Promise.resolve(NativeModules.TONUtility);
}
