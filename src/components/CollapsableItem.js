// @flow
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import {
    UIColor,
    UIComponent,
    UIStyle,
    UIActionImage,
    UIUnfold,
} from '../services/UIKit';

import icoExpand from '../assets/ico-expand.png';
import icoCollapse from '../assets/ico-collapse.png';

const styles = StyleSheet.create({
    //
});

type Props = {
  title: string,
  text: string,
};

type State = {
  unfolded: boolean,
};

export default class CollapsableItem extends UIComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            unfolded: false,
        };
    }
    onPress = (unfolded) => {
        this.setState({
            unfolded,
        });
    }
    render() {
        return (
            <UIUnfold
                style={UIStyle.Margin.topMedium()}
                size={UIUnfold.Size.L}
                titleHide={this.props.title}
                titleShow={this.props.title}
                unfolded={this.state.unfolded}
                onPress={this.onPress}
                content={
                    <Text style={[
                        UIStyle.Text.secondaryBodyRegular(),
                        UIStyle.Margin.topMedium(),
                        UIStyle.Margin.bottomDefault(),
                    ]}
                    >
                        {this.props.text}
                    </Text>
                }
            />
        );
    }
}
