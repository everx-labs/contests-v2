// @flow
import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';

import TONLocalized from '../../helpers/TONLocalized';

import {
    UIStyle,
    UIComponent,
    UIConstant,
    UITextButton,
    UIButtonGroup,
    UILink,
    UIColor,
} from '../../services/UIKit/UIKit';

const styles = StyleSheet.create({
    noLetterSpacing: { letterSpacing: 0 },
});

export default class TabbedBar extends UIComponent {
    constructor(props: Props) {
        super(props);
        this.menuItems = this.getMenuItems();
        this.state = {
        };
    }

    onMenuItemLayout(e: any, index: number) {
        const { width } = e.nativeEvent.layout;
        this.menuItems[index].width = width;
        /* if (this.checkAllItemsWidth()) {
            this.scrollToActiveItem();
        } */
    }

    // Getters
    getMenuItems() {
        return this.props.menuItems;
    }

    getActiveTabName() {
        return this.props.activeTab;
    }

    getScrollOffset(index: number) {
        let result = 0;
        for (let i = 0; i < index; i += 1) {
            result += this.menuItems[i].width;
        }
        return result;
    }

    getActiveIndex() {
        const i = this.menuItems.findIndex(tab => tab.tabName === this.getActiveTabName());
        if (i === -1) return 0;
    }

    // Actions
    scrollToActiveItem() {
        const activeIndex = this.getActiveIndex();
        const offset = this.getScrollOffset(activeIndex);
        this.flatList.scrollToOffset({
            animated: false,
            offset,
        });
    }

    renderMenuItem = ({ item, index }) => {
        const {
            title, note, tabName, onPress, icon, iconHover, link,
        } = item;
        const isActive = this.getActiveTabName() === tabName;
        const textStyle = isActive ? null : [UIStyle.text.primarySmallMedium(), styles.noLetterSpacing];
        const borderStyle = isActive ? UIStyle.border.bottomAction() : null;
        const marginRight = index === this.menuItems.length - 1
            ? null : UIStyle.margin.rightMedium();

        return (
            <View onLayout={e => this.onMenuItemLayout(e, index)}>
                <UIButtonGroup style={[marginRight]} gutter={8}>
                    {link ?
                        <UILink
                            title={title}
                            href={link}
                            target="_blank"
                            iconR={icon}
                            iconRHover={iconHover}
                            iconRStyle={{ tintColor: '' }}
                            iconRHoverStyle={{ tintColor: '' }}
                            textStyle={UIStyle.text.primarySmallMedium()}
                            textHoverStyle={[UIStyle.text.actionSmallMedium(), UIColor.actionTextPrimaryStyle()]}
                            style={{ marginLeft: -16 }}
                        /> :
                        <UITextButton
                            buttonStyle={[borderStyle]}
                            textStyle={textStyle}
                            title={title}
                            onPress={onPress}
                        />
                    }
                    {note &&
                    <Text style={[
                        UIStyle.text.tertiaryTinyRegular(),
                        styles.noLetterSpacing,
                    ]}
                    >
                        {note}
                    </Text>}
                </UIButtonGroup>
            </View>
        );
    }

    renderNavigationMenu() {
        return (
            <View>
                <FlatList
                    ref={(component) => { this.flatList = component; }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                        UIStyle.margin.bottomNormal(),
                    ]}
                    data={this.menuItems}
                    keyExtractor={item => `navigation-menu-item-${item.title}`}
                    renderItem={this.renderMenuItem}
                />
            </View>
        );
    }

    render() {
        return (
            <View
                style={[
                    UIStyle.common.backgroundTransparent(),
                    UIStyle.height.defaultCell(),
                    this.props.style,
                ]}
            >
                {this.renderNavigationMenu()}
            </View>
        );
    }
}
