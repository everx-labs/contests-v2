import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Platform, View } from 'react-native';

import { UIStyle, UIController, UINavigator, UIBackgroundView } from '../../services/UIKit/UIKit';

import { showController } from '../../actions/ControllerActions';

import TONLog from '../../helpers/TONLog';

import StackNavigator from './StackNavigator';
import PathMap from './PathMap';

const log = new TONLog('Messenger');

class Scanner extends UIController {
    static log = log;

    // Life cycle
    componentDidMount() {
        super.componentDidMount();
        this.handleLocation();
    }

    componentWillReceiveProps(nextProps) {
        this.processProps(nextProps);
    }

    // Processing
    processProps(props) {
        const { controllerToShow, isLoggedIn } = props;

        if (controllerToShow && this.controllerToShow !== controllerToShow) { // && isLoggedIn) {
            this.controllerToShow = controllerToShow;
        }
    }

    // Action
    handleLocation() {
        if (Platform.OS !== 'web') {
            return;
        }
        // Get path name
        const { location } = window;
        const pathName = location.pathname.substring(1);
        // Get path parameters
        const parametersString
            = location.href.substring(location.origin.length + 1 + pathName.length);
        const pathParameters = UIController.getParametersFromString(parametersString);
        // Handle path
        PathMap.handlePathNavigation(
            pathName, pathParameters,
            (controllerToShow) => {
                if (controllerToShow && controllerToShow.routeName) {
                    this.props.showController(controllerToShow);
                }
            },
        );
    }

    // Render
    render() {
        if (!this.props.controllerToShow) return <View />;

        const initialRouteName = this.props.controllerToShow.routeName;
        const initialRouteParams = this.props.controllerToShow.params;

        const screens = StackNavigator.allScreens();
        return (
            <View style={UIStyle.container.screenBackground()}>
                <UIBackgroundView
                    presetName={this.props.backgroundPresetName}
                    screenWidth={this.props.screenWidth}
                />
                <StackNavigator
                    ref={(component) => {
                        this.mainStackNavigator = component;
                    }}
                    initialRouteName={initialRouteName}
                    initialRouteParams={initialRouteParams}
                    screens={screens}
                    navigation={this.props.navigation}
                    masterDetailRole={UINavigator.Role.Master}
                />
            </View>
        );
    }
}

Scanner.defaultProps = {
    isLoggedIn: undefined,
};

Scanner.propTypes = {
    isLoggedIn: PropTypes.bool,
};

const mapStateToProps = state => ({
    controllerToShow: state.controller.controllerToShow,
    backgroundPresetName: state.controller.backgroundPresetName,
    screenWidth: state.controller.screenWidth,
    isLoggedIn: state.auth.isLoggedIn,
});

export default connect(mapStateToProps, { showController })(Scanner);
