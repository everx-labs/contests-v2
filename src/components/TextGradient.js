// @flow
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import {
    UIComponent,
    UIStyle,
} from '../services/UIKit';

type Props = {
  text: string,
  colorFrom: string,
  colorTo: string,
  fotStyle: any,
  length: ?number,
};
type State = {};

export default class TextGradient extends UIComponent<Props, State> {
    render() {
        const textArray = this.props.text.split('');
        return (
            <View>
                <View style={[UIStyle.common.flex(), UIStyle.common.flexRow(), UIStyle.common.flexRowWrap()]}>
                    {textArray.map((char, i) => {
                        return (
                            <Text key={`to-${char}-${i}`} style={[this.props.fontStyle, { color: this.props.colorTo }]}>{char}</Text>
                        );
                    })}
                </View>
                <View style={[
                    { position: 'absolute', top: 0 },
                    UIStyle.common.flex(),
                    UIStyle.common.flexRow(),
                    UIStyle.common.flexRowWrap(),
                ]}
                >
                    {textArray.map((char, i) => {
                        return (
                            <Text
                                style={[
                                    this.props.fontStyle,
                                    {
                                        color: this.props.colorFrom,
                                        opacity: (1 / (this.props.length || textArray.length)) * (i + 1),
                                    },
                                ]}
                                key={`from-${char}-${i}`}
                            >
                                {char}
                            </Text>
                        );
                    })}
                </View>
            </View>
        );
    }
}
