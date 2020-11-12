import Positions from '../../controllers/CVScreen/Positions';

export type RoleRequirement = { label: string, subLabel?: string, skills: string[] };
type RoleRequirements = RoleRequirement[];

export type Link = {
  linkText: string,
  link?: string,
  icon: any,

  screen?: string,
  section?: string,
}

export type ProductCard = {
  img: any,
  title: string,
  description: string,
  link: Link,
};

export type ValueCard = {
  value: string,
  details: string,
};

export type AboutTopic = {
  topicTitle: string,
  topicText: string,
};

export type ManagementPerson = {
  name: string,
  role: string,
  text: string,
};

export type BuyCard = {
    menuTitle: string,
    buyCardTitle: string,
    checkOutBtn: string,
    order: string,
    orderName: string,
    orderCost: string,
    nfcHardwareWallet: string,
    cardLevel: string,
    askQuestion: string,
    shippingAddress: string,
    reviewOrder: string,
    subtotal: string,
    taxAndFees: string,
    shipping: string,
    total: string,
    paymentDetails: string,
    continue: string,
    confirmAndBuy: string,
    joinTheWaitList: string,
    getEarlyAccess: string,
};

export type TONLocalization = {
    Copyright: string,
    Disclaimer: string,
    JoinTheTeam: string,

    // Main
    MainText: string,
    AboutUs: string,
    Spring2020: string,
    Spring2020Short: string,
    DevTitle: string,
    DevLink: string,
    DevDescription: string,
    SurfTitle: string,
    SurfLink: string,
    SurfDescription: string,

    // Career
    WeWelcomeTalentsWithDifferentBackgrounds: string,
    CheckOurVacancies: string,
    TonLabsIsACoreInfrastructure: string,
    CareerValueFounded: ValueCard,
    CareerValueEmployees: ValueCard,
    CareerValueMedianExperience: ValueCard,
    OpenPositions: string,
    NoteThatWeAreADistributedTeam: string,
    ReactNativeDeveloperIOsAndroidWeb: string,
    ObjectiveCJavaNodeJsJavaScriptSolidityCReactNative: string,
    SeniorLlvmCompilerDeveloper: string,
    LlvmClangCompilerC: string,
    SeniorNodeJsMicroservicesEngineer: string,
    JavaScriptNodeJsRethinkDbJsonApi: string,
    SoftwareTestEngineer: string,
    QaTestingFrameworks: string,
    BackendDeveloper: string,
    LlvmRustForthCJava: string,

    ThinkOurCompanyIsExactlyThePlace: string,
    CareerEmail: string,

    ApplyForThisRole: string,
    FullName: string,
    Email: string,
    Phone: string,
    LinkedIn: string,
    GitHub: string,
    Portfolio: string,
    AddACoverLetterOrAnythingElseYouWantToShare: string,
    Additional: string,
    AttachResumeCv: string,
    SubmitApplication: string,
    MaybeLater: string,
    DoneThanksForApplying: string,
    AttachYourCV: string,

    MenuMain: string,
    MenuProducts: string,
    MenuPress: string,
    MenuCareer: string,
    MenuContacts: string,

    // Bottom bar
    PrivacyPolicy: string,
    TermsOfServices: string,
    Feedback: string,
    Copyright: string,

    // Roles description
    RolesDescriptions: {
        [Positions.ReactNative]: RoleRequirements,
        [Positions.LLVM]: RoleRequirements,
        [Positions.NodeJS]: RoleRequirements,
        [Positions.Test]: RoleRequirements,
        [Positions.Backend]: RoleRequirements,
    },

    // Contacts
    ReachOutToUs: string,
    HaveQuestionsOrSuggestions: string,
    SupportEmail: string,
    PressEmail: sring,
    ProductAndSolutionUsageIssues: string,
    PublicRelationshipsRequest: string,
    ContactAddress: string,
    KissAndCry: string,
    RegisteredAddressText: string,
    RegisteredAddressLabel: string,
    AddressCopied: string,
    ConnectEmail: string,
    ConnectEmailDescription: string,
    FollowUpdates: string,
    FollowLinks: Link[],

    // Press
    ForTheMedia: string,
    WannaWrite: string,
    MediaLibrary: string,
    PressKit: string,
    PressRelease: string,
    PressReleaseLLVMOpenSource: string,
    PressReleaseSolidity: string,
    PressReleaseCloud: string,
    StayInTouch: string,
    FactSheet: string,
    LogoAssets: string,
    ForMoreInformationContact: string,
    PressHighlights: string,
    TONLabsIsACore: string,
    CopyHighlightsToClipboard: string,
    ForMoreDetailsContact: string,
    HighlightsCopied: string,
    HighlightsStats: ValueCard[],

    // About
    AboutTitle: string,
    AboutDescription: string,
    Founded: ValueCard,
    Developers: ValueCard,
    MarketLaunch: ValueCard,
    Mission: string,
    MissionText: string,
    AboutHistory: string,
    AboutHistoryItems: AboutTopic[],
    ManagementTitle: string,
    ManagementPersons: ManagementPerson[],
    TeamProfileLinkText: string,
    TeamProfileDownload: string,

    // Products
    LetsUnboxIt: string,
    WeDeliverProducts: string,
    TONEcosystem: string,
    TONDevIs: string,
    JoinAsDeveloper: string,
    JoinAsPartner: string,
    Products: ProductCard[],
    Gramscan: ProductCard,
    AppleStore: string,
    GooglePlay: string,
    WebDapp: string,

    // Main
    MainTitle: string,
    TailoredToTON: string,
    ChallengeOfChoice: string,
    ChallengeOfChoiceText: string,
    ExploreOffer: string,
    CheckRoles: string,
    BecomeStoryteller: string,
    PopupText: string,
    MainTizers: any,

    // Feedback
    SendFeedback: string,
    YourEmail: string,
    DescribeYourIssueOrIdea: string,
    Send: string,
    ThanksForYourFeedback: string,

    ExpireDate: string,
    NameOnCard: string,
    SecureText: string,
    Secure: string,
    Code: string,
    Bank3DSecTitle: string,
    Checkout: string,
    BuyCardMainScreenCaption: string,
    BuyCardMainSceenTitle1: string,
    BuyCardMainSceenTitle2: string,
    BuyCardMainScreenText: string,
    BuyCardMainScreenButtonTitle: string,

    BuyCard: BuyCard,
};
