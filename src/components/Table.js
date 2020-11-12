// @flow
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import {
    UIComponent,
    UIStyle,
    UIColor,
} from '../services/UIKit';

const styles = StyleSheet.create({
    tableItem: {
        paddingTop: 12,
        paddingBottom: 12,
        borderTopColor: UIColor.whiteLight(),
    },
});

export default class Table extends UIComponent {
    render() {
        if (!this.props.items || !this.props.items.length) return null;
        return (
            <View style={this.props.style}>
                {this.props.items.map((text, rank) => (
                    <View
                        style={[styles.tableItem, { borderTopWidth: rank === 0 ? 0 : 1 }]}
                        key={rank}
                    >
                        {
                            typeof (text) === 'string' ?
                                <Text style={[UIStyle.text.secondaryBodyRegular()]}>{text}</Text> :
                                text
                        }
                    </View>
                ))}
            </View>
        );
    }
}
