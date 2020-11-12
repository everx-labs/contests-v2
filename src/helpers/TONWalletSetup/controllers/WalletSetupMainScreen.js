// // @flow
// import React from 'react';
// import { Platform, StyleSheet, View } from 'react-native';
// import { reaction } from 'mobx';
// import { observer } from 'mobx-react';
//
// import type { ViewStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
//
// import {
//     UIButton,
//     UIColor,
//     UITextButton,
//     UIConstant,
//     UILocalized,
//     UIStyle,
// } from '../../services/UIKit/UIKit';
//
// import TONAssets from '../../assets/TONAssets';
//
// import { ModalController, ModalPath } from '../../TONRootNavigator/modal';
//
// import TONLocalized from '../../TONLocalized';
//
// import { TONAsync } from '../../TONUtility';
//
// import { TONKeystore } from '../../TONWallet';
//
// import { securityCardManager } from '../../TONSecurityCard';
//
// import WelcomeHelper from '../helpers/WelcomeHelper';
//
// import WalletWelcomeView from '../components/WalletWelcomeView';
//
// import WalletSetupScreenBase, { WalletSetupScreens } from './WalletSetupTypes';
//
// import type { WelcomeItem } from '../helpers/WelcomeHelper';
//
// import type { NavigationProps } from '../../services/UIKit/UIKit';
//
// type Props = NavigationProps;
//
// type State = {
//     welcomeItems: ?WelcomeItem,
//     welcomeIndex: number,
//     generatingMasterKey: boolean,
// };
//
// const styleProperties = {
//     container: {
//         flex: 1,
//         padding: UIConstant.contentOffset(),
//         backgroundColor: UIColor.white(),
//     },
//     spaceSeparator: {
//         width: UIConstant.contentOffset(),
//     },
// };
//
// const styles = StyleSheet.create(styleProperties);
//
// let legalNotesConfirmed;
//
// @observer
// export default class WalletSetupMainScreen extends WalletSetupScreenBase<Props, State> {
//     static navigationOptions = WalletSetupScreenBase.createNavigationOptions(
//         '',
//         null, // set logo if needed,
//         Platform.OS === 'web', // shrink the navigation bar for web to help the modal screen
//     );
//
//     static defaultProps = {};
//
//     // constructor
//     constructor(props: Props) {
//         super(props);
//
//         this.state = {
//             welcomeItems: [],
//             welcomeIndex: 0,
//             generatingSeedPhrase: false,
//         };
//     }
//
//     componentDidMount() {
//         super.componentDidMount();
//         this.loadWelcomeItems();
//         this.welcomeItemsReloader = reaction(
//             () => securityCardManager.securityCardActivating,
//             () => this.loadWelcomeItems(),
//         );
//     }
//
//     componentWillFocus() {
//         super.componentWillFocus();
//         legalNotesConfirmed = false;
//     }
//
//     componentWillUnmount() {
//         super.componentWillUnmount();
//         if (this.welcomeItemsReloader) this.welcomeItemsReloader();
//     }
//
//     // Events
//     onButtonPress = () => {
//         const welcomeIndex = this.getWelcomeIndex();
//         const startIndex = this.getStartIndex();
//         if (welcomeIndex === startIndex) {
//             WelcomeHelper.rememberAsShown();
//             this.guardedAsyncNavigation(() => {
//                 ModalController.show(ModalPath.LegalNotes, {
//                     shouldConfirm: true,
//                     onConfirm: this.onConfirmLegalNotes,
//                     onDidHide: this.onLegalNotesHide,
//                 });
//             });
//         } else {
//             this.setWelcomeIndex(welcomeIndex + 1);
//         }
//     };
//
//     onTextButtonPress = () => {
//         const welcomeIndex = this.getWelcomeIndex();
//         const startIndex = this.getStartIndex();
//         if (welcomeIndex === startIndex) {
//             WelcomeHelper.rememberAsShown();
//             this.guardedAsyncNavigation(() => {
//                 this.navigateToRestoreScreen();
//             });
//         } else {
//             this.setWelcomeIndex(startIndex);
//         }
//     };
//
//     /* eslint-disable class-methods-use-this */
//     onConfirmLegalNotes = () => {
//         legalNotesConfirmed = true;
//         ModalController.hide(ModalPath.LegalNotes);
//     };
//
//     onLegalNotesHide = () => {
//         if (legalNotesConfirmed) {
//             this.startGenerateSeedPhrase();
//         }
//     };
//
//     // Setters
//     setGeneratingSeedPhrase(generatingSeedPhrase: boolean) {
//         this.setStateSafely({ generatingSeedPhrase });
//     }
//
//     setWelcomeItems(welcomeItems: WelcomeItem[]) {
//         this.setStateSafely({ welcomeItems });
//     }
//
//     setWelcomeIndex(welcomeIndex: number) {
//         if (this.welcomeView) {
//             this.welcomeView.changeIndex(welcomeIndex);
//         }
//         this.setStateSafely({ welcomeIndex });
//     }
//
//     // Getters
//     isGeneratingSeedPhrase(): boolean {
//         return this.state.generatingSeedPhrase;
//     }
//
//     getWelcomeItems(): WelcomeItem[] {
//         return this.state.welcomeItems;
//     }
//
//     getWelcomeIndex(): number {
//         return this.state.welcomeIndex;
//     }
//
//     getStartIndex(): number {
//         return this.getWelcomeItems().length - 1;
//     }
//
//     getButtonTitle(): string {
//         if (securityCardManager.securityCardActivating) {
//             return TONLocalized.setup.main.securityCard.create;
//         }
//         const welcomeIndex = this.getWelcomeIndex();
//         if (welcomeIndex === this.getStartIndex()) {
//             return TONLocalized.setup.main.wallet.create;
//         }
//         return UILocalized.Next;
//     }
//
//     getTextButtonTitle(): string {
//         if (securityCardManager.securityCardActivating) {
//             return TONLocalized.setup.main.securityCard.restore;
//         }
//         const welcomeIndex = this.getWelcomeIndex();
//         if (welcomeIndex === this.getStartIndex()) {
//             return TONLocalized.setup.main.wallet.restore;
//         }
//         return UILocalized.Skip;
//     }
//
//     getTextButtonStyle(): ViewStyleProp {
//         if (securityCardManager.securityCardActivating) {
//             return [UIStyle.margin.topDefault(), UIStyle.margin.bottomHuge()];
//         }
//         return UIStyle.common.flex();
//     }
//
//     getButtonStyle(): ViewStyleProp {
//         if (securityCardManager.securityCardActivating) {
//             return {};
//         }
//         const welcomeIndex = this.getWelcomeIndex();
//         if (welcomeIndex === this.getStartIndex()) {
//             return UIStyle.common.flex3();
//         }
//         return UIStyle.common.flex();
//     }
//
//     getButtonTestID(): string {
//         const welcomeIndex = this.getWelcomeIndex();
//         if (welcomeIndex === this.getStartIndex()) {
//             return 'create_wallet_button';
//         }
//         return 'next_welcome_button';
//     }
//
//     getTextButtonTestID(): string {
//         const welcomeIndex = this.getWelcomeIndex();
//         if (welcomeIndex === this.getStartIndex()) {
//             return 'restore_wallet_button';
//         }
//         return 'skip_welcome_button';
//     }
//
//     areButtonsDisabled(): boolean {
//         return !securityCardManager.securityCardActivating && !this.getWelcomeItems().length;
//     }
//
//     // Actions
//     loadWelcomeItems() {
//         (async () => {
//             const welcomeItems = securityCardManager.securityCardActivating
//                 ? [
//                     {
//                         icon: TONAssets.icoStartItem(),
//                         ...TONLocalized.setup.start.securityCard,
//                         content: this.renderRestoreButton(UITextButton.Align.Left),
//                     },
//                 ]
//                 : [
//                     // ...(await WelcomeHelper.getWelcomeItems()),
//                     {
//                         icon: TONAssets.icoStartItem(),
//                         ...TONLocalized.setup.start.wallet,
//                     },
//                 ];
//             this.setWelcomeItems(welcomeItems);
//         })();
//     }
//
//     async startGenerateSeedPhrase() {
//         this.setGeneratingSeedPhrase(true);
//         await TONAsync.timeout(1);
//         const seedPhrase = await TONKeystore.generateRandomSeed();
//         this.setGeneratingSeedPhrase(false);
//         this.navigateToCreateNewScreen(seedPhrase);
//     }
//
//     navigateToCreateNewScreen(seedPhrase: string) {
//         this.navigateToNextScreen(WalletSetupScreens.SetLocalPassword, {
//             seedPhrase,
//             isNewWallet: true,
//         });
//         /* this.navigateToNextScreen('WalletSetupNewKeyView', {
//             seedPhrase,
//             isNewWallet: true,
//         }); */
//     }
//
//     navigateToRestoreScreen() {
//         this.navigateToNextScreen(WalletSetupScreens.RestorePhrase);
//     }
//
//     // render
//     renderWelcomeView() {
//         const welcomeItems = this.getWelcomeItems();
//         return (<WalletWelcomeView
//             ref={component => { this.welcomeView = component; }}
//             items={welcomeItems}
//             onIndexChange={index => this.setWelcomeIndex(index)}
//         />);
//     }
//
//     renderCreateButton() {
//         return (
//             <UIButton
//                 testID={this.getButtonTestID()}
//                 title={this.getButtonTitle()}
//                 buttonSize={UIButton.ButtonSize.Large}
//                 buttonShape={UIButton.ButtonShape.Radius}
//                 style={this.getButtonStyle()}
//                 disabled={this.areButtonsDisabled()}
//                 showIndicator={this.isGeneratingSeedPhrase()}
//                 onPress={this.onButtonPress}
//             />
//         );
//     }
//
//     renderRestoreButton(align: string) {
//         return (
//             <UITextButton
//                 testID={this.getTextButtonTestID()}
//                 title={this.getTextButtonTitle()}
//                 align={align}
//                 buttonStyle={this.getTextButtonStyle()}
//                 disabled={this.areButtonsDisabled()}
//                 onPress={this.onTextButtonPress}
//             />
//         );
//     }
//
//     renderButtonsView() {
//         if (securityCardManager.securityCardActivating) {
//             return this.renderCreateButton();
//         }
//         return (
//             <View style={UIStyle.Common.centerLeftContainer()}>
//                 {this.renderCreateButton()}
//                 <View style={styles.spaceSeparator} />
//                 {this.renderRestoreButton(UITextButton.Align.Center)}
//             </View>
//         );
//     }
//
//     renderSafely() {
//         return (
//             <View style={styles.container}>
//                 {this.renderWelcomeView()}
//                 {this.renderButtonsView()}
//             </View>
//         );
//     }
// }
