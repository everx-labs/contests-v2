// @flow
import React from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';

import {
    UIConstant,
    UIComponent,
    UIStyle,
    UIBackgroundView,
} from '../services/UIKit';

import icoTonLabsPrimaryMinus from '@uikit/assets/logo/tonlabs/tonlabs-primary-minus.png';
import icoTonLabsBlack from '@uikit/assets/logo/tonlabs/tonlabs-black.png';

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        height: UIConstant.bigCellHeight(),
    },
});

type Props = {};

type State = {};

class TopBar extends UIComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    // Events

    // Setters

    // Getters

    // Actions

    // Render
    renderImageButton(source, onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                style={UIStyle.marginDefault}
            >
                <Image source={source} />
            </TouchableOpacity>
        );
    }

    renderLeft() {
        const icoTonLabs = this.props.backgroundPresetName === UIBackgroundView.PresetNames.Action
            ? icoTonLabsPrimaryMinus
            : icoTonLabsBlack;
        return (
            <View style={UIStyle.centerLeftContainer}>
                <Image source={icoTonLabs} style={UIStyle.marginDefault} />
                {/* <TouchableOpacity */}
                {/* onPress={() => {}} */}
                {/* style={[UIStyle.marginDefault, UIStyle.flexRow]} */}
                {/* > */}
                {/* <Image source={icoWallet} style={UIStyle.marginRightSmall} /> */}
                {/* <Text style={UITextStyle.primarySmallMedium}> */}
                {/* .web */}
                {/* </Text> */}
                {/* </TouchableOpacity> */}
            </View>
        );
    }

    // renderRight() {
    //     return (
    //         <View style={UIStyle.centerLeftContainer}>
    //             {/* {this.renderImageButton(icoGithub, () => {})} */}
    //             {this.renderImageButton(icoShield, () => PromoScreen.show())}
    //         </View>
    //     );
    // }

    render() {
        if (this.props.hidden) {
            return null;
        }

        return (
            <View style={styles.container}>
                <View style={UIStyle.rowSpaceContainer}>
                    {this.renderLeft()}
                    {/* {this.renderRight()} */}
                </View>
            </View>
        );
    }

    static defaultProps: Props;
}

TopBar.defaultProps = {
    hidden: false,
};

const mapStateToProps = state => ({
    backgroundPresetName: state.controller.backgroundPresetName,
});

export default connect(mapStateToProps)(TopBar);
