// @flow
import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

import {
    UIConstant,
    UIComponent,
    UIStyle,
    UIColor,
    UITextButton,
    UICustomSheet,
    ReactNavigation,
    UIFeedback,
} from '../services/UIKit';

import TONLocalized from '../helpers/TONLocalized';
import TONLocalizedLegacy from '../TONLegalNotes/helpers/TONLocalized';
import NavigationLegacy from '../TONLegalNotes';
import FBFeedback from '../services/Firebase/FBFeedback';
import Firebase from '../services/Firebase';
import GA from '../helpers/GA';

const styles = StyleSheet.create({
    fixHeight: {
        height: UIConstant.bigCellHeight(),
    },
});

const footerTextStyle = [
    UIStyle.Color.textTertiary(),
    UIStyle.Text.tinyMedium(),
    UIStyle.Padding.default(),
];

const fixHeightCenterContainer = [
    styles.fixHeight,
    UIStyle.Common.centerLeftContainer(),
];

type Props = {
    isNarrow: boolean,
    icoCopyright: string,
    navigation: ReactNavigation,
};

type State = {};

export default class Footer extends UIComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.menuItems = [
            {
                title: TONLocalizedLegacy.PrivacyPolicy,
                onPress: () => NavigationLegacy.pushPrivacyPolicy(this.props.navigation),
            },
            {
                title: TONLocalizedLegacy.TermsOfUse,
                onPress: () => NavigationLegacy.pushTermsOfUse(this.props.navigation),
            },
            {
                title: TONLocalizedLegacy.CookiesPolicy,
                onPress: () => NavigationLegacy.pushCookiesPolicy(this.props.navigation),
            },
            {
                title: TONLocalized.Feedback,
                onPress: this.showIdeaFeedback,
            },
        ];

        this.menuItemsNarrow = [
            {
                title: TONLocalizedLegacy.LegalNotes,
                onPress: () => NavigationLegacy.pushPrivacyPolicy(this.props.navigation),
            },
            {
                title: TONLocalized.Feedback,
                onPress: this.showIdeaFeedback,
            },
        ];
    }

    sendToFreshdesk(email, feedback) {
        const ticketData = {
            name: 'tonlabs.io',
            email,
            feedback,
        };

        const sendTicketToFresh = Firebase.functions().httpsCallable('sendTicketToFresh');
        sendTicketToFresh({ ticket: ticketData })
            .then((result) => {
                // console.log('sendTicketToFresh result', result);
            })
            .catch((error) => {
                console.log('sendTicketToFresh error', error);
            });
    }

    sendToZendesk(email, feedback) {
        fetch('https://tonlabs.zendesk.com/api/v2/requests.json', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
                request: {
                    requester: { name: 'tonlabs.io' },
                    subject: 'feedback',
                    comment: { body: `${email}: ${feedback}` },
                },
            }),
        }).catch((error) => { console.log(error); });
    }

    onSubmitFeedBack = ({ email, feedback }: any) => {
        if (!email || !feedback) {
            return;
        }

        GA.sendFeedback(email);
        FBFeedback.add({ email, feedback });
        this.sendToFreshdesk(email, feedback);
        this.sendToZendesk(email, feedback);
    }

    showIdeaFeedback = () => {
        const feedbackComponent = (
            <UIFeedback
                onSubmitFeedBack={this.onSubmitFeedBack}
                ref={(component) => { this.ideaFeedback = component; }}
                numberOfLines={2}
            />
        );
        const onShow = () => {
            GA.showFeedbackForm();
            this.ideaFeedback.onShow();
        };

        UICustomSheet.show({
            component: feedbackComponent,
            onShow,
        });
    };

    renderLeft() {
        const menuItems = this.props.isNarrow ? this.menuItemsNarrow : this.menuItems;
        return (
            <View style={fixHeightCenterContainer}>
                {
                    menuItems.map(item => (
                        <UITextButton
                            key={item.title}
                            title={item.title}
                            textStyle={footerTextStyle}
                            textHoverStyle={UIColor.textPrimaryStyle()}
                            textTappedStyle={UIColor.textPrimaryStyle()}
                            onPress={item.onPress}
                        />
                    ))
                }
            </View>
        );
    }

    renderRight() {
        const iconStyle = [
            UIStyle.Color.getTintColorStyle(UIColor.textTertiary()),
            UIStyle.Margin.default(),
        ];
        return (
            <View style={fixHeightCenterContainer}>
                {
                    this.props.isNarrow ?
                        <Image source={this.props.icoCopyright} style={iconStyle} />
                        :
                        <Text style={footerTextStyle}>{TONLocalized.Copyright}</Text>
                }
            </View>
        );
    }

    render() {
        return (
            <View style={[UIStyle.Common.rowSpaceContainer(), styles.fixHeight]}>
                {this.renderLeft()}
                {this.renderRight()}
            </View>
        );
    }
}
