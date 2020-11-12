import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import {
    UILabel,
    UIComponent,
    UIStyle,
    UIFont,
} from '../services/UIKit';

const MIN_VALUECARD_WIDTH = 150;

const styles = StyleSheet.create({
    highlightsItemContainer: {
        minWidth: MIN_VALUECARD_WIDTH,
    },
});

export default class ValueCard extends UIComponent {
    render() {
        return (
            <View style={[styles.highlightsItemContainer, this.props.style]}>
                <UILabel
                    useDefaultSpace
                    text={this.props.title}
                    role="title"
                />
                <Text style={[UIFont.bodyRegular(), UIStyle.margin.topDefault()]}>
                    {this.props.details}
                </Text>
            </View>
        );
    }
}
