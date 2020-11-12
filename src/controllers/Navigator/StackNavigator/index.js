import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing } from 'react-native';
import { createStackNavigator, NavigationActions, StackActions } from 'react-navigation';

import TONLabsRoutes from '../Routes';

import PathMap from '../PathMap';

import { UINavigator, UIConstant } from '../../../services/UIKit/UIKit';

const fade = (props) => {
    const { position, scene } = props;
    const { index } = scene;
    const inputRange = [index - 1, index, index + 1];
    const opacity = position.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
    });

    const transform = [{ translateX: 0 }, { translateY: 0 }];

    return {
        opacity,
        transform,
    };
};

function createNavigator(screens, initialRouteName, initialRouteParams) {
    const routeConfigs = PathMap.addPathToScreens(screens);
    const navigatorConfig = {
        initialRouteName: screens[initialRouteName] ? initialRouteName : null,
        initialRouteParams: {
            initialRoute: true,
            ...initialRouteParams,
        },
        navigationOptions: () => ({
            headerTransparent: true,
        }),
        transitionConfig: () => ({
            containerStyle: {
                backgroundColor: 'transparent',
            },
            transitionSpec: {
                duration: UIConstant.animationDuration(),
                timing: Animated.timing,
                easing: Easing.exp,
            },
            screenInterpolator: (props) => {
                return fade(props);
            },
        }),
        cardStyle: {
            backgroundColor: 'transparent',
            shadowRadius: 0,
        },
        headerMode: 'screen',
        // headerTransitionPreset: 'fade-in-place',
    };
    return createStackNavigator(routeConfigs, navigatorConfig);
}

const navigators = {
    master: new UINavigator(createNavigator),
    // detail: new UINavigator(createNavigator),
};

const allScreens = {
    ...TONLabsRoutes.routing.screens,
};

export default class StackNavigator extends Component {
    static allScreens() {
        return allScreens;
    }

    // Render
    render() {
        const {
            screens,
            initialRouteName,
            initialRouteParams,
            masterDetailRole,
        } = this.props;
        const Navigator = navigators[masterDetailRole].get(screens, initialRouteName, initialRouteParams);

        return (
            <Navigator />
        );
    }
}

StackNavigator.defaultProps = {
    screens: allScreens,
    initialRouteParams: null,
    masterDetailRole: UINavigator.Role.Master,
};

StackNavigator.propTypes = {
    screens: PropTypes.instanceOf(Object),
    initialRouteName: PropTypes.string.isRequired,
    initialRouteParams: PropTypes.instanceOf(Object),
    masterDetailRole: PropTypes.string,
};
