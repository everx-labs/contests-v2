// @flow
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
    UIColor,
    UIConstant,
    UIStyle,
    UILink,
    UIGrid,
    UIGridColumn,
    UIButton,
    UIButtonGroup,
    UINavigationBar,
} from '../../services/UIKit/UIKit';
import type { NavigationProps } from '../../services/UIKit/UIKit';
import imgDiamondColored from '../../assets/manifest/gem-color.png';
import imgDiamond from '../../assets/manifest/gem.png';
import imgLaunch from '../../assets/manifest/launch.png';
import imgLive from '../../assets/manifest/live.png';

import Screen from '../Screen/Screen';
import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';
import GovernanceMenu from './helpers/GovernanceMenu';
import Configs from '../../configs';

type Props = NavigationProps;

type State = {
    gridColumns: number,
};

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
    // header: { marginTop: 4 },
    header: { height: 56 },
});

const LARGE_HEADER_HEIGHT = 240;
const LARGE_CONTENT_TOP_OFFSET = 176;
const NARROW_HEADER_HEIGHT = 80;
const BOTTOM_HEIGHT = 128;

export default class GovernanceScreen extends Screen<Props, State> {
    static createNavigationOptions() {
        return ({ navigation }) => {
            if (!navigation.state.params) {
                return null;
            }

            const {
                topBarHidden, topBarDivider, isNarrow,
            } = navigation.state.params;

            let dividerStyle = null;
            if (topBarDivider) {
                dividerStyle = styles.topDivider;
            }

            const isInitialScreen = navigation?.state?.routeName === 'ManifestInitialScreen';
            return {
                header: topBarHidden ? null : (
                    <UINavigationBar
                        containerStyle={[
                            UIStyle.width.full(),
                            styles.header,
                            dividerStyle,
                        ]}
                        headerLeft={Configs.isContests() ? (
                            <UIButtonGroup gutter={0} style={UIStyle.margin.leftSmall()}>
                                <Image source={imgDiamond} />
                                <GovernanceMenu
                                    narrow={isNarrow}
                                    navigation={navigation}
                                />
                            </UIButtonGroup>
                        ) :
                            (
                                <UILink
                                    title={TONLocalized.Contests.TONCommunity}
                                    icon={isInitialScreen ? imgDiamondColored : imgDiamond}
                                    iconStyle={[{ tintColor: isInitialScreen ? '' : UIColor.black() }]}
                                    iconHoverStyle={[{ tintColor: isInitialScreen ? '' : UIColor.primary() }]}
                                    textAlign={UILink.TextAlign.Left}
                                    textStyle={{ color: isInitialScreen ? UIColor.primary() : UIColor.black() }}
                                    textHoverStyle={{ color: UIColor.primary() }}
                                    buttonSize={UIButton.buttonSize.medium}
                                    disabled={isInitialScreen}
                                    onPress={isInitialScreen ? null : () => { navigation.navigate('ManifestInitialScreen'); }}
                                />
                            )}
                        headerRight={
                            <UILink
                                title="Free TON Forum"
                                href="https://forum.freeton.org"
                                target="_blank"
                                textStyle={{ color: UIColor.black() }}
                                textHoverStyle={{ color: UIColor.primary() }}
                                buttonSize={UIButton.buttonSize.medium}
                            />
                        }
                    />
                ),
            };
        };
    }

    constructor(props) {
        super(props);
        this.state = {
            gridColumns: 8,
            screenWidth: 0,
            scrollViewHeight: 0,
            scrollContentHeight: 0,
            contentWidth: 0,
            topBarDivider: false,
            scrollingToPosition: false,
        };
        this.grid = null;

        this.initMouseMoveListenerForWeb();
    }

    componentDidMount() {
        super.componentDidMount();
        const keyframes =
        `@-webkit-keyframes pulsate {
          from {
            opacity: 0.5;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(2);
          }
        }`;
        const styleSheet = document.styleSheets[0];
        styleSheet?.insertRule(keyframes, styleSheet.cssRules.length);
    }

    initMouseMoveListenerForWeb() {
        this.deinitMouseMoveListenerForWeb();
        this.clickListener = (e: any) => {
            const bubble = document.createElement('div');
            const clickCoords = [e.clientX, e.clientY];
            x = clickCoords[0] - 25,
            y = clickCoords[1] - 25;


            bubble.style.position = 'absolute';
            bubble.style.left = `${x}px`;
            bubble.style.top = `${y}px`;
            bubble.style.width = `${50}px`;
            bubble.style.height = `${50}px`;
            bubble.style.backgroundColor = UIColor.whiteLight();
            bubble.style.borderRadius = '25px';
            bubble.style.opacity = '0';
            // bubble.style.animationIterationCount: 'infinite',
            bubble.style.animationDuration = '.5s';
            bubble.style.animationName = 'pulsate';
            // bubble.style.animationTimingFunction = 'ease-out';

            const rootElement = document.getElementById('TONContainer');


            rootElement.appendChild(bubble);
            setTimeout(() => {
                rootElement.removeChild(bubble);
            }, 600);
        };
        window.addEventListener('click', this.clickListener);
    }

    deinitMouseMoveListenerForWeb() {
        if (!this.clickListener) {
            return;
        }
        window.removeEventListener('click', this.clickListener);
        this.clickListener = null;
    }

    onGridLayout = () => {
        if (this.grid) {
            this.setStateSafely({ gridColumns: this.grid.getColumns() });
            this.props.navigation.setParams({
                isLarge: this.isLarge(),
            });
        }
    }

    onRef = (ref) => {
        this.grid = ref;
    }

    isLarge() {
        return this.state.gridColumns === 8;
    }

    renderBottomButton() {
        return null;
    }

    renderBottom() {
        return (
            <UIGrid pointerEvents="box-none" type={UIGrid.Type.C8} style={{ marginTop: -BOTTOM_HEIGHT }}>
                <UIGridColumn medium={2} />
                <UIGridColumn medium={4}>
                    {this.renderBottomButton()}
                </UIGridColumn>
                <UIGridColumn medium={2} />
            </UIGrid>
        );
    }

    renderBottomNavigationBar() {
        return <View style={{ marginTop: BOTTOM_HEIGHT }} />;
    }

    renderFooter() {
        return null;
    }

    // virtual
    renderCenterColumn() {
        return null;
    }

    renderFullWidthContent = () => {
        return (
            <React.Fragment>
                <UIGrid
                    type={UIGrid.Type.C8}
                    style={{
                        backgroundColor: UIColor.white(),
                    }}
                    ref={this.onRef}
                    onLayout={this.onGridLayout}
                >
                    <UIGridColumn medium={2} />
                    <UIGridColumn medium={4}>
                        {this.renderCenterColumn()}
                    </UIGridColumn>
                    <UIGridColumn medium={2} />
                </UIGrid>
            </React.Fragment>
        );
    }
}
