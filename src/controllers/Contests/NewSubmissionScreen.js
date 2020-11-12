import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, View, Text } from 'react-native';
import CryptoJS from 'crypto-js';

import {
    UIStyle,
    UIDetailsInput,
    UIUploadFileInput,
    UILinkInput,
    UIContractAddressInput,
    UILocalized,
    UIButton,
    UILink,
    UIColor,
    UIToastMessage,
    UINavigationBar,
    UIDetailsCheckbox,
} from '../../services/UIKit/UIKit';
import icoClose from '@uikit/assets/ico-close/close-blue.png';

import GovernanceScreen from './GovernanceScreen';
import EnvManager from './helpers/EnvManager';
import TONLocalized from '../../helpers/TONLocalized';
import FBStorage from '../../services/Firebase/FBStorage';
import FBInfoRequests from '../../services/Firebase/FBInfoRequests';
import Configs from '../../configs';
import SubmissionsFunctions from './SubmissionsFunctions';

const submissionPackage = require('./SubmissionPckg.js');

const PROPOSALS_TABLE = EnvManager.getProposalsTable();
const DOCUMENT_MAX_SIZE = 50000000;

const forumLink = EnvManager.isKorea() ? 'forum.tonkorea.org' : 'forum.freeton.org';

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

const getList = (snapshot) => {
    const list = [];
    snapshot.forEach(doc => list.push(doc.data()));
    return list;
};

class ManifestNewSubmissionScreen extends GovernanceScreen {
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
              submissionAddress: '',
              fileSubmission: null,
              discussionLink: '',
              contest: null,
              participantAddress: '',
              contactAddress: '',
              proccessing: false,
              waitForFBAuthAndSDK: false,
              gridColumns: 8,
              checkNotUSA: false,
          };
      }

      componentDidMount() {
          super.componentDidMount();
          this.tryAction();
      }

      componentDidUpdate(prevProps, prevState) {
          if (
              this.props.isLoggedIn &&
              prevProps.isLoggedIn !== this.props.isLoggedIn &&
              this.state.waitForFBAuthAndSDK
          ) {
              this.tryAction();
              this.setStateSafely({ waitForFBAuthAndSDK: false });
          }
      }

      tryAction() {
          let contest = null;
          const { proposalAddress } = this.getNavigationParams();

          if (this.props.isLoggedIn) {
              FBInfoRequests.getCollection(PROPOSALS_TABLE)
                  .where('proposalWalletAddress', '==', proposalAddress)
                  .get()
                  .then((snapshotProposals) => {
                      [contest] = getList(snapshotProposals);
                  })
                  .catch((error) => {
                      console.log('get contest error: ', error);
                  })
                  .finally(() => {
                      if (!contest) this.props.navigation.navigate('ErrorScreen');
                      this.setStateSafely({ contest });
                  });
          } else {
              this.setStateSafely({
                  waitForFBAuthAndSDK: true,
              });
          }
      }

      getSubmissionAddress() {
          return window.TONClient.crypto.ed25519Keypair()
              .then((keys) => {
                  return { submissionAddress: '', keyPublic: keys.public };
              })
              .catch((error) => {
                  console.log('getSubmissionAddress error: ', error);
              });
      }

      getFileSubmission() {
          return this.state.fileSubmission;
      }

      readFile(file: File, cb: (bytes: any) => void) {
          if (!file) {
              cb && cb(null);
              return;
          }
          const reader = new FileReader();
          reader.onloadend = (evt: any) => {
              cb && cb(evt.target.result);
          };
          reader.readAsArrayBuffer(file);
      }

      doesParticipantExist() {
          return new Promise(resolve => resolve(false));
      }

      onSubmit = () => {
          if (this.getFileSubmission() && this.getFileSubmission().size >= DOCUMENT_MAX_SIZE) {
              UIToastMessage.showMessage(UILocalized.FileIsTooBig);
              return;
          }

          this.setStateSafely({ proccessing: true });

          const { contest } = this.state;
          if (!contest) return;

          let success = false;

          this.readFile(this.getFileSubmission(), (fileBytes) => {
              this.doesParticipantExist()
                  .then((doesExist) => {
                      const fType = this.getFileSubmission().type;
                      // console.log('fType', fType);
                      if (fType !== 'application/pdf') {
                          throw new Error('Wrong file format, PDF required');
                      }
                      const blob = new Blob([fileBytes], { type: fType }); // 'application/pdf'
                      const uid = Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36);
                      // required UNIQUE filename in firebase storage:
                      const uniqName = `${uid}-${this.getFileSubmission().name}`;
                      return FBStorage.uploadDocument(blob, fType, uniqName);
                  })
                  .then((uploadedFileLink) => {
                      const discussionLink = this.state.discussionLink.startsWith(`https://${forumLink}`) ?
                          this.state.discussionLink :
                          `https://${forumLink}/${this.state.discussionLink}`;
                      const wordArray = CryptoJS.lib.WordArray.create(fileBytes);
                      const hash = CryptoJS.SHA256(wordArray).toString();
                      // console.log('SHA256 Checksum', `0x${hash}`);
                      return SubmissionsFunctions.submitSubmission(
                          contest.contestAddress,
                          this.state.participantAddress,
                          discussionLink,
                          uploadedFileLink,
                          `0x${hash}`,
                          this.state.contactAddress,
                      );
                  })
                  .then((result) => {
                      // console.log('submitSubmission ok', result);
                      success = true;
                      UIToastMessage.showMessage(TONLocalized.Contests.JoinRequestSent);
                  })
                  .catch((error) => {
                      console.log('submitSubmission error', error);
                      UIToastMessage.showMessage(error.message);
                  })
                  .finally(() => {
                      if (success) {
                          this.props.navigation.navigate(
                              'ProposalScreen',
                              { proposalAddress: this.state.contest.proposalWalletAddress },
                          );
                      }
                      this.setStateSafely({ proccessing: false });
                  });
          });
      }

      isSubmitDisabled() {
          const isValid =
              this.state.checkNotUSA &&
              this.state.fileSubmission &&
              this.state.discussionLink &&
              this.state.participantAddress && this.participantAddressRef.isAddressValid(this.state.participantAddress);
          return (!isValid);
      }

      onSubmitEditingName(ref) {
          if (ref === this.participantAddressRef) {
              this.contactAddressRef && this.contactAddressRef.focus();
          } else if (ref === this.contactAddressRef) {
              this.discussionLinkRef && this.discussionLinkRef.focus();
          } else if (ref === this.discussionLinkRef) {
              this.discussionLinkRef && this.discussionLinkRef.blur();
          }
      }

      renderCenterColumn = () => {
          const { contest } = this.state;
          return (
              <View>
                  <Text style={[UIStyle.text.primaryTitleBold(), styles.noLetterSpacing, UIStyle.margin.topVast()]}>
                      {TONLocalized.Contests.AddSubmission}
                  </Text>
                  <View style={UIStyle.margin.topHuge()}>
                      <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing]}>
                          {TONLocalized.Contests.Contest}
                      </Text>
                      <Text style={[UIStyle.text.primaryBodyRegular(), styles.noLetterSpacing, UIStyle.margin.topTiny()]}>
                          {contest?.title}
                      </Text>
                  </View>

                  <UIContractAddressInput
                      ref={(me) => { this.participantAddressRef = me; }}
                      value={this.state.participantAddress}
                      onChangeText={participantAddress => this.setStateSafely({ participantAddress })}
                      onSubmitEditing={() => this.onSubmitEditingName(this.participantAddressRef)}
                      placeholder={TONLocalized.Contests.FreetonWalletAddress}
                      verify
                  />
                  <UIContractAddressInput
                      ref={(me) => { this.contactAddressRef = me; }}
                      value={this.state.contactAddress}
                      onChangeText={contactAddress => this.setStateSafely({ contactAddress })}
                      onSubmitEditing={() => this.onSubmitEditingName(this.contactAddressRef)}
                      placeholder={TONLocalized.Contests.TonsurfAddressOptional}
                      verify
                      containerStyle={[UIStyle.margin.topSmall()]}
                  />
                  <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, { marginTop: 8 }]}>
                      {TONLocalized.Contests.AddressToContactYou}
                  </Text>
                  <UILinkInput
                      ref={(me) => { this.discussionLinkRef = me; }}
                      value={this.state.discussionLink}
                      returnKeyType="next"
                      placeholder={TONLocalized.Contests.SubmissionLink}
                      beginningTag={`https://${forumLink}/`}
                      onChangeText={(discussionLink) => { this.setStateSafely({ discussionLink }); }}
                      onSubmitEditing={() => this.onSubmitEditingName(this.discussionLinkRef)}
                      containerStyle={[{ height: 72 }, UIStyle.margin.topSmall()]}
                  />
                  <Text style={[UIStyle.text.tertiaryTinyRegular(), styles.noLetterSpacing, { marginTop: -8 }]}>
                      {`On ${forumLink}`}
                  </Text>
                  <UIUploadFileInput
                      uploadText={TONLocalized.Contests.AttachPDFText}
                      fileType="document"
                      onChangeFile={fileSubmission => this.setStateSafely({ fileSubmission })}
                      floatingTitleText={TONLocalized.Contests.AttachPDFText}
                      floatingTitle={!!this.state.fileSubmission}
                      containerStyle={[{ marginTop: 16 }]}
                  />

                  <UIDetailsCheckbox
                      details={TONLocalized.Contests.ISignedAndAgree}
                      onPress={() => { this.setStateSafely({ checkNotUSA: !this.state.checkNotUSA }); }}
                      active={this.state.checkNotUSA}
                      style={UIStyle.margin.topDefault()}
                      switcherPosition="left"
                  />

                  <UIButton
                      title={TONLocalized.Contests.Submit}
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

export default connect(mapStateToProps)(ManifestNewSubmissionScreen);
