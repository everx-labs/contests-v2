import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';

import {
    UIStyle,
    UIComponent,
    UIDetailsInput,
    UIDateInput,
    UIUploadFileInput,
    UILinkInput,
    UIContractAddressInput,
    UINumberInput,
    UIEmailInput,
    UILocalized,
    UIButton,
    UILink,
    UIColor,
    UIToastMessage,
    UIAlertView,
    UINavigationBar,
    UIDetailsCheckbox,
} from '../../services/UIKit/UIKit';
import icoClose from '@uikit/assets/ico-close/close-blue.png';

import GovernanceScreen from './GovernanceScreen';
import EnvManager from './helpers/EnvManager';
import TONLocalized from '../../helpers/TONLocalized';
import Constant from '../../helpers/Constant';
import FBInfoRequests from '../../services/Firebase/FBInfoRequests';
import FBStorage from '../../services/Firebase/FBStorage';
import Firebase from '../../services/Firebase';
import Configs from '../../configs';

const mltsgPackage = require('./SafeMultisigWallet.js');

const forumLink = EnvManager.isKorea() ? 'forum.tonkorea.org' : 'forum.freeton.org';

const PROPOSALS_TABLE = EnvManager.getProposalsTable();
const DOCUMENT_MAX_SIZE = 10000000;

const styles = StyleSheet.create({
    topDivider: {
        borderBottomWidth: 1,
        borderBottomColor: UIColor.whiteLight(),
    },
    noLetterSpacing: { letterSpacing: 0 },
});

const closeForm = (navigation) => {
    if (navigation.state?.params?.initialRoute) {
        navigation.navigate('ContestsScreen');
    } else {
        navigation.pop();
    }
};

class NewProposalScreen extends GovernanceScreen {
      static navigationOptions: CreateNavigationOptions = ({ navigation }) => {
          if (!navigation.state.params) return { header: null };
          const { topBarDivider } = navigation.state.params;
          const dividerStyle = topBarDivider ? styles.topDivider : null;
          return {
              header: (
                  <UINavigationBar
                      containerStyle={[
                          UIStyle.width.full(),
                          dividerStyle,
                      ]}
                      headerLeft={(
                          <UILink
                              textAlign={UILink.TextAlign.Left}
                              icon={icoClose}
                              title="Close"
                              onPress={() => closeForm(navigation)}
                              buttonSize={UIButton.buttonSize.medium}
                          />
                      )}
                  />
              ),
          };
      }

      constructor(props) {
          super(props);
          this.state = {
              title: '',
              fileProposal: null,
              discussionLink: '',
              proposalWalletAddress: 'Calculating...',
              judgeWalletAddress: Constant.juryWalletAddress(EnvManager.getGovernance()),
              proposalKey: '',
              proccessing: false,
              submitted: false,
              waitForFBAuthAndSDK: false,
              gridColumns: 8,
              isProposalOnly: false,
              contestDateStart: null,
              contestDuration: '',
              contestVotingDuration: '',
          };
      }

      componentDidMount() {
          super.componentDidMount();
          if (this.props.isLoggedIn) {
              this.getProposalAddress();
          } else {
              this.setStateSafely({
                  waitForFBAuthAndSDK: true,
              });
          }
      }

      componentDidUpdate(prevProps, prevState) {
          if (
              this.props.isLoggedIn &&
              prevProps.isLoggedIn !== this.props.isLoggedIn &&
              this.state.waitForFBAuthAndSDK
          ) {
              this.getProposalAddress();
              this.setStateSafely({ waitForFBAuthAndSDK: false });
          }
      }

      async getProposalAddress() {
          try {
              const keys = await window.TONClient.crypto.ed25519Keypair();
              const futureAddress = (await window.TONClient.contracts.createDeployMessage({
                  package: mltsgPackage,
                  constructorParams: { reqConfirms: 1, owners: [`0x${keys.public}`] },
                  keyPair: keys,
              })).address;
              this.setStateSafely({ proposalWalletAddress: futureAddress });
          } catch (error) {
              console.log('SDK error: ', error);
          }
      }

      stateToFB(fileLink) {
          const contestDateStart = this.state.contestDateStart;
          const contestDurationDate = this.getContestDurationDate();
          const contestVotingDurationDate = this.getContestVotingDurationDate();
          if (contestDateStart) {
              contestDateStart.setTime(contestDateStart.getTime() + contestDateStart.getTimezoneOffset() * 60 * 1000);
          }
          if (contestDurationDate) {
              contestDurationDate.setTime(contestDurationDate.getTime() + contestDurationDate.getTimezoneOffset() * 60 * 1000);
          }
          if (contestVotingDurationDate) {
              contestVotingDurationDate.setTime(contestVotingDurationDate.getTime() + contestVotingDurationDate.getTimezoneOffset() * 60 * 1000);
          }

          return {
              title: this.state.title,
              proposalFile: fileLink,
              discussionLink: this.state.discussionLink,
              proposalWalletAddress: this.state.proposalWalletAddress,
              judgeWalletAddress: this.state.judgeWalletAddress,
              proposalKey: this.state.proposalKey,
              isProposalOnly: this.state.isProposalOnly,
              contestDateStart,
              contestDurationDate,
              contestVotingDurationDate,
              contestDuration: this.state.contestDuration,
              contestVotingDuration: this.state.contestVotingDuration,
          };
      }

      getFileProposal() {
          return this.state.fileProposal;
      }

      readFile(file: File, cb: (bytes: any) => void) {
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = (evt: any) => {
              cb && cb(evt.target.result);
          };
          reader.readAsArrayBuffer(file);
      }

      onSubmit = () => {
          if (this.getFileProposal() && this.getFileProposal().size >= DOCUMENT_MAX_SIZE) {
              UIAlertView.showAlert(UILocalized.Error, UILocalized.FileIsTooBig, [{
                  title: UILocalized.OK,
                  onPress: () => {},
              }]);
              return;
          }

          this.setStateSafely({ proccessing: true });

          const checkProposalKey = Firebase.functions().httpsCallable('checkProposalKey');
          checkProposalKey({ proposalKey: this.state.proposalKey, governance: EnvManager.getGovernance() })
              .then((result) => {
                  if (!result.data.success) {
                      // this.setStateSafely({ proposalKeyWrong: true });
                      throw new Error('Wrong proposal key');
                  }
                  this.readFile(this.getFileProposal(), (fileBytes) => {
                      const blob = new Blob([fileBytes], { type: this.getFileProposal().type }); // 'application/pdf'
                      const uid = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
                      FBStorage.uploadDocument(
                          blob, this.getFileProposal().type,
                          // required UNIQUE filename in firebase storage:
                          `${uid}-${this.getFileProposal().name}`,
                      ).then((fileLink) => {
                          return FBInfoRequests.add(this.stateToFB(fileLink), PROPOSALS_TABLE);
                      }).then(() => {
                          UIToastMessage.showMessage(TONLocalized.Contests.JoinRequestSent);
                          // this.props.navigation.navigate('ManifestSuccessCreateProposalScreen');
                      }).finally(() => {
                          this.setStateSafely({ proccessing: false, submitted: true });
                      });
                  });
              })
              .catch((error) => {
                  console.log('Error: ', error);
                  UIToastMessage.showMessage(`Failed: ${error.message}`);
                  this.setStateSafely({ proccessing: false });
              });
      }

      isSubmitDisabled() {
          const isValid =
              this.state.title &&
              this.state.fileProposal &&
              this.state.discussionLink && this.state.discussionLink.includes(forumLink) &&
              this.state.proposalWalletAddress && this.proposalWalletAddressRef.isAddressValid(this.state.proposalWalletAddress) &&
              this.state.proposalKey && (
                  this.state.isProposalOnly ||
                  this.state.contestDateStart && this.state.contestDuration && this.state.contestVotingDuration
              );
          return (!isValid || this.state.submitted);
      }

      onSubmitEditingName(ref) {
          if (ref === this.titleRef) {
              if (this.discussionLinkRef) {
                  this.discussionLinkRef.focus();
              }
          } else if (ref === this.discussionLinkRef) {
              if (this.proposalWalletAddressRef) {
                  this.proposalWalletAddressRef.focus();
              }
          } else if (ref === this.proposalWalletAddressRef) {
              if (this.proposalKeyRef) {
                  this.proposalKeyRef.focus();
              }
          } else if (ref === this.proposalKeyRef) {
              if (this.proposalKeyRef) {
                  this.proposalKeyRef.blur();
              }
          }
      }

      getContestDateString(date) {
          const timeZone = 'UTC';
          const params = { month: 'short', day: 'numeric', timeZone };
          const dayStr = date.toLocaleDateString('en-US', params);
          const yearStr = date.toLocaleDateString('en-US', { year: 'numeric', timeZone });
          const timeStr = date.toLocaleTimeString(
              'en-GB',
              { hour: '2-digit', minute: '2-digit', timeZone },
          );
          const dateStr = `${dayStr}, ${yearStr}, ${timeStr} UTC/GMT`;
          return dateStr;
      }

      getContestDurationDate() {
          if (!this.state.contestDateStart || !this.state.contestDuration) { return null; }

          return new Date(this.state.contestDateStart.getTime() +
              this.state.contestDuration * 24 * 60 * 60 * 1000
              - 60 * 1000);
      }

      getContestVotingDurationDate() {
          if (!this.state.contestDateStart || !this.state.contestDuration || !this.state.contestVotingDuration) { return null; }

          return new Date(this.state.contestDateStart.getTime() +
              this.state.contestDuration * 24 * 60 * 60 * 1000 +
              this.state.contestVotingDuration * 24 * 60 * 60 * 1000
            - 60 * 1000);
      }

      renderDate() {
          const currentDate = new Date();
          const maxYear = currentDate.getFullYear() + 1;
          const maxDate = new Date(maxYear, currentDate.getMonth());
          return (
              <UIDateInput
                  value={this.state.contestDateStart}
                  placeholder="Start date"
                  needBorderBottom
                  onChangeDate={(contestDateStart) => {
                      const contestDateStartUTC = new Date();
                      contestDateStartUTC.setUTCFullYear(
                          contestDateStart.getFullYear(),
                          contestDateStart.getMonth(),
                          contestDateStart.getDate(),
                      );
                      contestDateStartUTC.setUTCHours(
                          EnvManager.isKorea() ? 15 : 0,
                          0,
                          0,
                          0,
                      );
                      this.setStateSafely({ contestDateStart: contestDateStartUTC });
                  }}
                  validateRange={[currentDate, maxDate]}
                  separator="."
                  dateComponents={['day', 'month', 'year']}
                  containerStyle={[{ height: 72 }]}
              />
          );
      }

      renderCenterColumn = () => {
          return (
              <View>
                  <Text style={[UIStyle.text.primaryTitleBold(), styles.noLetterSpacing, UIStyle.margin.topVast(), UIStyle.margin.bottomHuge()]}>
                      {TONLocalized.Contests.MakeProposal}
                  </Text>

                  <UIContractAddressInput
                      ref={(me) => { this.proposalWalletAddressRef = me; }}
                      value={this.state.proposalWalletAddress}
                      onChangeText={proposalWalletAddress => this.setStateSafely({ proposalWalletAddress })}
                      onSubmitEditing={() => this.onSubmitEditingName(this.proposalWalletAddressRef)}
                      placeholder={TONLocalized.Contests.ProposalWalletAddress}
                      verify
                      editable={false}
                      hideBottomLine
                      containerStyle={[UIStyle.margin.topSmall()]}
                  />

                  <UIDetailsInput
                      ref={(me) => { this.titleRef = me; }}
                      value={this.state.title}
                      returnKeyType="next"
                      placeholder={TONLocalized.Contests.ProposalTitle}
                      onChangeText={(title) => { this.setStateSafely({ title }); }}
                      onSubmitEditing={() => this.onSubmitEditingName(this.titleRef)}
                      containerStyle={[{ height: 72 }, UIStyle.margin.topDefault()]}
                  />

                  <UIDetailsInput
                      ref={(me) => { this.discussionLinkRef = me; }}
                      value={this.state.discussionLink}
                      returnKeyType="next"
                      placeholder={TONLocalized.Contests.DiscussionLink}
                      onChangeText={(discussionLink) => { this.setStateSafely({ discussionLink }); }}
                      onSubmitEditing={() => this.onSubmitEditingName(this.discussionLinkRef)}
                      containerStyle={[{ height: 72 }]}
                  />
                  <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, { marginTop: -8 }]}>{`On ${forumLink}`}</Text>

                  <UIDetailsInput
                      ref={(me) => { this.proposalKeyRef = me; }}
                      value={this.state.proposalKey}
                      placeholder={TONLocalized.Contests.ProposalKey}
                      onChangeText={(proposalKey) => { this.setStateSafely({ proposalKey }); }}
                      onSubmitEditing={() => this.onSubmitEditingName(this.proposalKeyRef)}
                      rightComponent={true ? null : <UILink title={TONLocalized.Contests.NoProposalKey} href="https://?" style={{ padding: 0, height: 32 }} />}
                      containerStyle={[{ height: 72, marginTop: 20 }]}
                  />

                  <UIUploadFileInput
                      uploadText={TONLocalized.Contests.AttachPDFText}
                      fileType="document"
                      onChangeFile={fileProposal => this.setStateSafely({ fileProposal })}
                      floatingTitleText={TONLocalized.Contests.AttachPDFText}
                      floatingTitle={!!this.state.fileProposal}
                      containerStyle={[]}
                  />

                  <UIDetailsCheckbox
                      details="Make a contest"
                      onPress={() => { this.setStateSafely({ isProposalOnly: !this.state.isProposalOnly }); }}
                      iconInactive={null}
                      active={!this.state.isProposalOnly}
                      style={UIStyle.margin.topDefault()}
                      switcherPosition="left"
                  />

                  {!this.state.isProposalOnly &&
                      <View>
                          <View style={UIStyle.margin.topHuge()} />
                          {this.renderDate()}
                          <UIDetailsInput
                              value={this.state.contestDuration}
                              placeholder="Duration of contest (days)"
                              onChangeText={(duration) => {
                                  const contestDuration = duration.split('').filter(c => '1234567890'.includes(c)).join('');
                                  this.setStateSafely({ contestDuration });
                              }}
                              rightComponent={this.state.contestDuration && this.state.contestDateStart ?
                                  <Text style={[UIStyle.text.secondaryCaptionRegular()]}>
                                      {this.getContestDateString(this.getContestDurationDate())}
                                  </Text> : null}
                              containerStyle={[{ height: 72, marginTop: 20 }]}
                          />
                          <UIDetailsInput
                              value={this.state.contestVotingDuration}
                              placeholder="Duration of voting (days)"
                              onChangeText={(duration) => {
                                  const contestVotingDuration = duration.split('').filter(c => '1234567890'.includes(c)).join('');
                                  this.setStateSafely({ contestVotingDuration });
                              }}
                              rightComponent={this.state.contestDuration && this.state.contestDateStart && this.state.contestVotingDuration ?
                                  <Text style={[UIStyle.text.secondaryCaptionRegular()]}>
                                      {this.getContestDateString(this.getContestVotingDurationDate())}
                                  </Text> : null}
                              containerStyle={[{ height: 72, marginTop: 20 }]}
                          />
                      </View>
                  }

                  <UIButton
                      title={TONLocalized.Contests.Create}
                      buttonSize={UIButton.ButtonSize.Large}
                      style={[UIStyle.margin.topHuge(), UIStyle.margin.bottomHuge()]}
                      onPress={this.onSubmit}
                      disabled={this.isSubmitDisabled()}
                      showIndicator={this.state.proccessing}
                  />
              </View>
          );
      }
}

const mapStateToProps = (state, ownProps) => {
    return ({
        isNarrow: state.controller.mobile,
        isLoggedIn: state.auth.isLoggedIn,
        ...ownProps,
    });
};

export default connect(mapStateToProps)(NewProposalScreen);
