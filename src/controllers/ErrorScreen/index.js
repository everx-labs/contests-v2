import React from 'react';
import { Linking } from 'react-native';

import UIErrorScreen from '@uikit/navigation/UIErrorScreen';
import iconTonlabs from '../../assets/tonlabs-black.png';

export default class ErrorScreen extends UIErrorScreen {
    constructor(props: Props) {
        super(props);
    }

    // Virtual
    getProductIcon() {
        return iconTonlabs;
    }

    // Events
    onPressBackToHome = () => {
        Linking.openURL('./main');
    };
}
