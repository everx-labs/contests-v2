// @flow
import React from 'react';
import { Image, Text, View, TouchableOpacity } from 'react-native';

import EnvManager from './EnvManager';
import { UIComponent, UIPopoverMenu, UIStyle } from '../../../services/UIKit/UIKit';
import dropDownIcon from '@uikit/assets/ico-unfold/ico-show.png';
import type { ReactNavigation } from '../../../services/UIKit/UIKit';

import Constant from '../../../helpers/Constant';

type Props = {
    routeName: string,
    narrow: boolean,
    navigation: ReactNavigation,
};

export default class GovernanceMenu extends UIComponent<Props, {}> {
    constructor(props: Props) {
        super(props);
        this.menuItems = EnvManager.governanceList()
            .map(key => ({
                title: EnvManager.governanceTitle(key),
                onPress: () => this.onPress(key),
            }));
    }

    navigateKey = (key: string) => {
        window.open(EnvManager.getGovernancePath(key), '_blank');
    }

    // Events
    onPress = (key: string) => {
        if (key !== EnvManager.getGovernance()) {
            this.navigateKey(key);
        }
    };

    // Getters
    getSelectedTitle() {
        return EnvManager.governanceTitle(EnvManager.getGovernance());
    }

    // Render
    render() {
        const selectedTitle = this.getSelectedTitle();

        const menuTrigger = (
            <View
                style={UIStyle.container.centerLeft()}
            >
                <Text
                    style={[UIStyle.text.primarySmallMedium(), UIStyle.margin.rightSmall()]}
                >
                    {this.getSelectedTitle()}
                </Text>
                <Image source={dropDownIcon} />
            </View>
        );

        return (
            <View
                style={[
                    UIStyle.container.centerLeft(),
                    UIStyle.padding.horizontal(),
                    UIStyle.height.defaultCell(),
                ]}
            >
                <UIPopoverMenu menuItems={this.menuItems} narrow={this.props.narrow} reversedColors>
                    {menuTrigger}
                </UIPopoverMenu>
            </View>
        );
    }
}
