// @flow
import React, { Component } from 'react';
import { View, StyleSheet } from 'react-native';
import { UserAgentProvider } from '@quentin-sommer/react-useragent';

import {
    UIMenuBackground,
    UINotice,
    UIAlertView,
    UIActionSheet,
    UIEventHelper,
    UICustomSheet,
    UILayoutManager,
    UICountryPicker,
} from './services/UIKit';
import Navigator from './controllers/Navigator';
import Firebase from './services/Firebase';
import SeedInputModal from './components/SeedInputModal';

// import FBRequests from './services/Firebase/FBRequests';
import configs from './configs';
import store from './store';
import { setIsLoggedIn } from './actions/AuthActions';

const styles = StyleSheet.create({
    appContainer: {
        display: 'flex',
    },
    container: {
        width: '100%',
        height: '100%',
        // $FlowExpectedError
        position: 'fixed',
        bottom: 0,
        right: 0,
    },
});

type Props = {};
type State = {};

class App extends Component<Props, State> {
    componentDidMount() {
        UIEventHelper.observePopState();
        (async () => {
            await Firebase.loginAnonymously();
            await configs.setup();
            store.dispatch(setIsLoggedIn(true));
            // Use it to log all emails
            // await FBRequests.logAll();
        })();
    }

    // Events

    // Render
    render() {
        return (
            <UserAgentProvider ua={window.navigator.userAgent}>
                <UIMenuBackground>
                    <View style={[styles.container, styles.appContainer]}>
                        <Navigator />
                        <UINotice />
                        <UIActionSheet />
                        <UICustomSheet />
                        <UILayoutManager />
                        <UIAlertView />
                        <UICountryPicker isShared />
                        <SeedInputModal isShared />
                    </View>
                </UIMenuBackground>
            </UserAgentProvider>
        );
    }
}

export default App;
