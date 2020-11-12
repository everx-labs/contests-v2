// @flow
import React from 'react';

import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    RefreshControl,
} from 'react-native';
import store from '../../store';

import {
    UIScreen,
    UIStyle,
    UIBottomBar,
    UIConstant,
    UICustomSheet,
    UIBackgroundView,
    UITextStyle,
    UINavigationBar,
    UITextButton,
    UIImageButton,
    UILocalized,
    UIFunction,
    UIColor,
    UINotice,
    UIEventHelper,
    UIButtonGroup,
    UILink,
} from '../../services/UIKit/UIKit';

import TopBar from '../../components/TopBar';
import TONLocalized from '../../helpers/TONLocalized';
import triangle from '../../assets/24.png';
import configs from '../../configs';

import {
    setBackgroundPreset,
    setMobile,
    setScreenWidth,
} from '../../actions/ControllerActions';

import type { CreateNavigationOptions } from '../../services/UIKit/UIKit';
import Constant from '../../helpers/Constant';

type ControllerProps = {};
type ControllerState = {
    searchExpression: string,
    topInset: number,
};

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
});

const wasShown = 'TON-labs-solutions-website-cookie-was-shown';

class Screen<Props, State>
    extends UIScreen<Props & ControllerProps, State & ControllerState> {
    constructor(props: Props & ControllerProps) {
        super(props);

        this.state = {
            screenWidth: 0,
            scrollViewHeight: 0,
            scrollContentHeight: 0,
            contentWidth: 0,
            topBarDivider: false,
            scrollingToPosition: false,
        };

        this.scrollingOffset = 0;
    }

    componentDidMount() {
        super.componentDidMount();
    }

    static get isOpenInIframe() {
        if (!window) {
            return false;
        }

        return window.parent !== window;
    }

    static get isOpenInMobileApp() {
        if (!window) {
            return true;
        }

        return window.ReactNativeWebView;
    }

    get isOpenInIframe() {
        return Screen.isOpenInIframe;
    }

    get isOpenInMobileApp() {
        return Screen.isOpenInMobileApp;
    }

    // Actions
    dispatchNarrow(narrow: boolean) {
        this.props.navigation.setParams({
            isNarrow: narrow,
        });
        store.dispatch(setMobile(narrow));
    }

    // Getters
    getContentWidth() {
        return this.state.contentWidth;
    }

    isNarrow() {
        return this.props.isNarrow;
    }

    // Events
    handleNavigation() {
        if (this.props.navigation) {
            this.props.navigation.setParams({
                ...this.props.navigation.state.params,
                theme: UIColor.Theme.Light,
                onPressMenu: () => this.scrollTo(0),
                isNarrow: this.isNarrow(),
            });
        }
    }

     onContentLayout = (e: any) => {
         const { height, width } = e.nativeEvent.layout;
         this.setStateSafely({ scrollContentHeight: height, contentWidth: width });
     }

     onScrollLayot = (e: any) => {
         this.setStateSafely({ scrollViewHeight: e.nativeEvent?.layout?.height });
     }

     onScroll = (e: any) => {
         const { contentOffset, contentSize } = e.nativeEvent;
         const topBarDivider = (contentOffset.y > 0);
         if (this.props.navigation.state.params.topBarDivider != topBarDivider) {
             this.props.navigation.setParams({ topBarDivider });
         }

         if (this.state.scrollingToPosition) {
             if (contentOffset.y === this.scrollingOffset) {
                 this.onScrollToCallback && this.onScrollToCallback();
             }
         }
     }

     renderAbsoluteContent() {
         return null;
     }

     renderBottom() {
         return null;
     }

     renderBottomNavigationBar() {
         return null;
     }

       // virtual
       renderFullWidthContent = () => {
           return null;
       }

       renderFooter() {
           return null;
       }

       isLoading() {
           return false;
       }

       renderLoading() {
           return (
               <View style={[
                   UIStyle.height.full(),
                   UIStyle.common.justifyCenter(),
                   UIStyle.common.alignCenter(),
               ]}
               >
                   <UILink
                       showIndicator
                       indicatorAnimation={UILink.Indicator.Round}
                       iconIndicator={triangle}
                   />
               </View>
           );
       }

       render() {
           if (this.isLoading()) {
               return this.renderLoading();
           }
           const contentStyle = this.isNarrow()
               ? UIStyle.paddingHorizontal
               : UIStyle.halfWidthContainer;

           const contentContainerStyle = [];
           if (!this.state.scrollViewHeight && !this.state.scrollContentHeight) {
               contentContainerStyle.push({ height: '100%' });
               contentContainerStyle.push(UIStyle.Common.justifySpaceBetween());
           } else if (this.state.scrollContentHeight <= this.state.scrollViewHeight) {
               // short page style
               contentContainerStyle.push({ height: this.state.scrollViewHeight });
               contentContainerStyle.push(UIStyle.Common.justifySpaceBetween());
           }

           return (
               <React.Fragment>
                   <View
                       style={UIStyle.Common.flex()}
                       onLayout={e => this.onScreenLayoutDefault(e)}
                   >
                       <ScrollView
                           onScroll={this.onScroll}
                           scrollEventThrottle={1}
                           onLayout={this.onScrollLayot}
                           ref={(component) => { this.scrollView = component; }}
                           style={[UIStyle.Common.flex()]}
                           contentContainerStyle={contentContainerStyle}
                       >
                           <View onLayout={this.onContentLayout} style={contentContainerStyle}>
                               {this.renderFullWidthContent()}
                               <View style={contentStyle}>
                                   {this.renderContent()}
                               </View>

                               <View>
                                   {this.renderBottomNavigationBar()}
                                   {this.renderFooter()}
                               </View>
                           </View>
                       </ScrollView>
                       {this.renderBottom()}
                       {this.renderAbsoluteContent()}
                   </View>
               </React.Fragment>
           );
       }
}

export default Screen;
