import Configs from '../configs';

const PATH_TG_TONDEV = 'https://t.me/TON_DEV';
const PATH_TG_TONLABS = 'https://t.me/tonlabs';
const PATH_TONDEV = 'https://ton.dev';
const PATH_TONSPACE = 'https://ton.space';
const PATH_TONSURF = 'https://ton.surf';
const PATH_GRAMSCAN = 'https://gramscan.io';
const PATH_TWITTER_TONLABS = 'https://twitter.com/tonlabs';
const PATH_GITHAB_TONLABS = 'https://github.com/tonlabs/';
const PATH_YOUTUBE = 'https://www.youtube.com/watch?v=NrbvU5j-9Yw';

const FREETON_JURY_ADDRESS = Configs.isContestsTest() ? '0:5fcc2bedb0854de24af59069c2b19f94c1f401fb861838f8be8f0aafc039a343' : '0:582b1d3427aa9ace29eb2748ccedf7ae291852d5458dc7931da000af18996ac5';// '0:46402089c4c830633fa87a814786b047b7b69244d1aff7c9b02c1d1e5005312e';
const WIKI_JURY_ADDRESS = '0:3c2795cedbc89270f46653812cf02d0ce52068fd498ca450d49cd8b1ddc7f6ac';
const KOREA_JURY_ADDRESS = '0:923054b68abfd02396697318d5a5b871b092199aff4c845b0457924c26caa737';
const DEFI_JURY_ADDRESS = '0:595c8aa8919687951ecc5f783d87a22ae4e78df744c3c9ccea8f3f54d5b30e51';
const AMBASSADOR_JURY_ADDRESS = '0:e50db524fc6f095d76cfd252ea2e831e7a14e9e518848103ff5d11f89078d923';
const SMM_JURY_ADDRESS = '0:aaaaec8853e687857898a94728a44293c59f02ae3afe95ad117f95de932dd1dc';
const DGO_JURY_ADDRESS = '0:159142dd37c0e6b6c5a243c7cdd7a9675e9ddebb0153e7469b9c300a577adcd3';
const ESPORTS_JURY_ADDRESS = '0:7e1cd60316d9578b3567d75f39d0efc6b0c533a829f22853b4ea27c0e1dd17a8';
const DEVEX_JURY_ADDRESS = '0:5ac0c98e728dd15ab54dda84f48b90ed1d205a3e6317aaf407eccf4fc46cfef2';
const SUPPORT_JURY_ADDRESS = '0:6634c7290e059649a5c539123ef1a1da3ab5d59a3d0b9b5e1bb3cab2a7575f4e';
const WD_JURY_ADDRESS = '0:ac83ade89453722bc0df26fa816ac2639310a9b8563b3011a3e24e2fa9978e27';

const GOV_FREETON = 'freeton';
const GOV_WIKI = 'wiki';
const GOV_KOREA = 'korea';
const GOV_DEFI = 'defi';
const GOV_AMBASSADOR = 'ambassador';
const GOV_SMM = 'smm';
const GOV_DGO = 'dgo';
const GOV_ESPORTS = 'esports';
const GOV_DEVEX = 'devex';
const GOV_SUPPORT = 'support';
const GOV_WD = 'wd';

const JURY_ADDRESS = {
    [GOV_FREETON]: FREETON_JURY_ADDRESS,
    [GOV_WIKI]: WIKI_JURY_ADDRESS,
    [GOV_KOREA]: KOREA_JURY_ADDRESS,
    [GOV_DEFI]: DEFI_JURY_ADDRESS,
    [GOV_AMBASSADOR]: AMBASSADOR_JURY_ADDRESS,
    [GOV_SMM]: SMM_JURY_ADDRESS,
    [GOV_DGO]: DGO_JURY_ADDRESS,
    [GOV_ESPORTS]: ESPORTS_JURY_ADDRESS,
    [GOV_DEVEX]: DEVEX_JURY_ADDRESS,
    [GOV_SUPPORT]: SUPPORT_JURY_ADDRESS,
    [GOV_WD]: WD_JURY_ADDRESS,
};

export default class Constant {
    static governanceFreeton() {
        return GOV_FREETON;
    }

    static governanceWiki() {
        return GOV_WIKI;
    }

    static governanceKorea() {
        return GOV_KOREA;
    }

    static governanceDefi() {
        return GOV_DEFI;
    }

    static governanceAmbassador() {
        return GOV_AMBASSADOR;
    }

    static governanceSmm() {
        return GOV_SMM;
    }

    static governanceDgo() {
        return GOV_DGO;
    }

    static governanceEsports() {
        return GOV_ESPORTS;
    }

    static governanceDevex() {
        return GOV_DEVEX;
    }

    static governanceSupport() {
        return GOV_SUPPORT;
    }

    static governanceWd() {
        return GOV_WD;
    }

    static submissionsVotingDuration() {
        const days = 14;
        return days * 24 * 60 * 60 * 1000;
    }

    static juryWalletAddress(governance) {
        return JURY_ADDRESS[governance];
    }

    static pathYoutubeTranslation() {
        return PATH_YOUTUBE;
    }

    static pathTonDev() {
        return PATH_TONDEV;
    }

    static pathTonSpace() {
        return PATH_TONSPACE;
    }

    static pathTonSurf() {
        return PATH_TONSURF;
    }

    static pathGramScan() {
        return PATH_GRAMSCAN;
    }

    static pathTgTonDev() {
        return PATH_TG_TONDEV;
    }

    static pathTgTonLabs() {
        return PATH_TG_TONLABS;
    }

    static pathTwiterTonLabs() {
        return PATH_TWITTER_TONLABS;
    }

    static pathGithubTonLabs() {
        return PATH_GITHAB_TONLABS;
    }
}
