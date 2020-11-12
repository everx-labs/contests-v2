import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { UIStyle, UITextStyle, UIColor, UIActionComponent, UIColorPalette } from '../services/UIKit/UIKit';

const styles = StyleSheet.create({
    marginTopNegativeOffset: {
        marginTop: -1,
    },
});

const container = [
    UIStyle.paddingTopDefault,
    UIStyle.paddingBottomDefault,
];

export default class DetailsCell extends UIActionComponent {
    constructor(props) {
        super(props);
    }
    // Setters

    // Getters
    getBackgroundStyle() {
        if (this.props.disabled || this.props.disableHighlight) return null;

        if (this.isHover() || this.isTapped()) {
            const color = UIColor.whiteLight();
            return [UIColor.getBackgroundColorStyle(color),
                UIStyle.marginHorizontalNegativeOffset,
                styles.marginTopNegativeOffset,
                UIStyle.paddingLeftDefault,
                UIStyle.paddingRightDefault,
                this.props.firstCell ? null : UIStyle.cellBorderTop,
                this.props.needBorderBottom ? UIStyle.cellBorderBottom : null,
            ];
        }
        return null;
    }

    getTitleColorStyle() {
        if (this.props.disabled || this.props.titleIsText) return UIColor.getColorStyle(UIColorPalette.text.lightSecondary);

        if (this.isHover() || this.isTapped()) {
            const color = UIColor.primary4();
            return UIColor.getColorStyle(color);
        }
        return null;
    }

    // Render
    renderContent() {
        const {
            title, details, onPress, containerStyle, needBorderBottom,
        } = this.props;
        const backgroundStyle = this.getBackgroundStyle();
        const titleColorStyle = this.getTitleColorStyle();
        const dividerStyle = needBorderBottom ? UIStyle.cellBorderBottom : null;

        const detailView =
        (<View style={[container, backgroundStyle, containerStyle, dividerStyle]}>
            <Text style={[UITextStyle.actionBodyMedium, titleColorStyle]} onPress={this.props.onPressTitle}>
                {title}
            </Text>
            <Text style={[UITextStyle.tertiaryCaptionRegular, UIStyle.marginTopTiny]}>
                {details}
            </Text>
        </View>);

        return (
            <TouchableOpacity onPress={() => onPress()}>
                {detailView}
            </TouchableOpacity>
        );
    }
}

DetailsCell.defaultProps = {
    title: '',
    details: '',
    containerStyle: {},
    needBorderBottom: false,
    firstCell: false,
    onPress: () => {},
    isTappable: false,
};
