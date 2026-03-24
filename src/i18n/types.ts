/**
 * i18n Type Definitions
 * Defines the shape of all translation keys for type-safety.
 * Add new keys here when adding translatable strings.
 */

export type Locale = "vi" | "en";

export interface Translations {
  // ─── Common ───────────────────────────────────────────────────
  common: {
    appName: string;
    save: string;
    saving: string;
    cancel: string;
    create: string;
    creating: string;
    edit: string;
    delete: string;
    view: string;
    add: string;
    search: string;
    loading: string;
    confirm: string;
    back: string;
    actions: string;
    status: string;
    name: string;
    notes: string;
    noData: string;
    total: string;
    viewAll: string;
    allStatuses: string;
    signOut: string;
    admin: string;
    somethingWentWrong: string;
    // Status labels
    statusActive: string;
    statusInactive: string;
    statusOnHold: string;
    statusAvailable: string;
    statusOnProject: string;
    statusEnded: string;
    // Interview status
    interviewNew: string;
    interviewScreening: string;
    interviewTechnicalTest: string;
    interviewInterview: string;
    interviewPassed: string;
    interviewFailed: string;
    // Alert status
    alertPending: string;
    alertFlagged: string;
    alertResolved: string;
    alertDismissed: string;
  };

  // ─── Auth ─────────────────────────────────────────────────────
  auth: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    signIn: string;
    signingIn: string;
    invalidCredentials: string;
  };

  // ─── Navigation / Sidebar ─────────────────────────────────────
  nav: {
    dashboard: string;
    vendors: string;
    personnel: string;
    projects: string;
    pipeline: string;
    rateNorms: string;
    alerts: string;
    rateConfig: string;
  };

  // ─── Dashboard ────────────────────────────────────────────────
  dashboard: {
    title: string;
    welcome: string;
    activeHeadcount: string;
    activeProjects: string;
    monthlyRevenue: string;
    monthlyCost: string;
    grossMargin: string;
    pendingAlerts: string;
    allClear: string;
    needReview: string;
    recentAlerts: string;
    projectSummary: string;
    noActiveAssignments: string;
    noActivePolicies: string;
    revenueByProject: string;
    headcountByProject: string;
    revenueVsCostByProject: string;
    headcountByVendor: string;
    project: string;
    client: string;
    market: string;
    headcount: string;
    revenue: string;
    cost: string;
    margin: string;
    marginPct: string;
    noActiveProjects: string;
    personnel: string;
  };

  // ─── Vendor ───────────────────────────────────────────────────
  vendor: {
    title: string;
    addVendor: string;
    editVendor: string;
    searchPlaceholder: string;
    companyName: string;
    contact: string;
    headcount: string;
    noVendors: string;
    deactivateTitle: string;
    deactivateBody: string;
    deactivating: string;
    deactivate: string;
    deactivatedSuccess: string;
    updatedSuccess: string;
    createdSuccess: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    companySize: string;
    startDate: string;
    languageStrength: string;
    languagePlaceholder: string;
    languageSelectPlaceholder: string;
    languageHelperText: string;
    backToVendors: string;
    createdAt: string;
    // Vendor ratings (CR-16)
    website: string;
    performanceRating: string;
    responseSpeedRating: string;
    performanceNote: string;
    qualityLabel: string;
    responseLabel: string;
    notRated: string;
    ratingSection: string;
    // Vendor detail
    personnelSection: string;
    jobType: string;
    techStack: string;
    level: string;
    interview: string;
    noPersonnel: string;
  };

  // ─── Personnel ────────────────────────────────────────────────
  personnel: {
    title: string;
    addPersonnel: string;
    editPersonnel: string;
    searchPlaceholder: string;
    fullName: string;
    vendor: string;
    domain: string;
    vendorRate: string;
    noPersonnel: string;
    // Form fields
    dateOfBirth: string;
    gender: string;
    yearsOfExp: string;
    vendorRateActual: string;
    selectVendor: string;
    selectOption: string;
    techStackPrimary: string;
    techStackPrimaryOptional: string;
    notApplicable: string;
    additionalTechStacks: string;
    additionalTechStacksMax: string;
    englishLevel: string;
    leadershipLabel: string;
    leadershipNote: string;
    vendorRateUsd: string;
    cvRequired: string;
    cvRequiredError: string;
    cvUrlPlaceholder: string;
    cvLabelPlaceholder: string;
    cvNotesPlaceholder: string;
    markAsLatest: string;
    noCvAdded: string;
    createdWithCv: string;
    // Projects column
    projectsColumn: string;
    // Pipeline
    pipeline: string;
    pipelineTotal: string;
    pipelineEmpty: string;
    pipelineFilterByProject: string;
    pipelineAllProjects: string;
    pipelineClearFilter: string;
    interviewStatus: string;
    // Detail
    backToPersonnel: string;
    cvSection: string;
    addCv: string;
    cvLabel: string;
    cvUrl: string;
    cvNotes: string;
    cvLatest: string;
    setAsLatest: string;
    noCV: string;
    updatedSuccess: string;
    createdSuccess: string;
    deletedSuccess: string;
    cvAddedSuccess: string;
    cvUpdatedSuccess: string;
    cvDeletedSuccess: string;
    // Deactivate dialog
    deactivateTitle: string;
    deactivateBody: string;
  };

  // ─── Project ──────────────────────────────────────────────────
  project: {
    title: string;
    addProject: string;
    editProject: string;
    searchPlaceholder: string;
    clientName: string;
    startDate: string;
    endDate: string;
    market: string;
    projectRate: string;
    noProjects: string;
    created: string;
    // Assignments
    assignments: string;
    addAssignment: string;
    editAssignment: string;
    noAssignments: string;
    noAssignmentsHint: string;
    billingRate: string;
    billingRateOverride: string;
    billingRateNote: string;
    vendorRate: string;
    vendorRateOverride: string;
    margin: string;
    roleInProject: string;
    selectPersonnel: string;
    leaveBlankNorm: string;
    leaveBlankVendor: string;
    rateOverrides: string;
    // Assignment actions
    assigning: string;
    assignmentEnded: string;
    ending: string;
    end: string;
    // PnL card
    pnlTitle: string;
    totalRevenue: string;
    totalCost: string;
    grossMargin: string;
    marginPct: string;
    // Others
    backToProjects: string;
    updatedSuccess: string;
    createdSuccess: string;
    deletedSuccess: string;
    assignmentUpdated: string;
    assignmentDeleted: string;
    activeMembers: string;
  };

  // ─── Rates ────────────────────────────────────────────────────
  rate: {
    title: string;
    configTitle: string;
    normMatrix: string;
    addRateNorm: string;
    editRateNorm: string;
    deleteRateNorm: string;
    deleteRateNormConfirm: string;
    rateNormDeleted: string;
    rateNormCreated: string;
    rateNormUpdated: string;
    jobType: string;
    techStack: string;
    level: string;
    domain: string;
    market: string;
    rateNorm: string;
    rateMin: string;
    rateMax: string;
    effectiveDate: string;
    selectJobType: string;
    selectTechStack: string;
    selectLevel: string;
    selectDomain: string;
    noRates: string;
    noRatesForMarket: string;
    addOne: string;
    viewingMarket: string;
    marketFactorLabel: string;
    norms: string;
    cloneFromEnglish: string;
    cloning: string;
    cloneSuccess: string;
    cloneSkipped: string;
    overheadRate: string;
    driftThreshold: string;
    calculatorTitle: string;
    projectRate: string;
    result: string;
    marketConfig: string;
    addMarket: string;
    marketName: string;
    marketCode: string;
    marketFactor: string;
    saveConfig: string;
    savedSuccess: string;
    scanForDrift: string;
    scanning: string;
    // Loading
    loadingRateData: string;
  };

  // ─── Alerts ───────────────────────────────────────────────────
  alert: {
    title: string;
    all: string;
    pending: string;
    flagged: string;
    resolved: string;
    dismissed: string;
    noAlerts: string;
    driftPct: string;
    flagForLeader: string;
    flag: string;
    resolve: string;
    dismiss: string;
    dismissAlert: string;
    dismissNote: string;
    dismissNotePlaceholder: string;
    dismissNoteRequired: string;
    dismissing: string;
    alertDismissed: string;
    resolvedSuccess: string;
    dismissedSuccess: string;
    flaggedSuccess: string;
    role: string;
    normRate: string;
    avgVendor: string;
    drift: string;
    triggered: string;
    newAlertsCreated: string;
    noNewDrift: string;
  };
}
