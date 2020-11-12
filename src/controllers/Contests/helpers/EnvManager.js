import Constant from '../../../helpers/Constant';
import TONLocalized from '../../../helpers/TONLocalized';
import Configs from '../../../configs';
import FBInfoRequests from '../../../services/Firebase/FBInfoRequests';

const GOV_TABLES = Configs.isContestsTest() ? {
    [Constant.governanceFreeton()]: FBInfoRequests.PROPOSALS_TEST,
    [Constant.governanceWiki()]: FBInfoRequests.PROPOSALS_WIKI_TEST,
    [Constant.governanceKorea()]: FBInfoRequests.PROPOSALS_KOREA_TEST,
    [Constant.governanceDefi()]: FBInfoRequests.PROPOSALS_DEFI_TEST,
    [Constant.governanceAmbassador()]: FBInfoRequests.PROPOSALS_AMBASSADOR_TEST,
    [Constant.governanceSmm()]: FBInfoRequests.PROPOSALS_SMM_TEST,
    [Constant.governanceDgo()]: FBInfoRequests.PROPOSALS_DGO_TEST,
    [Constant.governanceEsports()]: FBInfoRequests.PROPOSALS_ESPORTS_TEST,
    [Constant.governanceDevex()]: FBInfoRequests.PROPOSALS_DEVEX_TEST,
    [Constant.governanceSupport()]: FBInfoRequests.PROPOSALS_SUPPORT_TEST,
    [Constant.governanceWd()]: FBInfoRequests.PROPOSALS_WD_TEST,
} : {
    [Constant.governanceFreeton()]: FBInfoRequests.PROPOSALS,
    [Constant.governanceWiki()]: FBInfoRequests.PROPOSALS_WIKI,
    [Constant.governanceKorea()]: FBInfoRequests.PROPOSALS_KOREA,
    [Constant.governanceDefi()]: FBInfoRequests.PROPOSALS_DEFI,
    [Constant.governanceAmbassador()]: FBInfoRequests.PROPOSALS_AMBASSADOR,
    [Constant.governanceSmm()]: FBInfoRequests.PROPOSALS_SMM,
    [Constant.governanceDgo()]: FBInfoRequests.PROPOSALS_DGO,
    [Constant.governanceEsports()]: FBInfoRequests.PROPOSALS_ESPORTS,
    [Constant.governanceDevex()]: FBInfoRequests.PROPOSALS_DEVEX,
    [Constant.governanceSupport()]: FBInfoRequests.PROPOSALS_SUPPORT,
    [Constant.governanceWd()]: FBInfoRequests.PROPOSALS_WD,
};

const GOV_TG = {
    [Constant.governanceWiki()]: 'https://t.me/freeton_wiki',
    [Constant.governanceKorea()]: 'https://t.me/tonkoreaorg',
    [Constant.governanceDefi()]: 'https://t.me/tondefi',
    [Constant.governanceAmbassador()]: 'https://t.me/freeton_ambassadors',
    [Constant.governanceSmm()]: 'https://t.me/freeton_smm',
    [Constant.governanceDgo()]: null,
    [Constant.governanceEsports()]: 'https://t.me/FreeTONGameTournaments',
    [Constant.governanceDevex()]: 'https://t.me/freeton_dev_exp',
    [Constant.governanceSupport()]: 'https://t.me/freeton_analytics',
    [Constant.governanceWd()]: 'https://t.me/web_design_subgov',
};

const GOV_PATHES = {
    [Constant.governanceFreeton()]: 'https://gov.freeton.org',
    [Constant.governanceWiki()]: 'https://wiki.gov.freeton.org',
    [Constant.governanceKorea()]: 'https://korea.gov.freeton.org',
    [Constant.governanceDefi()]: 'https://defi.gov.freeton.org',
    [Constant.governanceAmbassador()]: 'https://ambassador.gov.freeton.org',
    [Constant.governanceSmm()]: 'https://smm.gov.freeton.org',
    [Constant.governanceDgo()]: 'https://dgo.gov.freeton.org',
    [Constant.governanceEsports()]: 'https://esports.gov.freeton.org',
    [Constant.governanceDevex()]: 'https://devex.gov.freeton.org',
    [Constant.governanceSupport()]: 'https://support.gov.freeton.org',
    [Constant.governanceWd()]: 'https://wd.gov.freeton.org',
};

const GOV_TITLES = {
    [Constant.governanceFreeton()]: TONLocalized.Contests.FreetonGovernance,
    [Constant.governanceWiki()]: TONLocalized.Contests.WikiSubgovernance,
    [Constant.governanceKorea()]: TONLocalized.Contests.KoreaSubgovernance,
    [Constant.governanceDefi()]: TONLocalized.Contests.DefiSubgovernance,
    [Constant.governanceAmbassador()]: TONLocalized.Contests.AmbassadorSubgovernance,
    [Constant.governanceSmm()]: TONLocalized.Contests.SmmSubgovernance,
    [Constant.governanceDgo()]: TONLocalized.Contests.DgoSubgovernance,
    [Constant.governanceEsports()]: TONLocalized.Contests.EsportsSubgovernance,
    [Constant.governanceDevex()]: TONLocalized.Contests.DevexSubgovernance,
    [Constant.governanceSupport()]: TONLocalized.Contests.SupportSubgovernance,
    [Constant.governanceWd()]: TONLocalized.Contests.WdSubgovernance,
};

const GOV_PAGE_TITLES = {
    [Constant.governanceFreeton()]: TONLocalized.Contests.FreetonGovernance,
    [Constant.governanceWiki()]: TONLocalized.Contests.FreetonWiki,
    [Constant.governanceKorea()]: TONLocalized.Contests.FreetonKorea,
    [Constant.governanceDefi()]: TONLocalized.Contests.FreetonDefi,
    [Constant.governanceAmbassador()]: TONLocalized.Contests.FreetonAmbassador,
    [Constant.governanceSmm()]: TONLocalized.Contests.FreetonSmm,
    [Constant.governanceDgo()]: TONLocalized.Contests.FreetonDgo,
    [Constant.governanceEsports()]: TONLocalized.Contests.FreetonEsports,
    [Constant.governanceDevex()]: TONLocalized.Contests.FreetonDevex,
    [Constant.governanceSupport()]: TONLocalized.Contests.FreetonSupport,
    [Constant.governanceWd()]: TONLocalized.Contests.FreetonWd,
};

export default class EnvManager {
    static getProposalsTable(key = null) {
        return GOV_TABLES[key || EnvManager.getGovernance()];
    }

    static governanceList() {
        return [
            Constant.governanceFreeton(),
            Constant.governanceWiki(),
            Constant.governanceKorea(),
            Constant.governanceDefi(),
            Constant.governanceAmbassador(),
            Constant.governanceSmm(),
            Constant.governanceDgo(),
            Constant.governanceEsports(),
            Constant.governanceDevex(),
            Constant.governanceSupport(),
            Constant.governanceWd(),
        ];
    }

    static getTelegramGroup(key) {
        return GOV_TG[key];
    }

    static governancePageTitle(key) {
        return GOV_PAGE_TITLES[key];
    }

    static governanceTitle(key) {
        return GOV_TITLES[key];
    }

    static getGovernance() {
        // return Constant.governanceWiki();
        // return Constant.governanceKorea();
        // return Constant.governanceAmbassador();
        // return Constant.governanceSmm();
        // return Constant.governanceDgo();
        // return Constant.governanceEsports();
        // return Constant.governanceDevex();
        if (window.location.origin.includes('wiki')) return Constant.governanceWiki();
        if (window.location.origin.includes('korea')) return Constant.governanceKorea();
        if (window.location.origin.includes('defi')) return Constant.governanceDefi();
        if (window.location.origin.includes('ambassador')) return Constant.governanceAmbassador();
        if (window.location.origin.includes('smm')) return Constant.governanceSmm();
        if (window.location.origin.includes('dgo')) return Constant.governanceDgo();
        if (window.location.origin.includes('esports')) return Constant.governanceEsports();
        if (window.location.origin.includes('devex')) return Constant.governanceDevex();
        if (window.location.origin.includes('support')) return Constant.governanceSupport();
        if (window.location.origin.includes('wd')) return Constant.governanceWd();
        return Constant.governanceFreeton();
    }

    static getGovernancePath(key) {
        return GOV_PATHES[key];
    }

    static isFreeton() {
        return this.getGovernance() === Constant.governanceFreeton();
    }

    static isWiki() {
        return this.getGovernance() === Constant.governanceWiki();
    }

    static isKorea() {
        return this.getGovernance() === Constant.governanceKorea();
    }

    static isDefi() {
        return this.getGovernance() === Constant.governanceDefi();
    }

    static isAmbassador() {
        return this.getGovernance() === Constant.governanceAmbassador();
    }

    static isSmm() {
        return this.getGovernance() === Constant.governanceSmm();
    }

    static isDgo() {
        return this.getGovernance() === Constant.governanceDgo();
    }

    static isEsports() {
        return this.getGovernance() === Constant.governanceEsports();
    }

    static isDevex() {
        return this.getGovernance() === Constant.governanceDevex();
    }

    static isSupport() {
        return this.getGovernance() === Constant.governanceSupport();
    }

    static isWd() {
        return this.getGovernance() === Constant.governanceWd();
    }
}
