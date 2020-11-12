// @flow
import React from 'react';
import { View } from 'react-native';
import PopupDialog from 'react-native-popup-dialog';

import {
    UIComponent,
    UIStyle,
    UIConstant,
    UIBackgroundView,
    UIController,
} from '../../services/UIKit/UIKit';

import type { NavigationProps } from '../../services/UIKit/UIKit';

export type PopupDialogProps = NavigationProps & {
    onHide?: () => void,
};

class PopupDialogScreen<Props, State>
    extends UIController<Props & PopupDialogProps, State> {
    // Constructor
    constructor(props: Props & PopupDialogProps) {
        super(props);
    }

    show() {
        setTimeout(() => { // in order to render
            if (this.dialog) {
                this.dialog.show();
            }
        }, 0);
    }

    hide = () => {
        setTimeout(() => { // in order to render
            if (this.dialog) {
                this.dialog.dismiss();
                this.props.onHide && this.props.onHide();
            }
        }, 0);
    }

    renderContent(): React$Node {
        return null;
    }

    render() {
        return (
            <PopupDialog
                ref={(popupDialog) => { this.dialog = popupDialog; }}
                width={1}
                height={1}
                containerStyle={this.props.containerStyle}
                dialogStyle={this.props.dialogStyle}
                animationDuration={UIConstant.animationDuration()}
                overlayBackgroundColor="transparent"
            >
                <View style={UIStyle.Common.flex()}>
                    <UIBackgroundView
                        presetName={this.presetName}
                    />
                    {this.renderContent()}
                </View>
            </PopupDialog>
        );
    }
}

export default PopupDialogScreen;

PopupDialogScreen.defaultProps = {
    onHide: () => {},
};
