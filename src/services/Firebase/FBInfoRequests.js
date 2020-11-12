import Firebase from './index';
import { timestampData } from './dataWrapper';

export default class FBInfoRequests {
    static PROPOSALS = 'proposals';
    static PROPOSALS_TEST = 'proposals_test';
    static PROPOSALS_WIKI = 'proposals_wiki';
    static PROPOSALS_WIKI_TEST = 'proposals_wiki_test';
    static PROPOSALS_KOREA = 'proposals_korea';
    static PROPOSALS_KOREA_TEST = 'proposals_korea_test';
    static PROPOSALS_DEFI = 'proposals_defi';
    static PROPOSALS_DEFI_TEST = 'proposals_defi_test';
    static PROPOSALS_AMBASSADOR = 'proposals_ambassador';
    static PROPOSALS_AMBASSADOR_TEST = 'proposals_ambassador_test';
    static PROPOSALS_SMM = 'proposals_smm';
    static PROPOSALS_SMM_TEST = 'proposals_smm_test';
    static PROPOSALS_DGO = 'proposals_dgo';
    static PROPOSALS_DGO_TEST = 'proposals_dgo_test';
    static PROPOSALS_ESPORTS = 'proposals_esorts';
    static PROPOSALS_ESPORTS_TEST = 'proposals_esports_test';
    static PROPOSALS_DEVEX = 'proposals_devex';
    static PROPOSALS_DEVEX_TEST = 'proposals_devex_test';
    static PROPOSALS_SUPPORT = 'proposals_support';
    static PROPOSALS_SUPPORT_TEST = 'proposals_support_test';
    static PROPOSALS_WD = 'proposals_wd';
    static PROPOSALS_WD_TEST = 'proposals_wd_test';

    static SUBMISSIONS = 'submissions';
    static SUBMISSIONS_TEST = 'submissions_test';
    static ERRORS = 'errors';
    static SUBGOVERNANCES = 'subgovernances';

    static getCollection(collectionName) {
        return Firebase.db.collection(collectionName);
    }

    static add(infoRequestData, infoRequestType) {
        const collection = FBInfoRequests.getCollection(infoRequestType);
        return collection.add(timestampData(infoRequestData));
    }
}
