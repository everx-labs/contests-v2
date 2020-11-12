// @flow
import React, { Component } from 'react';
import { View } from 'react-native';
import { createStackNavigator, NavigationActions } from 'react-navigation';

import { UIStyle } from '../../services/UIKit/UIKit';

// import WalletSetupMainScreen from '../controllers/WalletSetupMainScreen';
import WalletSetupNewKeyView from '../controllers/WalletSetupNewKeyView';
// import WalletSetupNewPhraseCheck from '../controllers/WalletSetupNewPhraseCheck';
// import WalletSetupNewPhraseView from '../controllers/WalletSetupNewPhraseView';
import WalletSetupRestorePhrase from '../controllers/WalletSetupRestorePhrase';
import WalletSetupSetLocalPassword from '../controllers/WalletSetupSetLocalPassword';
import WalletSetupConfirmLocalPassword from '../controllers/WalletSetupConfirmLocalPassword';
import { WalletSetupScreens } from '../controllers/WalletSetupTypes';

import type {
    // OnWalletTemporaryWalletCreationComplete,
    OnWalletSetupComplete,
    // TONWalletSetupCreateTemporaryWalletOptions,
    TONWalletSetupCompleteOptions,
} from '../controllers/WalletSetupTypes';

type Props = {
    onComplete: OnWalletSetupComplete,
    // onCreateTemporaryWallet: OnWalletTemporaryWalletCreationComplete,
};

function createNavigator(props: Props) {
    return createStackNavigator(
        {
            // WalletSetupMainScreen: { screen: WalletSetupMainScreen },
            WalletSetupNewKeyView: { screen: WalletSetupNewKeyView },
            // WalletSetupNewPhraseView: { screen: WalletSetupNewPhraseView },
            // WalletSetupNewPhraseCheck: { screen: WalletSetupNewPhraseCheck },
            WalletSetupRestorePhrase: { screen: WalletSetupRestorePhrase },
            WalletSetupSetLocalPassword: { screen: WalletSetupSetLocalPassword },
            WalletSetupConfirmLocalPassword: { screen: WalletSetupConfirmLocalPassword },
        },
        {
            initialRouteName: WalletSetupScreens.RestorePhrase,
            initialRouteParams: {
                walletSetup: props,
                initialRoute: true,
            },
            navigationOptions: () => ({
                walletSetup: props,
                completeOptions: {},
                headerStyle: UIStyle.navigatorHeader,
                headerTitleStyle: UIStyle.navigatorHeaderTitle,
            }),
        },
    );
}

let navigator = null;

function getNavigator(props: Props) {
    if (!navigator) {
        navigator = createNavigator(props);
    }
    return navigator;
}

type State = {
};

export default class WalletSetupNavigator extends Component<Props, State> {
    // Events
    onComplete(options: TONWalletSetupCompleteOptions) {
        this.props.onComplete(options);
    }

    // onCreateTemporaryWallet(options: TONWalletSetupCreateTemporaryWalletOptions) {
    //     this.props.onCreateTemporaryWallet(options);
    // }

    // Actions
    walletSetupNavigator: React$ElementRef<any>;
    start() {
        this.navigateToScreen(WalletSetupScreens.Main);
    }

    restoreWallet() {
        this.navigateToScreen(WalletSetupScreens.CustodianRecoveryRestore);
    }

    navigateToScreen(routeName: string) {
        if (this.walletSetupNavigator) {
            const navigationAction = NavigationActions.navigate({
                routeName,
                params: { walletSetup: this.props },
            });
            this.walletSetupNavigator.dispatch(navigationAction);
        }
    }

    // Render
    render() {
        const Navigator = getNavigator({
            // onCreateTemporaryWallet: (options: TONWalletSetupCreateTemporaryWalletOptions) => {
            //     this.onCreateTemporaryWallet(options);
            // },
            onComplete: (options: TONWalletSetupCompleteOptions) => {
                this.onComplete(options);
            },
        });
        return (
            <View style={[UIStyle.screenBackground, UIStyle.backgroundLightColor]}>
                <View style={UIStyle.fullScreenController}>
                    <Navigator
                        key="WalletSetupNavigator"
                        ref={(component) => { this.walletSetupNavigator = component; }}
                    />
                </View>
            </View>
        );
    }
}
