// @flow
import React from 'react';
import { View, StyleSheet } from 'react-native';

import {
    UIConstant,
    UIComponent,
    UIStyle,
    UIColor,
    UILink,
} from '../services/UIKit';

import TONLocalized from '../helpers/TONLocalized';

const styles = StyleSheet.create({
    fixHeight: {
        height: UIConstant.bigCellHeight(),
    },
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: UIColor.whiteLight(),
    },
});

const footerTextStyle = [
    UIStyle.Color.textTertiary(),
    UIStyle.Text.tinyMedium(),
    UIStyle.Padding.default(),
];

const fixHeightCenterContainer = [
    styles.fixHeight,
    UIStyle.Common.centerLeftContainer(),
];

type Props = {};
type State = {};

export default class Bottom extends UIComponent<Props, State> {
    renderLeft() {
        return (
            <View style={fixHeightCenterContainer}>
                {
                    TONLocalized.BottomLinksLeft.map((item, rank) => (
                        <UILink
                            key={`link-${rank}`}
                            title={this.props.isNarrow ? null : item.linkText}
                            href={item.link}
                            icon={item.icon}
                            iconStyle={item.disableIconTint ? { tintColor: '' } : null}
                            iconHoverStyle={item.disableIconTint ? { tintColor: '' } : null}
                            target="_blank"
                        />
                    ))
                }
            </View>
        );
    }

    renderRight() {
        return (
            <View style={fixHeightCenterContainer}>
                {
                    TONLocalized.BottomLinksRight.map((item, rank) => (
                        <UILink
                            key={`link-${rank}`}
                            title={this.props.isNarrow ? null : item.linkText}
                            href={item.link}
                            iconR={item.icon}
                            target="_blank"
                        />
                    ))
                }
            </View>
        );
    }

    render() {
        return (
            <View style={[UIStyle.Common.rowSpaceContainer(), styles.fixHeight, styles.borderTop]}>
                {this.renderLeft()}
                {this.renderRight()}
            </View>
        );
    }
}
