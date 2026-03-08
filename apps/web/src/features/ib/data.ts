"use client";

import { buildQueryString } from "@/lib/swr";
import { apiFetch } from "@/lib/api";
import { enqueueMutation } from "@/lib/offlineMutationQueue";
import { useSchoolSWR } from "@/lib/useSchoolSWR";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";

export interface IbQueueLink {
  href: string;
  entityRef?: string;
  routeId?: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  updatedAt?: string | null;
}

export type HomeLinkItem = IbQueueLink & {
  id: string;
  label: string;
  detail: string;
  tone?: "default" | "accent" | "warm" | "success" | "risk";
  programme?: "PYP" | "MYP" | "DP" | "Mixed";
  status?: "healthy" | "watch" | "risk";
  priorityScore?: number;
  actionType?: string;
  riskReasonCodes?: string[];
};

export interface IbQuickMutation {
  id: string;
  label: string;
  detail: string;
  mutationType: string;
}

export interface IbWorkflowBenchmarkRow {
  workflowKey: string;
  label: string;
  targetMs: number;
  observedMs: number;
  clickTarget: number;
  observedClicks: number;
  surface: string;
  status: string;
}

export interface IbPerformanceBudget {
  generatedAt: string;
  budgets: Array<{
    workflowKey: string;
    label: string;
    targetMs: number;
    observedMs: number;
    regressionMs: number;
    status: string;
  }>;
  regressions: Array<{
    workflowKey: string;
    impact: string;
    complexity: string;
    note: string;
  }>;
}

export interface IbSpecialistLibraryItem {
  id: number;
  programme: string;
  itemType: string;
  title: string;
  summary?: string | null;
  tags: string[];
  sourceEntityRef?: string | null;
  metadata: Record<string, unknown>;
}

export interface IbOperationsDataMart {
  documents: Record<string, unknown>;
  evidence: Record<string, unknown>;
  publishing: Record<string, unknown>;
  specialist: Record<string, unknown>;
  programmes: Record<string, number>;
  updatedAt: string;
}

export interface IbQueueSlaRow {
  key: string;
  label: string;
  atRisk: number;
  thresholdDays: number;
}

export interface IbOperationsRecommendation {
  id: string;
  title: string;
  detail: string;
  href: string;
  dismissible?: boolean;
  impactMetric?: string;
}

export interface IbStandardsInsight {
  id: number;
  title: string;
  evidenceQuality: string;
  reviewState: string;
  exportStatus: string;
  weakReason: string;
  href: string;
}

export interface IbShareableView {
  shareToken: string | null;
  expiresAt: string | null;
  snapshot: Record<string, unknown>;
}

export interface IbStudentTimelineEvent {
  id: string;
  title: string;
  detail: string;
  href: string;
  kind: string;
  programme: string;
  status: string;
}

export interface IbStudentGoal {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  progressPercent?: number | null;
  targetDate?: string | null;
}

export interface IbStudentNextAction {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone?: string;
}

export interface IbStudentReflectionPrompt {
  key: string;
  title: string;
  prompt: string;
}

export interface IbStudentReflectionHistoryItem {
  id: number;
  prompt: string;
  status: string;
  dueOn?: string | null;
  responseExcerpt?: string | null;
  evidenceTitle?: string | null;
}

export interface IbStudentGrowthPoint {
  label: string;
  value: number;
}

export interface IbStudentMilestoneJourneyRow {
  id: number;
  title: string;
  programme: string;
  status: string;
  dueOn?: string | null;
  nextAction?: string | null;
  href: string;
  checkpoints: Array<{ id: number; title: string; status: string }>;
}

export interface IbStudentPeerFeedbackPayload {
  enabled: boolean;
  moderationRequired: boolean;
  guidelines: string[];
  recentFeedback: Array<{ id: number; title: string; detail: string }>;
}

export interface IbStudentPortfolioPayload {
  evidenceResults: Array<{
    id: number;
    title: string;
    detail?: string | null;
    href: string;
    programme: string;
  }>;
  collections: Array<{
    id: number;
    title: string;
    visibility: string;
    itemCount: number;
    sharedToken?: string | null;
  }>;
}

export interface IbGuardianStory {
  id: number;
  title: string;
  programme: string;
  summary?: string | null;
  supportPrompt?: string | null;
  cadence: string;
  state: string;
  publishedAt?: string | null;
  translationState?: string;
  availableLocales?: string[];
}

export interface IbGuardianInteraction {
  id: number;
  title: string;
  detail: string;
  occurredAt: string;
}

export interface IbAiAssistanceSummary {
  providerReady: boolean;
  availableCount: number;
  reviewRequiredCount: number;
  trustAverage: number;
  estimatedMinutesSaved: number;
  tasks: Array<{
    taskType: string;
    label: string;
    workflow: string;
    outputMode: string;
    available: boolean;
    reviewRequired: boolean;
    humanOnlyBoundaries: string[];
    invocationCount: number;
    appliedCount: number;
    averageTrust: number;
  }>;
  benchmarks: Array<{
    id: string;
    taskType: string;
    scenario: string;
    passCondition: string;
  }>;
  redTeamScenarios: Array<{
    id: string;
    risk: string;
    containment: string;
  }>;
  tenantControls: Record<string, unknown>;
}

export interface IbHomePayload {
  programme: "PYP" | "MYP" | "DP" | "Mixed";
  schoolLabel: string;
  coordinatorMode: boolean;
  resumeItems: HomeLinkItem[];
  changeFeed: HomeLinkItem[];
  evidenceActions: HomeLinkItem[];
  publishingActions: HomeLinkItem[];
  coordinatorComments: HomeLinkItem[];
  projectsCoreFollowUp: HomeLinkItem[];
  quickActions: HomeLinkItem[];
  coordinatorCards: HomeLinkItem[];
  pinnedItems: HomeLinkItem[];
  dueToday: HomeLinkItem[];
  recentHistory: HomeLinkItem[];
  quickMutations: IbQuickMutation[];
  benchmarkSnapshot: IbWorkflowBenchmarkRow[];
  performanceBudget: IbPerformanceBudget;
  aiAssistance: IbAiAssistanceSummary;
  lastSeenAt?: string | null;
}

export interface IbOperationsPayload {
  summaryMetrics: Array<{
    label: string;
    value: string;
    detail: string;
    tone?: "accent" | "warm" | "success" | "risk";
  }>;
  priorityExceptions: HomeLinkItem[];
  queues: Record<string, number>;
  programmeTabs: string[];
  drilldowns: Array<{ area: string; signal: string; destination: string }>;
  thresholdsApplied: Record<string, number>;
  generatedAt: string;
  dataMart: IbOperationsDataMart;
  programmeHealthSummary: Record<string, number>;
  pypIntelligence: {
    coverageHeatmap: Record<string, Record<string, number>>;
    overlapRows: Array<{
      id: number;
      title: string;
      yearLevel: string;
      theme: string;
      signal: string;
      href: string;
    }>;
  };
  mypIntelligence: {
    conceptBalance: Record<string, number>;
    contextBalance: Record<string, number>;
    atlBalance: Record<string, number>;
    criteriaBalance: Record<string, number>;
  };
  dpRiskSummary: Array<{
    id: number;
    title: string;
    recordFamily: string;
    riskScore: number;
    factors: string[];
    threshold: number;
    href: string;
  }>;
  continuumExplorer: Record<
    string,
    Array<{
      id: number;
      title: string;
      href: string;
      documentType: string;
      updatedAt: string;
    }>
  >;
  bottlenecks: {
    stuckReasons: Record<string, number>;
    slaRows: IbQueueSlaRow[];
  };
  recommendations: IbOperationsRecommendation[];
  standardsInsights: IbStandardsInsight[];
  shareableView: IbShareableView;
}

export interface IbReviewLaneItem {
  id: string;
  lane: "approvals" | "moderation" | "comments";
  item: string;
  detail: string;
  href: string;
  entityRef?: string;
  routeId?: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  updatedAt?: string | null;
}

export interface IbReviewPayload {
  approvals: IbReviewLaneItem[];
  moderation: IbReviewLaneItem[];
  comments: IbReviewLaneItem[];
}

export interface IbEvidenceItem extends Record<string, unknown> {
  id: string;
  title: string;
  programme: "PYP" | "MYP" | "DP";
  context: string;
  contributor: string;
  status: string;
  visibility: string;
  nextAction: string;
  storyDraft: string;
  warnings: string[];
  curriculumDocumentId?: number | null;
  planningContextId?: number | null;
  operationalRecordId?: number | null;
  studentId?: number | null;
  href: string;
  entityRef?: string;
  routeId?: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  updatedAt?: string | null;
  linkedStoryCount?: number;
}

export interface IbReflectionRequestItem extends Record<string, unknown> {
  id: number;
  evidenceItemId: number;
  studentId: number;
  status: string;
  prompt: string;
  responseExcerpt?: string | null;
  dueOn?: string | null;
  respondedAt?: string | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  metadata: Record<string, unknown>;
}

export interface IbLearningStoryItem extends Record<string, unknown> {
  id: string;
  title: string;
  programme: "PYP" | "MYP" | "DP";
  audience: string;
  teacher: string;
  cadence: string;
  state:
    | "draft"
    | "needs-context"
    | "ready-for-digest"
    | "publish-now"
    | "scheduled"
    | "published"
    | "held";
  summary: string;
  supportPrompt: string;
  href: string;
  entityRef?: string;
  routeId?: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  updatedAt?: string | null;
}

export interface IbQueueItem extends IbQueueLink {
  id: number;
  state: string;
  scheduledFor?: string | null;
  deliveredAt?: string | null;
  heldReason?: string | null;
  story: IbLearningStoryItem;
}

export interface IbCollaborator {
  id: number;
  userId: number;
  role: string;
  status: string;
  contributionMode: string;
  metadata: Record<string, unknown>;
}

export interface IbComment {
  id: number;
  authorId: number;
  authorLabel?: string | null;
  commentType: string;
  status: string;
  visibility: string;
  anchorPath?: string | null;
  body: string;
  parentCommentId?: number | null;
  resolvedAt?: string | null;
  metadata: Record<string, unknown>;
  replyCount: number;
  replies: IbComment[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface IbOperationalCheckpoint {
  id: number;
  title: string;
  status: string;
  due_on?: string | null;
  summary?: string | null;
}

export interface IbOperationalRecord {
  id: number;
  programme: "PYP" | "MYP" | "DP" | "Mixed";
  planningContextId?: number | null;
  curriculumDocumentId?: number | null;
  studentId?: number | null;
  ownerId?: number | null;
  advisorId?: number | null;
  recordFamily: string;
  subtype: string;
  status: string;
  priority: string;
  riskLevel: string;
  dueOn?: string | null;
  title: string;
  summary?: string | null;
  nextAction?: string | null;
  routeHint?: string | null;
  metadata: Record<string, unknown>;
  curriculumDocumentTitle?: string | null;
  studentName?: string | null;
  ownerName?: string | null;
  advisorName?: string | null;
  entityRef?: string;
  routeId?: string;
  href: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  checkpoints: IbOperationalCheckpoint[];
}

export interface IbSpecialistPayload {
  ownedUnits: Array<{
    id: number;
    title: string;
    detail: string;
    href: string;
    contributionMode: string;
  }>;
  contributedUnits: Array<{
    id: number;
    title: string;
    detail: string;
    href: string;
    contributionMode: string;
  }>;
  weekItems: Array<{
    id: number;
    title: string;
    detail: string;
    dueOn?: string | null;
    href: string;
  }>;
  requestedContributions: Array<{
    id: number;
    title: string;
    detail: string;
    href: string;
    contributionMode: string;
    role: string;
    status: string;
    handoffState: string;
  }>;
  pendingResponses: Array<{
    id: number;
    title: string;
    detail: string;
    dueOn?: string | null;
    href: string;
    handoffState: string;
  }>;
  evidenceToSort: Array<{
    id: number;
    title: string;
    detail: string;
    href: string;
    status: string;
  }>;
  overloadSignals: Array<{ userId: number; assignedCount: number; severity: string }>;
  assignmentGaps: Array<{ documentId: number; title: string; href: string }>;
  libraryItems: IbSpecialistLibraryItem[];
}

export interface IbPoiEntry {
  id: number;
  yearLevel: string;
  theme: string;
  title: string;
  centralIdea?: string | null;
  reviewState: string;
  coherenceSignal: string;
  specialistExpectations: string[];
}

export interface IbPoiPayload {
  board: {
    id: number;
    title: string;
    status: string;
    entries: IbPoiEntry[];
  } | null;
  themes: string[];
  years: string[];
  summaryMetrics: Array<{ label: string; value: string }>;
}

export interface IbGuardianPayload {
  stories: IbGuardianStory[];
  releasedReports: Array<{
    id: number;
    title: string;
    summary?: string | null;
    reportFamily: string;
    programme: string;
    href: string;
    releasedAt?: string | null;
  }>;
  currentUnits: Array<{
    id: number;
    title: string;
    href: string;
    summary: Record<string, unknown>;
  }>;
  portfolioHighlights: Array<{
    id: number;
    title: string;
    programme: string;
    summary?: string | null;
    visibility: string;
  }>;
  calendarDigest: Array<{
    id: number;
    title: string;
    cadence: string;
    publishedAt?: string | null;
  }>;
  milestoneDigest: Array<{
    id: number;
    title: string;
    programme: string;
    cadence: string;
    publishedAt?: string | null;
    href: string;
  }>;
  progressSummary: { storyCount: number; highlightCount: number; supportPrompts: number };
  visibilityPolicy: {
    storyStates: string[];
    evidenceVisibility: string[];
    noiseBudget: Record<string, number>;
    moderationPolicy: Record<string, unknown>;
  };
  currentUnitWindows: Array<{
    id: number;
    title: string;
    href: string;
    summary: Record<string, unknown>;
  }>;
  studentOptions: Array<{ id: number; label: string; relationship: string }>;
  interactions: {
    acknowledgements: IbGuardianInteraction[];
    responses: IbGuardianInteraction[];
  };
  digestStrategy: {
    cadenceOptions: string[];
    currentPreferences: Record<string, unknown>;
    communicationPreferences?: Record<string, unknown>;
    urgentCount: number;
    routineStoryCount: number;
  };
  deliveryReceipts: Array<{
    id: string;
    state: string;
    deliverableType: string;
    deliverableId: number;
    readAt?: string | null;
    acknowledgedAt?: string | null;
  }>;
  familyCharter: Record<string, string>;
  howToHelp: Array<{ id: number; title: string; prompt: string | null }>;
  preferences: Record<
    string,
    { in_app?: boolean; email?: boolean; email_frequency: string; push?: boolean }
  >;
  communicationPreferences: {
    locale: string;
    digestCadence: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    quietHoursTimezone: string;
    deliveryRules: Record<string, unknown>;
  };
}

export interface IbMobileHubPayload {
  generatedAt: string;
  schoolLabel: string;
  role: string;
  primaryActions: Array<{
    key: string;
    label: string;
    detail: string;
    href: string;
    routeId: string;
  }>;
  desktopFirstActions: Array<{
    key: string;
    label: string;
    detail: string;
    href: string;
    routeId: string;
  }>;
  roleInventory: Record<
    string,
    {
      mobileFirst: Array<{
        key: string;
        label: string;
        detail: string;
        href: string;
        routeId: string;
      }>;
      desktopFirst: Array<{
        key: string;
        label: string;
        detail: string;
        href: string;
        routeId: string;
      }>;
    }
  >;
  deepLinks: Array<{
    key: string;
    eventKey: string;
    href: string;
    routeId: string;
    restoreKey: string;
    mobileRestore: boolean;
  }>;
  offlinePolicy: {
    draftQueueLimit: number;
    resumableUploads: boolean;
    backgroundSync: string;
    attachmentRetry: boolean;
    conflictResolution: string;
    lowBandwidthMode: boolean;
    retryBackoffSeconds: number[];
  };
  diagnostics: {
    trustContract: Array<{ key: string; label: string; desktopFirst: boolean }>;
    successCriteria: Record<string, string>;
    diagnosticCount: number;
    unhealthyCount: number;
  };
}

export interface IbStudentPayload {
  nextCheckpoints: Array<{
    id: number;
    programme: string;
    recordFamily: string;
    title: string;
    summary?: string | null;
    nextAction?: string | null;
    dueOn?: string | null;
    riskLevel: string;
    href: string;
  }>;
  reflectionsDue: Array<{
    id: number;
    title: string;
    summary?: string | null;
    status: string;
    visibility: string;
  }>;
  validatedEvidence: Array<{
    id: number;
    title: string;
    summary?: string | null;
    status: string;
    visibility: string;
  }>;
  projectMilestones: Array<{
    id: number;
    programme: string;
    recordFamily: string;
    title: string;
    summary?: string | null;
    nextAction?: string | null;
    dueOn?: string | null;
    riskLevel: string;
    href: string;
  }>;
  releasedReports: Array<{
    id: number;
    title: string;
    summary?: string | null;
    reportFamily: string;
    programme: string;
    href: string;
    releasedAt?: string | null;
  }>;
  learningTimeline: IbStudentTimelineEvent[];
  goals: IbStudentGoal[];
  nextActions: IbStudentNextAction[];
  reflectionSystem: {
    prompts: IbStudentReflectionPrompt[];
    history: IbStudentReflectionHistoryItem[];
  };
  growthVisualization: {
    criteria: IbStudentGrowthPoint[];
    atl: IbStudentGrowthPoint[];
    learnerProfile: IbStudentGrowthPoint[];
  };
  milestoneJourney: IbStudentMilestoneJourneyRow[];
  peerFeedback: IbStudentPeerFeedbackPayload;
  portfolio: IbStudentPortfolioPayload;
  quickActions: Array<{ id: string; label: string; detail: string; href: string }>;
  notificationPreferences: Record<
    string,
    { in_app?: boolean; email?: boolean; email_frequency: string; push?: boolean }
  >;
  communicationPreferences: {
    locale: string;
    digestCadence: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    quietHoursTimezone: string;
    deliveryRules: Record<string, unknown>;
  };
  deliveryReceipts: Array<{
    id: string;
    state: string;
    deliverableType: string;
    deliverableId: number;
    readAt?: string | null;
    acknowledgedAt?: string | null;
  }>;
  releaseGates: Record<string, boolean>;
}

export interface IbProgrammeSettingLayer {
  id?: number | null;
  programme: string;
  cadence_mode: string;
  review_owner_role: string;
  thresholds: Record<string, number>;
  metadata: Record<string, unknown>;
  updated_at?: string | null;
}

export interface IbProgrammeSetting {
  programme: string;
  school_id?: number | null;
  inherited_from: "tenant" | "school" | "defaults";
  effective: IbProgrammeSettingLayer;
  tenant_default: IbProgrammeSettingLayer;
  school_override: IbProgrammeSettingLayer;
  complete: boolean;
}

export interface IbStandardsPacket {
  id: number;
  code: string;
  title: string;
  reviewState: string;
  reviewerId?: number | null;
  evidenceStrength: string;
  exportStatus: string;
  routeId?: string;
  href?: string;
  scoreSummary?: {
    completenessScore: number;
    reviewedItemCount: number;
    approvedItemCount: number;
    totalItemCount: number;
    evidenceStrength: string;
  };
  exportHistory?: Array<{
    id: number;
    status: string;
    createdAt?: string | null;
    artifactUrl?: string | null;
  }>;
  items: Array<{
    id: number;
    sourceType: string;
    sourceId: number;
    reviewState: string;
    summary?: string | null;
    provenanceHref?: string | null;
  }>;
}

export interface IbStandardsCycle {
  id: number;
  title: string;
  status: string;
  exportCount?: number;
  packets: IbStandardsPacket[];
}

export interface IbRolloutPayload {
  activePack: {
    key: string;
    version: string;
    expectedVersion: string;
    usingCurrentPack: boolean;
    deprecatedRecordCount: number;
  };
  featureFlags: {
    required: Array<{ key: string; enabled: boolean }>;
    healthy: boolean;
    bundles?: Array<{
      key: string;
      flags: Array<{ key: string; enabled: boolean }>;
      enabledCount: number;
      complete: boolean;
    }>;
    inventory?: Array<{
      key: string;
      enabled: boolean;
      owner: string;
      stage: string;
      dependsOn: string[];
      bundle: string;
      killSwitch: boolean;
      dependencyHealth: boolean;
    }>;
    killSwitches?: Array<{
      key: string;
      enabled: boolean;
      owner: string;
      stage: string;
      dependsOn: string[];
      bundle: string;
      killSwitch: boolean;
      dependencyHealth: boolean;
    }>;
  };
  releaseBaseline?: {
    id: number;
    releaseChannel: string;
    status: string;
    packKey: string;
    packVersion: string;
    ciStatus: string;
    migrationStatus: string;
    checklist: Record<
      string,
      { label?: string; status: string; detail: string; remediation: string }
    >;
    blockers: Array<{ key: string; detail: string; remediation: string }>;
    verifiedAt?: string | null;
    certifiedAt?: string | null;
    rolledBackAt?: string | null;
  } | null;
  pilotBaseline?: {
    packKey: string;
    packVersion: string;
    releaseChannel: string;
    releaseFrozen: boolean;
    baselineApplied: boolean;
  };
  pilotSetup?: {
    status: string;
    completedSteps: number;
    totalSteps: number;
    blockerCount: number;
    warningCount: number;
  } | null;
  routeReadiness: {
    checkedCount: number;
    canonicalCount: number;
    fallbackCount: number;
    healthy: boolean;
  };
  migrationDrift: {
    documentCount: number;
    byPackVersion: Record<string, number>;
    bySchemaKey: Record<string, number>;
    missingSchemaKey: number;
    missingRouteHintRecords: number;
  };
  programmeSettings: {
    rows: IbProgrammeSetting[];
    completeCount: number;
    incompleteProgrammes: string[];
  };
  academicYear: {
    planningContextCount: number;
    pinnedContextCount: number;
    healthy: boolean;
  };
  legacyUsage: {
    legacyDocumentRoutes: number;
    legacyOperationalRoutes: number;
    demoRoutes: number;
  };
  generatedAt: string;
}

export interface IbPilotReadinessPayload {
  overallStatus: "green" | "yellow" | "red";
  sections: Array<{
    key: string;
    title: string;
    status: "green" | "yellow" | "red";
    summary: string;
    issues: string[];
    rules: Array<{
      id: string;
      severity: "info" | "warning" | "blocker";
      status: "pass" | "fail";
      detail: string;
      remediation: string;
      href: string;
    }>;
  }>;
  generatedAt: string;
  staleAfterSeconds: number;
}

export interface IbReportPayload {
  id: number;
  programme: string;
  reportFamily: string;
  audience: string;
  status: string;
  title: string;
  summary?: string | null;
  sourceRefs: string[];
  proofingSummary: Record<string, unknown>;
  releasedAt?: string | null;
  lastRenderedAt?: string | null;
  reportContract: Record<string, unknown>;
  localization: Record<string, unknown>;
  releaseWorkflow: Record<string, unknown>;
  archiveEntry: Record<string, unknown>;
  analytics: Record<string, unknown>;
  viewerPermissions: Record<string, unknown>;
  conferencePacket: Record<string, unknown>;
  currentVersion?: {
    id: number;
    versionNumber: number;
    status: string;
    templateKey: string;
    contentPayload: Record<string, unknown>;
    renderPayload: Record<string, unknown>;
    proofingSummary: Record<string, unknown>;
  } | null;
  versions: Array<{
    id: number;
    versionNumber: number;
    status: string;
    templateKey: string;
    contentPayload: Record<string, unknown>;
    renderPayload: Record<string, unknown>;
    proofingSummary: Record<string, unknown>;
  }>;
  deliveries: Array<{
    id: number;
    audienceRole: string;
    channel: string;
    locale: string;
    status: string;
    deliveredAt?: string | null;
    readAt?: string | null;
    acknowledgedAt?: string | null;
    artifactUrl?: string | null;
    archiveKey?: string | null;
    feedbackWindow?: string | null;
    analytics: Record<string, unknown>;
    proofingState: Record<string, unknown>;
  }>;
}

export interface IbCollaborationPayload {
  documentId: number;
  currentSessionId?: number | null;
  channelTopology: Array<{ key: string; scope: string; transport: string; auth: string }>;
  concurrencyPolicy: Record<string, string>;
  activeSessions: Array<{
    id: number;
    userId: number;
    userLabel?: string | null;
    role: string;
    scopeType: string;
    scopeKey: string;
    status: string;
    deviceLabel?: string | null;
    lastSeenAt: string;
    expiresAt?: string | null;
    editingSameScope: boolean;
    heartbeatAgeSeconds: number;
    metadata: Record<string, unknown>;
  }>;
  softLocks: Array<{
    scopeKey: string;
    ownerUserIds: number[];
    ownerLabels: string[];
    contested: boolean;
    sessionIds: number[];
  }>;
  conflictRisk: boolean;
  updatedAt: string;
}

export interface IbSavedSearchPayload {
  id: number;
  name: string;
  query?: string | null;
  lensKey: string;
  scopeKey: string;
  shareToken: string;
  filters: Record<string, unknown>;
  metadata: Record<string, unknown>;
  lastRunAt?: string | null;
  updatedAt: string;
}

export interface IbCommunicationPreferencePayload {
  id: number;
  audience: string;
  locale: string;
  digestCadence: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursTimezone: string;
  deliveryRules: Record<string, unknown>;
  metadata: Record<string, unknown>;
  updatedAt: string;
}

export interface IbReviewGovernancePayload {
  summaryMetrics: Record<string, number>;
  queues: Record<string, Array<IbQueueLink & { id: string; title: string; detail: string }>>;
  generatedAt: string;
}

export interface IbRouteResolution {
  status:
    | "ok"
    | "forbidden"
    | "not_found"
    | "school_mismatch"
    | "archived_redirect"
    | "deprecated_redirect";
  routeId: string;
  href: string;
  fallbackRouteId: string;
  fallbackHref: string;
  displayLabel: string;
  entityRef?: string | null;
  redirectTo?: string | null;
}

function toneForStatus(status?: string): HomeLinkItem["tone"] {
  if (!status) return "default";
  if (status === "risk") return "risk";
  if (status === "watch") return "warm";
  if (status === "healthy") return "success";
  return "accent";
}

function programmeFor(raw?: string | null): HomeLinkItem["programme"] {
  return raw === "PYP" || raw === "MYP" || raw === "DP" || raw === "Mixed" ? raw : "Mixed";
}

function mapActionItem(item: Record<string, unknown>): HomeLinkItem {
  const status =
    typeof item.status === "string" ? (item.status as HomeLinkItem["status"]) : undefined;
  return {
    id: String(item.id),
    label: String(item.label || item.title || "Untitled"),
    detail: String(item.detail || ""),
    href: String(item.href || IB_CANONICAL_ROUTES.home),
    entityRef: typeof item.entity_ref === "string" ? item.entity_ref : undefined,
    routeId: typeof item.route_id === "string" ? item.route_id : undefined,
    fallbackRouteId:
      typeof item.fallback_route_id === "string" ? item.fallback_route_id : undefined,
    tone: (item.tone as HomeLinkItem["tone"]) || toneForStatus(status),
    programme: programmeFor(typeof item.programme === "string" ? item.programme : null),
    status,
    priorityScore: typeof item.priority_score === "number" ? item.priority_score : undefined,
    actionType: typeof item.action_type === "string" ? item.action_type : undefined,
    changedSinceLastSeen: Boolean(item.changed_since_last_seen),
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
    riskReasonCodes: Array.isArray(item.risk_reason_codes)
      ? item.risk_reason_codes.map(String)
      : undefined,
  };
}

function evidenceContext(item: Record<string, unknown>): string {
  const bits = [
    item.programme,
    item.planning_context_id ? `Context ${item.planning_context_id}` : null,
    item.curriculum_document_id ? `Unit ${item.curriculum_document_id}` : null,
    item.ib_operational_record_id ? `Project ${item.ib_operational_record_id}` : null,
  ].filter(Boolean);
  return bits.length > 0 ? bits.join(" • ") : "Unscoped evidence";
}

function mapEvidenceItem(item: Record<string, unknown>): IbEvidenceItem {
  const metadata = (item.metadata as { warnings?: unknown[] } | undefined) || undefined;
  return {
    id: String(item.id),
    title: String(item.title || "Untitled evidence"),
    programme: programmeFor(String(item.programme || "PYP")) as IbEvidenceItem["programme"],
    context: evidenceContext(item),
    contributor: String(item.contributor_type || "Teacher"),
    status: String(item.status || "needs_validation"),
    visibility: String(item.visibility || "undecided"),
    nextAction: String(item.next_action || item.summary || "Review visibility and next steps."),
    storyDraft: String(item.story_draft || "Create or link a learning story draft."),
    warnings: Array.isArray(metadata?.warnings) ? metadata.warnings.map(String) : [],
    curriculumDocumentId:
      typeof item.curriculum_document_id === "number" ? item.curriculum_document_id : null,
    planningContextId:
      typeof item.planning_context_id === "number" ? item.planning_context_id : null,
    operationalRecordId:
      typeof item.ib_operational_record_id === "number" ? item.ib_operational_record_id : null,
    studentId: typeof item.student_id === "number" ? item.student_id : null,
    href: String(item.href || IB_CANONICAL_ROUTES.evidenceItem(item.id as string | number)),
    entityRef: typeof item.entity_ref === "string" ? item.entity_ref : undefined,
    routeId: typeof item.route_id === "string" ? item.route_id : undefined,
    fallbackRouteId:
      typeof item.fallback_route_id === "string" ? item.fallback_route_id : undefined,
    changedSinceLastSeen: Boolean(item.changed_since_last_seen),
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
    linkedStoryCount:
      typeof item.linked_story_count === "number" ? item.linked_story_count : undefined,
  };
}

function mapReflectionRequest(item: Record<string, unknown>): IbReflectionRequestItem {
  return {
    id: Number(item.id || 0),
    evidenceItemId: Number(item.ib_evidence_item_id || 0),
    studentId: Number(item.student_id || 0),
    status: String(item.status || "requested"),
    prompt: String(item.prompt || ""),
    responseExcerpt: typeof item.response_excerpt === "string" ? item.response_excerpt : null,
    dueOn: typeof item.due_on === "string" ? item.due_on : null,
    respondedAt: typeof item.responded_at === "string" ? item.responded_at : null,
    approvedById: typeof item.approved_by_id === "number" ? item.approved_by_id : null,
    approvedAt: typeof item.approved_at === "string" ? item.approved_at : null,
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {},
  };
}

function mapAiAssistanceSummary(raw: unknown): IbAiAssistanceSummary {
  const record = asRecord(raw);

  return {
    providerReady: Boolean(record.provider_ready),
    availableCount: Number(record.available_count || 0),
    reviewRequiredCount: Number(record.review_required_count || 0),
    trustAverage: Number(record.trust_average || 0),
    estimatedMinutesSaved: Number(record.estimated_minutes_saved || 0),
    tasks: Array.isArray(record.tasks)
      ? (record.tasks as Record<string, unknown>[]).map((item) => ({
          taskType: String(item.task_type || "ib_task"),
          label: String(item.label || "AI task"),
          workflow: String(item.workflow || "workflow"),
          outputMode: String(item.output_mode || "analysis"),
          available: Boolean(item.available),
          reviewRequired: Boolean(item.review_required),
          humanOnlyBoundaries: Array.isArray(item.human_only_boundaries)
            ? item.human_only_boundaries.map(String)
            : [],
          invocationCount: Number(item.invocation_count || 0),
          appliedCount: Number(item.applied_count || 0),
          averageTrust: Number(item.average_trust || 0),
        }))
      : [],
    benchmarks: Array.isArray(record.benchmarks)
      ? (record.benchmarks as Record<string, unknown>[]).map((item) => ({
          id: String(item.id || "benchmark"),
          taskType: String(item.task_type || "ib_task"),
          scenario: String(item.scenario || ""),
          passCondition: String(item.pass_condition || ""),
        }))
      : [],
    redTeamScenarios: Array.isArray(record.red_team_scenarios)
      ? (record.red_team_scenarios as Record<string, unknown>[]).map((item) => ({
          id: String(item.id || "red-team"),
          risk: String(item.risk || ""),
          containment: String(item.containment || ""),
        }))
      : [],
    tenantControls: asRecord(record.tenant_controls),
  };
}

function storyState(value: string): IbLearningStoryItem["state"] {
  switch (value) {
    case "needs_context":
      return "needs-context";
    case "ready_for_digest":
      return "ready-for-digest";
    case "publish_now":
      return "publish-now";
    default:
      return (value.replace(/_/g, "-") as IbLearningStoryItem["state"]) || "draft";
  }
}

function formatCadence(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function mapNotificationPreferences(
  value: unknown,
): Record<string, { in_app?: boolean; email?: boolean; email_frequency: string; push?: boolean }> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<
    Record<string, { in_app?: boolean; email?: boolean; email_frequency: string; push?: boolean }>
  >((memo, [key, rawPreference]) => {
    const preference =
      rawPreference && typeof rawPreference === "object" && !Array.isArray(rawPreference)
        ? (rawPreference as Record<string, unknown>)
        : {};
    memo[key] = {
      in_app: typeof preference.in_app === "boolean" ? preference.in_app : undefined,
      email: typeof preference.email === "boolean" ? preference.email : undefined,
      push: typeof preference.push === "boolean" ? preference.push : undefined,
      email_frequency: String(preference.email_frequency || "weekly_digest"),
    };
    return memo;
  }, {});
}

function mapWorkflowBenchmarkRow(item: Record<string, unknown>): IbWorkflowBenchmarkRow {
  return {
    workflowKey: String(item.workflow_key || "workflow"),
    label: String(item.label || "Workflow"),
    targetMs: Number(item.target_ms || 0),
    observedMs: Number(item.observed_ms || 0),
    clickTarget: Number(item.click_target || 0),
    observedClicks: Number(item.observed_clicks || 0),
    surface: String(item.surface || "teacher_studio"),
    status: String(item.status || "within_budget"),
  };
}

function mapPerformanceBudget(value: unknown): IbPerformanceBudget {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    generatedAt: String(raw.generated_at || ""),
    budgets: Array.isArray(raw.budgets)
      ? raw.budgets.map((budget) => ({
          workflowKey: String((budget as Record<string, unknown>).workflow_key || "workflow"),
          label: String((budget as Record<string, unknown>).label || "Workflow"),
          targetMs: Number((budget as Record<string, unknown>).target_ms || 0),
          observedMs: Number((budget as Record<string, unknown>).observed_ms || 0),
          regressionMs: Number((budget as Record<string, unknown>).regression_ms || 0),
          status: String((budget as Record<string, unknown>).status || "within_budget"),
        }))
      : [],
    regressions: Array.isArray(raw.regressions)
      ? raw.regressions.map((row) => ({
          workflowKey: String((row as Record<string, unknown>).workflow_key || "workflow"),
          impact: String((row as Record<string, unknown>).impact || "medium"),
          complexity: String((row as Record<string, unknown>).complexity || "medium"),
          note: String((row as Record<string, unknown>).note || ""),
        }))
      : [],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapMobileHubAction(value: Record<string, unknown>) {
  return {
    key: String(value.key || "action"),
    label: String(value.label || "Action"),
    detail: String(value.detail || ""),
    href: String(value.href || IB_CANONICAL_ROUTES.home),
    routeId: String(value.route_id || "ib.home"),
  };
}

function mapStory(item: Record<string, unknown>): IbLearningStoryItem {
  return {
    id: String(item.id),
    title: String(item.title || "Untitled story"),
    programme: programmeFor(String(item.programme || "PYP")) as IbLearningStoryItem["programme"],
    audience: String(item.audience || "Families"),
    teacher: typeof item.created_by_id === "number" ? `Teacher #${item.created_by_id}` : "Teacher",
    cadence: formatCadence(String(item.cadence || "weekly_digest")),
    state: storyState(String(item.state || "draft")),
    summary: String(item.summary || ""),
    supportPrompt: String(
      item.support_prompt || "Invite a short conversation about the learning moment.",
    ),
    href: String(item.href || IB_CANONICAL_ROUTES.familyStory(item.id as string | number)),
    entityRef: typeof item.entity_ref === "string" ? item.entity_ref : undefined,
    routeId: typeof item.route_id === "string" ? item.route_id : undefined,
    fallbackRouteId:
      typeof item.fallback_route_id === "string" ? item.fallback_route_id : undefined,
    changedSinceLastSeen: Boolean(item.changed_since_last_seen),
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
  };
}

export function useIbHomePayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/home");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          programme: programmeFor(raw.programme as string) || "Mixed",
          schoolLabel: String(raw.school_label || "All schools"),
          coordinatorMode: Boolean(raw.coordinator_mode),
          resumeItems: Array.isArray(raw.resume_items)
            ? raw.resume_items.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          changeFeed: Array.isArray(raw.change_feed)
            ? raw.change_feed.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          evidenceActions: Array.isArray(raw.evidence_actions)
            ? raw.evidence_actions.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          publishingActions: Array.isArray(raw.publishing_actions)
            ? raw.publishing_actions.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          coordinatorComments: Array.isArray(raw.coordinator_comments)
            ? raw.coordinator_comments.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          projectsCoreFollowUp: Array.isArray(raw.projects_core_follow_up)
            ? raw.projects_core_follow_up.map((item) =>
                mapActionItem(item as Record<string, unknown>),
              )
            : [],
          quickActions: Array.isArray(raw.quick_actions)
            ? raw.quick_actions.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          coordinatorCards: Array.isArray(raw.coordinator_cards)
            ? raw.coordinator_cards.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          pinnedItems: Array.isArray(raw.pinned_items)
            ? raw.pinned_items.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          dueToday: Array.isArray(raw.due_today)
            ? raw.due_today.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          recentHistory: Array.isArray(raw.recent_history)
            ? raw.recent_history.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          quickMutations: Array.isArray(raw.quick_mutations)
            ? raw.quick_mutations.map((item) => ({
                id: String((item as Record<string, unknown>).id || "mutation"),
                label: String((item as Record<string, unknown>).label || "Quick mutation"),
                detail: String((item as Record<string, unknown>).detail || ""),
                mutationType: String((item as Record<string, unknown>).mutation_type || "mutation"),
              }))
            : [],
          benchmarkSnapshot: Array.isArray(raw.benchmark_snapshot)
            ? raw.benchmark_snapshot.map((item) =>
                mapWorkflowBenchmarkRow(item as Record<string, unknown>),
              )
            : [],
          performanceBudget: mapPerformanceBudget(raw.performance_budget),
          aiAssistance: mapAiAssistanceSummary(raw.ai_assistance),
          lastSeenAt: typeof raw.last_seen_at === "string" ? raw.last_seen_at : null,
        } satisfies IbHomePayload)
      : undefined,
  };
}

export function useIbMobileHub() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/mobile_hub");
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          generatedAt: String(raw.generated_at || ""),
          schoolLabel: String(raw.school_label || "All schools"),
          role: String(raw.role || "teacher"),
          primaryActions: Array.isArray(raw.primary_actions)
            ? raw.primary_actions.map((item) => mapMobileHubAction(item as Record<string, unknown>))
            : [],
          desktopFirstActions: Array.isArray(raw.desktop_first_actions)
            ? raw.desktop_first_actions.map((item) =>
                mapMobileHubAction(item as Record<string, unknown>),
              )
            : [],
          roleInventory:
            raw.role_inventory && typeof raw.role_inventory === "object"
              ? Object.fromEntries(
                  Object.entries(raw.role_inventory as Record<string, unknown>).map(
                    ([role, value]) => {
                      const record = asRecord(value);
                      return [
                        role,
                        {
                          mobileFirst: Array.isArray(record.mobile_first)
                            ? record.mobile_first.map((item) =>
                                mapMobileHubAction(item as Record<string, unknown>),
                              )
                            : [],
                          desktopFirst: Array.isArray(record.desktop_first)
                            ? record.desktop_first.map((item) =>
                                mapMobileHubAction(item as Record<string, unknown>),
                              )
                            : [],
                        },
                      ];
                    },
                  ),
                )
              : {},
          deepLinks: Array.isArray(raw.deep_links)
            ? raw.deep_links.map((item) => ({
                key: String((item as Record<string, unknown>).key || "link"),
                eventKey: String((item as Record<string, unknown>).event_key || "ib.mobile.link"),
                href: String((item as Record<string, unknown>).href || IB_CANONICAL_ROUTES.home),
                routeId: String((item as Record<string, unknown>).route_id || "ib.home"),
                restoreKey: String((item as Record<string, unknown>).restore_key || "home"),
                mobileRestore: Boolean((item as Record<string, unknown>).mobile_restore),
              }))
            : [],
          offlinePolicy: {
            draftQueueLimit: Number(asRecord(raw.offline_policy).draft_queue_limit || 0),
            resumableUploads: Boolean(asRecord(raw.offline_policy).resumable_uploads),
            backgroundSync: String(asRecord(raw.offline_policy).background_sync || "best_effort"),
            attachmentRetry: Boolean(asRecord(raw.offline_policy).attachment_retry),
            conflictResolution: String(
              asRecord(raw.offline_policy).conflict_resolution || "explicit_dialog",
            ),
            lowBandwidthMode: Boolean(asRecord(raw.offline_policy).low_bandwidth_mode),
            retryBackoffSeconds: Array.isArray(asRecord(raw.offline_policy).retry_backoff_seconds)
              ? (asRecord(raw.offline_policy).retry_backoff_seconds as unknown[]).map((value) =>
                  Number(value || 0),
                )
              : [],
          },
          diagnostics: {
            trustContract: Array.isArray(asRecord(raw.diagnostics).trust_contract)
              ? (asRecord(raw.diagnostics).trust_contract as Record<string, unknown>[]).map(
                  (item) => ({
                    key: String(item.key || "workflow"),
                    label: String(item.label || "Workflow"),
                    desktopFirst: Boolean(item.desktop_first),
                  }),
                )
              : [],
            successCriteria: Object.fromEntries(
              Object.entries(asRecord(asRecord(raw.diagnostics).success_criteria)).map(
                ([key, value]) => [key, String(value)],
              ),
            ),
            diagnosticCount: Number(asRecord(raw.diagnostics).diagnostic_count || 0),
            unhealthyCount: Number(asRecord(raw.diagnostics).unhealthy_count || 0),
          },
        } satisfies IbMobileHubPayload)
      : undefined,
  };
}

export function useIbOperationsPayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/operations");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          summaryMetrics: Array.isArray(raw.summary_metrics)
            ? raw.summary_metrics.map((metric) => ({
                label: String((metric as Record<string, unknown>).label || "Metric"),
                value: String((metric as Record<string, unknown>).value || "0"),
                detail: String((metric as Record<string, unknown>).detail || ""),
                tone:
                  ((metric as Record<string, unknown>)
                    .tone as IbOperationsPayload["summaryMetrics"][number]["tone"]) || undefined,
              }))
            : [],
          priorityExceptions: Array.isArray(raw.priority_exceptions)
            ? raw.priority_exceptions.map((item) => mapActionItem(item as Record<string, unknown>))
            : [],
          queues: (raw.queues as Record<string, number>) || {},
          programmeTabs: Array.isArray(raw.programme_tabs) ? raw.programme_tabs.map(String) : [],
          drilldowns: Array.isArray(raw.drilldowns)
            ? raw.drilldowns.map((row) => ({
                area: String((row as Record<string, unknown>).area || "Area"),
                signal: String((row as Record<string, unknown>).signal || ""),
                destination: String(
                  (row as Record<string, unknown>).destination || IB_CANONICAL_ROUTES.operations,
                ),
              }))
            : [],
          thresholdsApplied: (raw.thresholds_applied as Record<string, number>) || {},
          generatedAt: String(raw.generated_at || ""),
          dataMart: {
            documents: asRecord(asRecord(raw.data_mart).documents),
            evidence: asRecord(asRecord(raw.data_mart).evidence),
            publishing: asRecord(asRecord(raw.data_mart).publishing),
            specialist: asRecord(asRecord(raw.data_mart).specialist),
            programmes: asRecord(asRecord(raw.data_mart).programmes) as Record<string, number>,
            updatedAt: String(asRecord(raw.data_mart).updated_at || ""),
          },
          programmeHealthSummary: asRecord(raw.programme_health_summary) as Record<string, number>,
          pypIntelligence: {
            coverageHeatmap: asRecord(asRecord(raw.pyp_intelligence).coverage_heatmap) as Record<
              string,
              Record<string, number>
            >,
            overlapRows: Array.isArray(asRecord(raw.pyp_intelligence).overlap_rows)
              ? (asRecord(raw.pyp_intelligence).overlap_rows as Record<string, unknown>[]).map(
                  (row) => ({
                    id: Number(row.id || 0),
                    title: String(row.title || "POI row"),
                    yearLevel: String(row.year_level || "Year"),
                    theme: String(row.theme || "Theme"),
                    signal: String(row.signal || "watch"),
                    href: String(row.href || IB_CANONICAL_ROUTES.pypPoi),
                  }),
                )
              : [],
          },
          mypIntelligence: {
            conceptBalance: asRecord(asRecord(raw.myp_intelligence).concept_balance) as Record<
              string,
              number
            >,
            contextBalance: asRecord(asRecord(raw.myp_intelligence).context_balance) as Record<
              string,
              number
            >,
            atlBalance: asRecord(asRecord(raw.myp_intelligence).atl_balance) as Record<
              string,
              number
            >,
            criteriaBalance: asRecord(asRecord(raw.myp_intelligence).criteria_balance) as Record<
              string,
              number
            >,
          },
          dpRiskSummary: Array.isArray(raw.dp_risk_summary)
            ? (raw.dp_risk_summary as Record<string, unknown>[]).map((row) => ({
                id: Number(row.id || 0),
                title: String(row.title || "DP risk"),
                recordFamily: String(row.record_family || "record"),
                riskScore: Number(row.risk_score || 0),
                factors: Array.isArray(row.factors) ? row.factors.map(String) : [],
                threshold: Number(row.threshold || 0),
                href: String(row.href || IB_CANONICAL_ROUTES.dpCoordinator),
              }))
            : [],
          continuumExplorer: Object.fromEntries(
            Object.entries(asRecord(raw.continuum_explorer)).map(([programme, rows]) => [
              programme,
              Array.isArray(rows)
                ? (rows as Record<string, unknown>[]).map((row) => ({
                    id: Number(row.id || 0),
                    title: String(row.title || "Continuum entry"),
                    href: String(row.href || IB_CANONICAL_ROUTES.continuum),
                    documentType: String(row.document_type || "document"),
                    updatedAt: String(row.updated_at || ""),
                  }))
                : [],
            ]),
          ),
          bottlenecks: {
            stuckReasons: asRecord(asRecord(raw.bottlenecks).stuck_reasons) as Record<
              string,
              number
            >,
            slaRows: Array.isArray(asRecord(raw.bottlenecks).sla_rows)
              ? (asRecord(raw.bottlenecks).sla_rows as Record<string, unknown>[]).map((row) => ({
                  key: String(row.key || "queue"),
                  label: String(row.label || "Queue"),
                  atRisk: Number(row.at_risk || 0),
                  thresholdDays: Number(row.threshold_days || 0),
                }))
              : [],
          },
          recommendations: Array.isArray(raw.recommendations)
            ? (raw.recommendations as Record<string, unknown>[]).map((row) => ({
                id: String(row.id || "recommendation"),
                title: String(row.title || "Recommendation"),
                detail: String(row.detail || ""),
                href: String(row.href || IB_CANONICAL_ROUTES.operations),
                dismissible: Boolean(row.dismissible),
                impactMetric: typeof row.impact_metric === "string" ? row.impact_metric : undefined,
              }))
            : [],
          standardsInsights: Array.isArray(raw.standards_insights)
            ? (raw.standards_insights as Record<string, unknown>[]).map((row) => ({
                id: Number(row.id || 0),
                title: String(row.title || "Packet"),
                evidenceQuality: String(row.evidence_quality || "emerging"),
                reviewState: String(row.review_state || "draft"),
                exportStatus: String(row.export_status || "not_ready"),
                weakReason: String(row.weak_reason || ""),
                href: String(row.href || IB_CANONICAL_ROUTES.standardsPractices),
              }))
            : [],
          shareableView: {
            shareToken:
              typeof asRecord(raw.shareable_view).share_token === "string"
                ? String(asRecord(raw.shareable_view).share_token)
                : null,
            expiresAt:
              typeof asRecord(raw.shareable_view).expires_at === "string"
                ? String(asRecord(raw.shareable_view).expires_at)
                : null,
            snapshot: asRecord(asRecord(raw.shareable_view).snapshot),
          },
        } satisfies IbOperationsPayload)
      : undefined,
  };
}

export function useIbReviewQueue() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/reviews");
  const raw = response.data;
  const mapLaneItem = (
    lane: IbReviewLaneItem["lane"],
    item: Record<string, unknown>,
  ): IbReviewLaneItem => ({
    id: String(item.id || `${lane}-${String(item.href || "item")}`),
    lane,
    item: String(item.item || item.title || "Queue item"),
    detail: String(item.detail || ""),
    href: String(item.href || IB_CANONICAL_ROUTES.review),
    entityRef: typeof item.entity_ref === "string" ? item.entity_ref : undefined,
    routeId: typeof item.route_id === "string" ? item.route_id : undefined,
    fallbackRouteId:
      typeof item.fallback_route_id === "string" ? item.fallback_route_id : undefined,
    changedSinceLastSeen: Boolean(item.changed_since_last_seen),
    updatedAt: typeof item.updated_at === "string" ? item.updated_at : null,
  });

  return {
    ...response,
    data: raw
      ? ({
          approvals: Array.isArray(raw.approvals)
            ? raw.approvals.map((item) => mapLaneItem("approvals", item as Record<string, unknown>))
            : [],
          moderation: Array.isArray(raw.moderation)
            ? raw.moderation.map((item) =>
                mapLaneItem("moderation", item as Record<string, unknown>),
              )
            : [],
          comments: Array.isArray(raw.comments)
            ? raw.comments.map((item) => mapLaneItem("comments", item as Record<string, unknown>))
            : [],
        } satisfies IbReviewPayload)
      : undefined,
  };
}

export function useIbEvidenceItems(params: Record<string, string | number | undefined> = {}) {
  const query = buildQueryString(params);
  const response = useSchoolSWR<Record<string, unknown>[]>(`/api/v1/ib/evidence_items${query}`);
  return { ...response, data: response.data?.map(mapEvidenceItem) };
}

export function useIbReflectionRequests(params: Record<string, string | number | undefined> = {}) {
  const query = buildQueryString(params);
  const response = useSchoolSWR<Record<string, unknown>[]>(
    `/api/v1/ib/reflection_requests${query}`,
  );
  return { ...response, data: response.data?.map(mapReflectionRequest) };
}

export function useIbLearningStories(params: Record<string, string | number | undefined> = {}) {
  const query = buildQueryString(params);
  const response = useSchoolSWR<Record<string, unknown>[]>(`/api/v1/ib/learning_stories${query}`);
  return { ...response, data: response.data?.map(mapStory) };
}

export function useIbPublishingQueue() {
  const response = useSchoolSWR<Record<string, unknown>[]>("/api/v1/ib/publishing_queue_items");
  return {
    ...response,
    data: response.data?.map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        id: Number(raw.id),
        state: String(raw.state || "draft"),
        scheduledFor: (raw.scheduled_for as string | undefined) || null,
        deliveredAt: (raw.delivered_at as string | undefined) || null,
        heldReason: (raw.held_reason as string | undefined) || null,
        href: String(
          raw.href || IB_CANONICAL_ROUTES.familiesPublishingItem(raw.id as string | number),
        ),
        entityRef: typeof raw.entity_ref === "string" ? raw.entity_ref : undefined,
        routeId: typeof raw.route_id === "string" ? raw.route_id : undefined,
        fallbackRouteId:
          typeof raw.fallback_route_id === "string" ? raw.fallback_route_id : undefined,
        changedSinceLastSeen: Boolean(raw.changed_since_last_seen),
        updatedAt: typeof raw.updated_at === "string" ? raw.updated_at : null,
        story: mapStory((raw.story || {}) as Record<string, unknown>),
      } satisfies IbQueueItem;
    }),
  };
}

export function useIbDocumentComments(curriculumDocumentId: number | string | null) {
  const query = buildQueryString({ curriculum_document_id: curriculumDocumentId || undefined });
  const response = useSchoolSWR<Record<string, unknown>[]>(
    curriculumDocumentId ? `/api/v1/ib/document_comments${query}` : null,
  );

  function mapComment(comment: Record<string, unknown>): IbComment {
    return {
      id: Number(comment.id),
      authorId: Number(comment.author_id),
      authorLabel: typeof comment.author_label === "string" ? comment.author_label : null,
      commentType: String(comment.comment_type || "general"),
      status: String(comment.status || "open"),
      visibility: String(comment.visibility || "internal"),
      anchorPath: (comment.anchor_path as string | undefined) || null,
      body: String(comment.body || ""),
      parentCommentId:
        typeof comment.parent_comment_id === "number" ? comment.parent_comment_id : null,
      resolvedAt: typeof comment.resolved_at === "string" ? comment.resolved_at : null,
      metadata:
        comment.metadata && typeof comment.metadata === "object" && !Array.isArray(comment.metadata)
          ? (comment.metadata as Record<string, unknown>)
          : {},
      replyCount: Number(comment.reply_count || 0),
      replies: Array.isArray(comment.replies)
        ? (comment.replies as Record<string, unknown>[]).map((reply) => mapComment(reply))
        : [],
      createdAt: String(comment.created_at || ""),
      updatedAt: typeof comment.updated_at === "string" ? comment.updated_at : null,
    } satisfies IbComment;
  }

  return {
    ...response,
    data: response.data?.map((comment) => mapComment(comment)),
  };
}

export function useIbDocumentCollaborators(curriculumDocumentId: number | string | null) {
  const query = buildQueryString({ curriculum_document_id: curriculumDocumentId || undefined });
  const response = useSchoolSWR<Record<string, unknown>[]>(
    curriculumDocumentId ? `/api/v1/ib/document_collaborators${query}` : null,
  );
  return {
    ...response,
    data: response.data?.map(
      (item) =>
        ({
          id: Number(item.id),
          userId: Number(item.user_id),
          role: String(item.role || "co_planner"),
          status: String(item.status || "active"),
          contributionMode: String(item.contribution_mode || "full"),
          metadata: (item.metadata as Record<string, unknown>) || {},
        }) satisfies IbCollaborator,
    ),
  };
}

export function useIbOperationalRecords(params: Record<string, string | number | undefined> = {}) {
  const query = buildQueryString(params);
  const response = useSchoolSWR<Record<string, unknown>[]>(
    `/api/v1/ib/operational_records${query}`,
  );
  return {
    ...response,
    data: response.data?.map(
      (record) =>
        ({
          id: Number(record.id),
          programme: programmeFor(
            String(record.programme || "Mixed"),
          ) as IbOperationalRecord["programme"],
          planningContextId:
            typeof record.planning_context_id === "number" ? record.planning_context_id : null,
          curriculumDocumentId:
            typeof record.curriculum_document_id === "number"
              ? record.curriculum_document_id
              : null,
          studentId: typeof record.student_id === "number" ? record.student_id : null,
          ownerId: typeof record.owner_id === "number" ? record.owner_id : null,
          advisorId: typeof record.advisor_id === "number" ? record.advisor_id : null,
          recordFamily: String(record.record_family || "misc"),
          subtype: String(record.subtype || "item"),
          status: String(record.status || "draft"),
          priority: String(record.priority || "normal"),
          riskLevel: String(record.risk_level || "healthy"),
          dueOn: (record.due_on as string | undefined) || null,
          title: String(record.title || "Record"),
          summary: (record.summary as string | undefined) || null,
          nextAction: (record.next_action as string | undefined) || null,
          routeHint: (record.route_hint as string | undefined) || null,
          entityRef: (record.entity_ref as string | undefined) || undefined,
          routeId: (record.route_id as string | undefined) || undefined,
          href: String(record.href || record.route_hint || IB_CANONICAL_ROUTES.operations),
          fallbackRouteId: (record.fallback_route_id as string | undefined) || undefined,
          changedSinceLastSeen: Boolean(record.changed_since_last_seen),
          metadata:
            record.metadata &&
            typeof record.metadata === "object" &&
            !Array.isArray(record.metadata)
              ? (record.metadata as Record<string, unknown>)
              : {},
          curriculumDocumentTitle:
            typeof record.curriculum_document_title === "string"
              ? record.curriculum_document_title
              : null,
          studentName: typeof record.student_name === "string" ? record.student_name : null,
          ownerName: typeof record.owner_name === "string" ? record.owner_name : null,
          advisorName: typeof record.advisor_name === "string" ? record.advisor_name : null,
          checkpoints: Array.isArray(record.checkpoints)
            ? record.checkpoints.map((checkpoint) => ({
                id: Number((checkpoint as Record<string, unknown>).id),
                title: String((checkpoint as Record<string, unknown>).title || "Checkpoint"),
                status: String((checkpoint as Record<string, unknown>).status || "pending"),
                due_on:
                  ((checkpoint as Record<string, unknown>).due_on as string | undefined) || null,
                summary:
                  ((checkpoint as Record<string, unknown>).summary as string | undefined) || null,
              }))
            : [],
        }) satisfies IbOperationalRecord,
    ),
  };
}

export function useIbOperationalRecord(id: number | string | null | undefined) {
  const response = useSchoolSWR<Record<string, unknown>>(
    id ? `/api/v1/ib/operational_records/${id}` : null,
  );
  const record = response.data;

  return {
    ...response,
    data: record
      ? ({
          id: Number(record.id),
          programme: programmeFor(
            String(record.programme || "Mixed"),
          ) as IbOperationalRecord["programme"],
          planningContextId:
            typeof record.planning_context_id === "number" ? record.planning_context_id : null,
          curriculumDocumentId:
            typeof record.curriculum_document_id === "number"
              ? record.curriculum_document_id
              : null,
          studentId: typeof record.student_id === "number" ? record.student_id : null,
          ownerId: typeof record.owner_id === "number" ? record.owner_id : null,
          advisorId: typeof record.advisor_id === "number" ? record.advisor_id : null,
          recordFamily: String(record.record_family || "misc"),
          subtype: String(record.subtype || "item"),
          status: String(record.status || "draft"),
          priority: String(record.priority || "normal"),
          riskLevel: String(record.risk_level || "healthy"),
          dueOn: (record.due_on as string | undefined) || null,
          title: String(record.title || "Record"),
          summary: (record.summary as string | undefined) || null,
          nextAction: (record.next_action as string | undefined) || null,
          routeHint: (record.route_hint as string | undefined) || null,
          entityRef: (record.entity_ref as string | undefined) || undefined,
          routeId: (record.route_id as string | undefined) || undefined,
          href: String(record.href || record.route_hint || IB_CANONICAL_ROUTES.operations),
          fallbackRouteId: (record.fallback_route_id as string | undefined) || undefined,
          changedSinceLastSeen: Boolean(record.changed_since_last_seen),
          metadata:
            record.metadata &&
            typeof record.metadata === "object" &&
            !Array.isArray(record.metadata)
              ? (record.metadata as Record<string, unknown>)
              : {},
          curriculumDocumentTitle:
            typeof record.curriculum_document_title === "string"
              ? record.curriculum_document_title
              : null,
          studentName: typeof record.student_name === "string" ? record.student_name : null,
          ownerName: typeof record.owner_name === "string" ? record.owner_name : null,
          advisorName: typeof record.advisor_name === "string" ? record.advisor_name : null,
          checkpoints: Array.isArray(record.checkpoints)
            ? record.checkpoints.map((checkpoint) => ({
                id: Number((checkpoint as Record<string, unknown>).id),
                title: String((checkpoint as Record<string, unknown>).title || "Checkpoint"),
                status: String((checkpoint as Record<string, unknown>).status || "pending"),
                due_on:
                  ((checkpoint as Record<string, unknown>).due_on as string | undefined) || null,
                summary:
                  ((checkpoint as Record<string, unknown>).summary as string | undefined) || null,
              }))
            : [],
        } satisfies IbOperationalRecord)
      : undefined,
  };
}

export function useIbSpecialistPayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/specialist");
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          ownedUnits: Array.isArray(raw.owned_units)
            ? (raw.owned_units as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Owned unit"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
                contributionMode: String(item.contribution_mode || "comment"),
              }))
            : [],
          contributedUnits: Array.isArray(raw.contributed_units)
            ? (raw.contributed_units as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Contributed unit"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
                contributionMode: String(item.contribution_mode || "comment"),
              }))
            : [],
          weekItems: Array.isArray(raw.week_items)
            ? (raw.week_items as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Week item"),
                detail: String(item.detail || ""),
                dueOn: typeof item.due_on === "string" ? item.due_on : null,
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
              }))
            : [],
          requestedContributions: Array.isArray(raw.requested_contributions)
            ? (raw.requested_contributions as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Contribution"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
                contributionMode: String(item.contribution_mode || "comment"),
                role: String(item.role || "specialist_contributor"),
                status: String(item.status || "active"),
                handoffState: String(item.handoff_state || "active"),
              }))
            : [],
          pendingResponses: Array.isArray(raw.pending_responses)
            ? (raw.pending_responses as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Pending response"),
                detail: String(item.detail || ""),
                dueOn: typeof item.due_on === "string" ? item.due_on : null,
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
                handoffState: String(item.handoff_state || "awaiting_response"),
              }))
            : [],
          evidenceToSort: Array.isArray(raw.evidence_to_sort)
            ? (raw.evidence_to_sort as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                title: String(item.title || "Evidence"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.evidence),
                status: String(item.status || "needs_validation"),
              }))
            : [],
          overloadSignals: Array.isArray(raw.overload_signals)
            ? (raw.overload_signals as Record<string, unknown>[]).map((item) => ({
                userId: Number(item.user_id || 0),
                assignedCount: Number(item.assigned_count || 0),
                severity: String(item.severity || "watch"),
              }))
            : [],
          assignmentGaps: Array.isArray(raw.assignment_gaps)
            ? (raw.assignment_gaps as Record<string, unknown>[]).map((item) => ({
                documentId: Number(item.document_id || 0),
                title: String(item.title || "Unit"),
                href: String(item.href || IB_CANONICAL_ROUTES.specialist),
              }))
            : [],
          libraryItems: Array.isArray(raw.library_items)
            ? (raw.library_items as Record<string, unknown>[]).map((item) => ({
                id: Number(item.id || 0),
                programme: String(item.programme || "Mixed"),
                itemType: String(item.item_type || "resource"),
                title: String(item.title || "Library item"),
                summary: typeof item.summary === "string" ? item.summary : null,
                tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
                sourceEntityRef:
                  typeof item.source_entity_ref === "string" ? item.source_entity_ref : null,
                metadata: asRecord(item.metadata),
              }))
            : [],
        } satisfies IbSpecialistPayload)
      : undefined,
  };
}

export function useIbPoiPayload() {
  const response = useSchoolSWR<Record<string, unknown>[]>("/api/v1/ib/pyp/programme_of_inquiries");
  const raw = response.data?.[0];
  return {
    ...response,
    data: raw
      ? ({
          board: {
            id: Number(raw.id),
            title: String(raw.title || "Programme of inquiry"),
            status: String(raw.status || "draft"),
            entries: Array.isArray(raw.entries)
              ? raw.entries.map((entry) => ({
                  id: Number((entry as Record<string, unknown>).id),
                  yearLevel: String((entry as Record<string, unknown>).year_level || "Year"),
                  theme: String((entry as Record<string, unknown>).theme || "Theme"),
                  title: String((entry as Record<string, unknown>).title || "Untitled"),
                  centralIdea:
                    ((entry as Record<string, unknown>).central_idea as string | undefined) || null,
                  reviewState: String((entry as Record<string, unknown>).review_state || "draft"),
                  coherenceSignal: String(
                    (entry as Record<string, unknown>).coherence_signal || "healthy",
                  ),
                  specialistExpectations: Array.isArray(
                    (entry as Record<string, unknown>).specialist_expectations,
                  )
                    ? ((entry as Record<string, unknown>).specialist_expectations as unknown[]).map(
                        String,
                      )
                    : [],
                }))
              : [],
          },
          themes: Array.from(
            new Set(
              Array.isArray(raw.entries)
                ? raw.entries.map((entry) =>
                    String((entry as Record<string, unknown>).theme || "Theme"),
                  )
                : [],
            ),
          ),
          years: Array.from(
            new Set(
              Array.isArray(raw.entries)
                ? raw.entries.map((entry) =>
                    String((entry as Record<string, unknown>).year_level || "Year"),
                  )
                : [],
            ),
          ),
          summaryMetrics: [
            {
              label: "Mapped units",
              value: String(Array.isArray(raw.entries) ? raw.entries.length : 0),
            },
            {
              label: "Watch signals",
              value: String(
                Array.isArray(raw.entries)
                  ? raw.entries.filter(
                      (entry) =>
                        String((entry as Record<string, unknown>).coherence_signal || "") ===
                        "watch",
                    ).length
                  : 0,
              ),
            },
            {
              label: "Risk signals",
              value: String(
                Array.isArray(raw.entries)
                  ? raw.entries.filter(
                      (entry) =>
                        String((entry as Record<string, unknown>).coherence_signal || "") ===
                        "risk",
                    ).length
                  : 0,
              ),
            },
          ],
        } satisfies IbPoiPayload)
      : { board: null, themes: [], years: [], summaryMetrics: [] },
  };
}

export function useIbGuardianPayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/guardian");
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          stories: Array.isArray(raw.stories)
            ? raw.stories.map((story) => ({
                id: Number((story as Record<string, unknown>).id),
                title: String((story as Record<string, unknown>).title || "Story"),
                programme: String((story as Record<string, unknown>).programme || "IB"),
                summary: ((story as Record<string, unknown>).summary as string | undefined) || null,
                supportPrompt:
                  ((story as Record<string, unknown>).support_prompt as string | undefined) || null,
                cadence: String((story as Record<string, unknown>).cadence || "weekly_digest"),
                state: String((story as Record<string, unknown>).state || "published"),
                publishedAt:
                  ((story as Record<string, unknown>).published_at as string | undefined) || null,
                translationState:
                  ((story as Record<string, unknown>).translation_state as string | undefined) ||
                  "not_requested",
                availableLocales: Array.isArray(
                  (story as Record<string, unknown>).available_locales,
                )
                  ? ((story as Record<string, unknown>).available_locales as unknown[]).map(String)
                  : [],
              }))
            : [],
          releasedReports: Array.isArray(raw.released_reports)
            ? (raw.released_reports as Record<string, unknown>[]).map((report) => ({
                id: Number(report.id || 0),
                title: String(report.title || "Released report"),
                summary: typeof report.summary === "string" ? report.summary : null,
                reportFamily: String(report.report_family || "conference_packet"),
                programme: String(report.programme || "Mixed"),
                href: String(report.href || "/ib/reports"),
                releasedAt: typeof report.released_at === "string" ? report.released_at : null,
              }))
            : [],
          currentUnits: Array.isArray(raw.current_units)
            ? raw.current_units.map((unit) => ({
                id: Number((unit as Record<string, unknown>).id),
                title: String((unit as Record<string, unknown>).title || "Unit"),
                href: String(
                  (unit as Record<string, unknown>).href ||
                    IB_CANONICAL_ROUTES.guardianCurrentUnits,
                ),
                summary:
                  (unit as Record<string, unknown>).summary &&
                  typeof (unit as Record<string, unknown>).summary === "object" &&
                  !Array.isArray((unit as Record<string, unknown>).summary)
                    ? ((unit as Record<string, unknown>).summary as Record<string, unknown>)
                    : {},
              }))
            : [],
          portfolioHighlights: Array.isArray(raw.portfolio_highlights)
            ? raw.portfolio_highlights.map((item) => ({
                id: Number((item as Record<string, unknown>).id),
                title: String((item as Record<string, unknown>).title || "Highlight"),
                programme: String((item as Record<string, unknown>).programme || "IB"),
                summary: ((item as Record<string, unknown>).summary as string | undefined) || null,
                visibility: String(
                  (item as Record<string, unknown>).visibility || "guardian_visible",
                ),
              }))
            : [],
          calendarDigest: Array.isArray(raw.calendar_digest)
            ? raw.calendar_digest.map((item) => ({
                id: Number((item as Record<string, unknown>).id),
                title: String((item as Record<string, unknown>).title || "Milestone"),
                cadence: String((item as Record<string, unknown>).cadence || "Upcoming"),
                publishedAt:
                  ((item as Record<string, unknown>).published_at as string | undefined) || null,
              }))
            : [],
          milestoneDigest: Array.isArray(raw.milestone_digest)
            ? raw.milestone_digest.map((item) => ({
                id: Number((item as Record<string, unknown>).id),
                title: String((item as Record<string, unknown>).title || "Milestone"),
                programme: String((item as Record<string, unknown>).programme || "IB"),
                cadence: String((item as Record<string, unknown>).cadence || "Upcoming"),
                publishedAt:
                  ((item as Record<string, unknown>).published_at as string | undefined) || null,
                href: String(
                  (item as Record<string, unknown>).href || IB_CANONICAL_ROUTES.guardianHome,
                ),
              }))
            : [],
          progressSummary: {
            storyCount: Number(
              (raw.progress_summary as Record<string, unknown> | undefined)?.story_count || 0,
            ),
            highlightCount: Number(
              (raw.progress_summary as Record<string, unknown> | undefined)?.highlight_count || 0,
            ),
            supportPrompts: Number(
              (raw.progress_summary as Record<string, unknown> | undefined)?.support_prompts || 0,
            ),
          },
          visibilityPolicy: {
            storyStates: Array.isArray(asRecord(raw.visibility_policy).story_states)
              ? (asRecord(raw.visibility_policy).story_states as unknown[]).map(String)
              : [],
            evidenceVisibility: Array.isArray(asRecord(raw.visibility_policy).evidence_visibility)
              ? (asRecord(raw.visibility_policy).evidence_visibility as unknown[]).map(String)
              : [],
            noiseBudget: asRecord(asRecord(raw.visibility_policy).noise_budget) as Record<
              string,
              number
            >,
            moderationPolicy: asRecord(asRecord(raw.visibility_policy).moderation_policy),
          },
          currentUnitWindows: Array.isArray(raw.current_unit_windows)
            ? (raw.current_unit_windows as Record<string, unknown>[]).map((window) => ({
                id: Number(window.id || 0),
                title: String(window.title || "Unit window"),
                href: String(window.href || IB_CANONICAL_ROUTES.guardianCurrentUnits),
                summary: asRecord(window.summary),
              }))
            : [],
          studentOptions: Array.isArray(raw.student_options)
            ? (raw.student_options as Record<string, unknown>[]).map((student) => ({
                id: Number(student.id || 0),
                label: String(student.label || "Student"),
                relationship: String(student.relationship || "family"),
              }))
            : [],
          interactions: {
            acknowledgements: Array.isArray(asRecord(raw.interactions).acknowledgements)
              ? (asRecord(raw.interactions).acknowledgements as Record<string, unknown>[]).map(
                  (item) => ({
                    id: Number(item.id || 0),
                    title: String(item.title || "Acknowledgement"),
                    detail: String(item.detail || ""),
                    occurredAt: String(item.occurred_at || ""),
                  }),
                )
              : [],
            responses: Array.isArray(asRecord(raw.interactions).responses)
              ? (asRecord(raw.interactions).responses as Record<string, unknown>[]).map((item) => ({
                  id: Number(item.id || 0),
                  title: String(item.title || "Response"),
                  detail: String(item.detail || ""),
                  occurredAt: String(item.occurred_at || ""),
                }))
              : [],
          },
          digestStrategy: {
            cadenceOptions: Array.isArray(asRecord(raw.digest_strategy).cadence_options)
              ? (asRecord(raw.digest_strategy).cadence_options as unknown[]).map(String)
              : [],
            currentPreferences: asRecord(asRecord(raw.digest_strategy).current_preferences),
            communicationPreferences: asRecord(
              asRecord(raw.digest_strategy).communication_preferences,
            ),
            urgentCount: Number(asRecord(raw.digest_strategy).urgent_count || 0),
            routineStoryCount: Number(asRecord(raw.digest_strategy).routine_story_count || 0),
          },
          deliveryReceipts: Array.isArray(raw.delivery_receipts)
            ? (raw.delivery_receipts as Record<string, unknown>[]).map((receipt) => ({
                id: String(receipt.id || "receipt"),
                state: String(receipt.state || "delivered"),
                deliverableType: String(receipt.deliverable_type || "IbReport"),
                deliverableId: Number(receipt.deliverable_id || 0),
                readAt: typeof receipt.read_at === "string" ? receipt.read_at : null,
                acknowledgedAt:
                  typeof receipt.acknowledged_at === "string" ? receipt.acknowledged_at : null,
              }))
            : [],
          familyCharter: Object.fromEntries(
            Object.entries(asRecord(raw.family_charter)).map(([key, value]) => [
              key,
              String(value),
            ]),
          ),
          howToHelp: Array.isArray(raw.how_to_help)
            ? (raw.how_to_help as Record<string, unknown>[]).map((card) => ({
                id: Number(card.id || 0),
                title: String(card.title || "Support card"),
                prompt: typeof card.prompt === "string" ? card.prompt : null,
              }))
            : [],
          preferences: mapNotificationPreferences(raw.preferences),
          communicationPreferences: {
            locale: String(asRecord(raw.communication_preferences).locale || "en"),
            digestCadence: String(
              asRecord(raw.communication_preferences).digest_cadence || "weekly_digest",
            ),
            quietHoursStart: String(
              asRecord(raw.communication_preferences).quiet_hours_start || "20:00",
            ),
            quietHoursEnd: String(
              asRecord(raw.communication_preferences).quiet_hours_end || "07:00",
            ),
            quietHoursTimezone: String(
              asRecord(raw.communication_preferences).quiet_hours_timezone || "UTC",
            ),
            deliveryRules: asRecord(asRecord(raw.communication_preferences).delivery_rules),
          },
        } satisfies IbGuardianPayload)
      : undefined,
  };
}

export function useIbStudentPayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/student");
  const raw = response.data;

  function mapRecord(item: Record<string, unknown>) {
    return {
      id: Number(item.id),
      programme: String(item.programme || "Mixed"),
      recordFamily: String(item.record_family || "record"),
      title: String(item.title || "Record"),
      summary: (item.summary as string | undefined) || null,
      nextAction: (item.next_action as string | undefined) || null,
      dueOn: (item.due_on as string | undefined) || null,
      riskLevel: String(item.risk_level || "healthy"),
      href: String(item.href || IB_CANONICAL_ROUTES.studentHome),
    };
  }

  return {
    ...response,
    data: raw
      ? ({
          nextCheckpoints: Array.isArray(raw.next_checkpoints)
            ? raw.next_checkpoints.map((item) => mapRecord(item as Record<string, unknown>))
            : [],
          reflectionsDue: Array.isArray(raw.reflections_due)
            ? raw.reflections_due.map((item) => ({
                id: Number((item as Record<string, unknown>).id),
                title: String((item as Record<string, unknown>).title || "Reflection"),
                summary: ((item as Record<string, unknown>).summary as string | undefined) || null,
                status: String((item as Record<string, unknown>).status || "requested"),
                visibility: String((item as Record<string, unknown>).visibility || "internal"),
              }))
            : [],
          validatedEvidence: Array.isArray(raw.validated_evidence)
            ? raw.validated_evidence.map((item) => ({
                id: Number((item as Record<string, unknown>).id),
                title: String((item as Record<string, unknown>).title || "Evidence"),
                summary: ((item as Record<string, unknown>).summary as string | undefined) || null,
                status: String((item as Record<string, unknown>).status || "validated"),
                visibility: String((item as Record<string, unknown>).visibility || "internal"),
              }))
            : [],
          projectMilestones: Array.isArray(raw.project_milestones)
            ? raw.project_milestones.map((item) => mapRecord(item as Record<string, unknown>))
            : [],
          releasedReports: Array.isArray(raw.released_reports)
            ? (raw.released_reports as Record<string, unknown>[]).map((report) => ({
                id: Number(report.id || 0),
                title: String(report.title || "Released report"),
                summary: typeof report.summary === "string" ? report.summary : null,
                reportFamily: String(report.report_family || "conference_packet"),
                programme: String(report.programme || "Mixed"),
                href: String(report.href || "/ib/reports"),
                releasedAt: typeof report.released_at === "string" ? report.released_at : null,
              }))
            : [],
          learningTimeline: Array.isArray(raw.learning_timeline)
            ? (raw.learning_timeline as Record<string, unknown>[]).map((item) => ({
                id: String(item.id || "timeline"),
                title: String(item.title || "Timeline item"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.studentHome),
                kind: String(item.kind || "timeline"),
                programme: String(item.programme || "Mixed"),
                status: String(item.status || "active"),
              }))
            : [],
          goals: Array.isArray(raw.goals)
            ? (raw.goals as Record<string, unknown>[]).map((goal) => ({
                id: Number(goal.id || 0),
                title: String(goal.title || "Goal"),
                description: typeof goal.description === "string" ? goal.description : null,
                status: String(goal.status || "active"),
                progressPercent:
                  typeof goal.progress_percent === "number"
                    ? goal.progress_percent
                    : Number(goal.progress_percent || 0),
                targetDate:
                  typeof goal.target_date === "string" ? goal.target_date : (null as string | null),
              }))
            : [],
          nextActions: Array.isArray(raw.next_actions)
            ? (raw.next_actions as Record<string, unknown>[]).map((item) => ({
                id: String(item.id || "action"),
                title: String(item.title || "Next action"),
                detail: String(item.detail || ""),
                href: String(item.href || IB_CANONICAL_ROUTES.studentHome),
                tone: typeof item.tone === "string" ? item.tone : undefined,
              }))
            : [],
          reflectionSystem: {
            prompts: Array.isArray(asRecord(raw.reflection_system).prompts)
              ? (asRecord(raw.reflection_system).prompts as Record<string, unknown>[]).map(
                  (prompt) => ({
                    key: String(prompt.key || "prompt"),
                    title: String(prompt.title || "Reflection prompt"),
                    prompt: String(prompt.prompt || ""),
                  }),
                )
              : [],
            history: Array.isArray(asRecord(raw.reflection_system).history)
              ? (asRecord(raw.reflection_system).history as Record<string, unknown>[]).map(
                  (item) => ({
                    id: Number(item.id || 0),
                    prompt: String(item.prompt || "Reflection"),
                    status: String(item.status || "requested"),
                    dueOn: typeof item.due_on === "string" ? item.due_on : null,
                    responseExcerpt:
                      typeof item.response_excerpt === "string" ? item.response_excerpt : null,
                    evidenceTitle:
                      typeof item.evidence_title === "string" ? item.evidence_title : null,
                  }),
                )
              : [],
          },
          growthVisualization: {
            criteria: Array.isArray(asRecord(raw.growth_visualization).criteria)
              ? (asRecord(raw.growth_visualization).criteria as Record<string, unknown>[]).map(
                  (point) => ({
                    label: String(point.label || "Point"),
                    value: Number(point.value || 0),
                  }),
                )
              : [],
            atl: Array.isArray(asRecord(raw.growth_visualization).atl)
              ? (asRecord(raw.growth_visualization).atl as Record<string, unknown>[]).map(
                  (point) => ({
                    label: String(point.label || "Point"),
                    value: Number(point.value || 0),
                  }),
                )
              : [],
            learnerProfile: Array.isArray(asRecord(raw.growth_visualization).learner_profile)
              ? (
                  asRecord(raw.growth_visualization).learner_profile as Record<string, unknown>[]
                ).map((point) => ({
                  label: String(point.label || "Point"),
                  value: Number(point.value || 0),
                }))
              : [],
          },
          milestoneJourney: Array.isArray(raw.milestone_journey)
            ? (raw.milestone_journey as Record<string, unknown>[]).map((row) => ({
                id: Number(row.id || 0),
                title: String(row.title || "Milestone"),
                programme: String(row.programme || "Mixed"),
                status: String(row.status || "active"),
                dueOn: typeof row.due_on === "string" ? row.due_on : null,
                nextAction: typeof row.next_action === "string" ? row.next_action : null,
                href: String(row.href || IB_CANONICAL_ROUTES.studentProjects),
                checkpoints: Array.isArray(row.checkpoints)
                  ? (row.checkpoints as Record<string, unknown>[]).map((checkpoint) => ({
                      id: Number(checkpoint.id || 0),
                      title: String(checkpoint.title || "Checkpoint"),
                      status: String(checkpoint.status || "pending"),
                    }))
                  : [],
              }))
            : [],
          peerFeedback: {
            enabled: Boolean(asRecord(raw.peer_feedback).enabled),
            moderationRequired: Boolean(asRecord(raw.peer_feedback).moderation_required),
            guidelines: Array.isArray(asRecord(raw.peer_feedback).guidelines)
              ? (asRecord(raw.peer_feedback).guidelines as unknown[]).map(String)
              : [],
            recentFeedback: Array.isArray(asRecord(raw.peer_feedback).recent_feedback)
              ? (asRecord(raw.peer_feedback).recent_feedback as Record<string, unknown>[]).map(
                  (item) => ({
                    id: Number(item.id || 0),
                    title: String(item.title || "Peer feedback"),
                    detail: String(item.detail || ""),
                  }),
                )
              : [],
          },
          portfolio: {
            evidenceResults: Array.isArray(asRecord(raw.portfolio).evidence_results)
              ? (asRecord(raw.portfolio).evidence_results as Record<string, unknown>[]).map(
                  (item) => ({
                    id: Number(item.id || 0),
                    title: String(item.title || "Evidence"),
                    detail: typeof item.detail === "string" ? item.detail : null,
                    href: String(item.href || IB_CANONICAL_ROUTES.studentPortfolio),
                    programme: String(item.programme || "Mixed"),
                  }),
                )
              : [],
            collections: Array.isArray(asRecord(raw.portfolio).collections)
              ? (asRecord(raw.portfolio).collections as Record<string, unknown>[]).map((item) => ({
                  id: Number(item.id || 0),
                  title: String(item.title || "Collection"),
                  visibility: String(item.visibility || "private"),
                  itemCount: Number(item.item_count || 0),
                  sharedToken: typeof item.shared_token === "string" ? item.shared_token : null,
                }))
              : [],
          },
          quickActions: Array.isArray(raw.quick_actions)
            ? (raw.quick_actions as Record<string, unknown>[]).map((action) => ({
                id: String(action.id || "quick-action"),
                label: String(action.label || "Quick action"),
                detail: String(action.detail || ""),
                href: String(action.href || IB_CANONICAL_ROUTES.studentHome),
              }))
            : [],
          notificationPreferences: mapNotificationPreferences(raw.notification_preferences),
          communicationPreferences: {
            locale: String(asRecord(raw.communication_preferences).locale || "en"),
            digestCadence: String(
              asRecord(raw.communication_preferences).digest_cadence || "weekly_digest",
            ),
            quietHoursStart: String(
              asRecord(raw.communication_preferences).quiet_hours_start || "20:00",
            ),
            quietHoursEnd: String(
              asRecord(raw.communication_preferences).quiet_hours_end || "07:00",
            ),
            quietHoursTimezone: String(
              asRecord(raw.communication_preferences).quiet_hours_timezone || "UTC",
            ),
            deliveryRules: asRecord(asRecord(raw.communication_preferences).delivery_rules),
          },
          deliveryReceipts: Array.isArray(raw.delivery_receipts)
            ? (raw.delivery_receipts as Record<string, unknown>[]).map((receipt) => ({
                id: String(receipt.id || "receipt"),
                state: String(receipt.state || "delivered"),
                deliverableType: String(receipt.deliverable_type || "IbReport"),
                deliverableId: Number(receipt.deliverable_id || 0),
                readAt: typeof receipt.read_at === "string" ? receipt.read_at : null,
                acknowledgedAt:
                  typeof receipt.acknowledged_at === "string" ? receipt.acknowledged_at : null,
              }))
            : [],
          releaseGates: Object.fromEntries(
            Object.entries(asRecord(raw.release_gates)).map(([key, value]) => [
              key,
              Boolean(value),
            ]),
          ),
        } satisfies IbStudentPayload)
      : undefined,
  };
}

function mapStandardsPacket(packet: Record<string, unknown>): IbStandardsPacket {
  const rawScoreSummary =
    packet.score_summary &&
    typeof packet.score_summary === "object" &&
    !Array.isArray(packet.score_summary)
      ? (packet.score_summary as Record<string, unknown>)
      : null;

  return {
    id: Number(packet.id),
    code: String(packet.code || "Packet"),
    title: String(packet.title || "Untitled packet"),
    reviewState: String(packet.review_state || "draft"),
    reviewerId: typeof packet.reviewer_id === "number" ? packet.reviewer_id : null,
    evidenceStrength: String(packet.evidence_strength || "emerging"),
    exportStatus: String(packet.export_status || "not_ready"),
    routeId: typeof packet.route_id === "string" ? packet.route_id : undefined,
    href: String(packet.href || IB_CANONICAL_ROUTES.standardsPacket(packet.id as string | number)),
    scoreSummary: rawScoreSummary
      ? {
          completenessScore: Number(rawScoreSummary.completeness_score || 0),
          reviewedItemCount: Number(rawScoreSummary.reviewed_item_count || 0),
          approvedItemCount: Number(rawScoreSummary.approved_item_count || 0),
          totalItemCount: Number(rawScoreSummary.total_item_count || 0),
          evidenceStrength: String(rawScoreSummary.evidence_strength || "emerging"),
        }
      : undefined,
    exportHistory: Array.isArray(packet.export_history)
      ? (packet.export_history as Record<string, unknown>[]).map((exportRow) => ({
          id: Number(exportRow.id),
          status: String(exportRow.status || "queued"),
          createdAt: (exportRow.created_at as string | undefined) || null,
          artifactUrl: (exportRow.artifact_url as string | undefined) || null,
        }))
      : undefined,
    items: Array.isArray(packet.items)
      ? (packet.items as Record<string, unknown>[]).map((item) => ({
          id: Number(item.id),
          sourceType: String(item.source_type || "source"),
          sourceId: Number(item.source_id || 0),
          reviewState: String(item.review_state || "draft"),
          summary: (item.summary as string | undefined) || null,
          provenanceHref: (item.provenance_href as string | undefined) || null,
        }))
      : [],
  };
}

function mapStandardsCycle(cycle: Record<string, unknown>): IbStandardsCycle {
  return {
    id: Number(cycle.id),
    title: String(cycle.title || "Cycle"),
    status: String(cycle.status || "open"),
    exportCount: typeof cycle.export_count === "number" ? cycle.export_count : undefined,
    packets: Array.isArray(cycle.packets)
      ? cycle.packets.map((packet) => mapStandardsPacket(packet as Record<string, unknown>))
      : [],
  };
}

export function useIbStandardsCycles() {
  const response = useSchoolSWR<Record<string, unknown>[]>("/api/v1/ib/standards_cycles");
  return {
    ...response,
    data: response.data?.map((cycle) => mapStandardsCycle(cycle)),
  };
}

export function useIbProgrammeSettings() {
  return useSchoolSWR<IbProgrammeSetting[]>("/api/v1/ib/programme_settings");
}

export function useIbRolloutPayload() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/rollout");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          activePack: {
            key: String(
              (raw.active_pack as Record<string, unknown> | undefined)?.key || "ib_continuum_v1",
            ),
            version: String(
              (raw.active_pack as Record<string, unknown> | undefined)?.version || "unknown",
            ),
            expectedVersion: String(
              (raw.active_pack as Record<string, unknown> | undefined)?.expected_version ||
                "2026.2",
            ),
            usingCurrentPack: Boolean(
              (raw.active_pack as Record<string, unknown> | undefined)?.using_current_pack,
            ),
            deprecatedRecordCount: Number(
              (raw.active_pack as Record<string, unknown> | undefined)?.deprecated_record_count ||
                0,
            ),
          },
          featureFlags: {
            required: Array.isArray(
              (raw.feature_flags as Record<string, unknown> | undefined)?.required,
            )
              ? (
                  (raw.feature_flags as Record<string, unknown>).required as Record<
                    string,
                    unknown
                  >[]
                ).map((flag) => ({
                  key: String(flag.key || "flag"),
                  enabled: Boolean(flag.enabled),
                }))
              : [],
            healthy: Boolean((raw.feature_flags as Record<string, unknown> | undefined)?.healthy),
            bundles: Array.isArray(
              (raw.feature_flags as Record<string, unknown> | undefined)?.bundles,
            )
              ? (
                  (raw.feature_flags as Record<string, unknown>).bundles as Record<
                    string,
                    unknown
                  >[]
                ).map((bundle) => ({
                  key: String(bundle.key || "bundle"),
                  flags: Array.isArray(bundle.flags)
                    ? (bundle.flags as Record<string, unknown>[]).map((flag) => ({
                        key: String(flag.key || "flag"),
                        enabled: Boolean(flag.enabled),
                      }))
                    : [],
                  enabledCount: Number(bundle.enabled_count || 0),
                  complete: Boolean(bundle.complete),
                }))
              : [],
            inventory: Array.isArray(
              (raw.feature_flags as Record<string, unknown> | undefined)?.inventory,
            )
              ? (
                  (raw.feature_flags as Record<string, unknown>).inventory as Record<
                    string,
                    unknown
                  >[]
                ).map((row) => ({
                  key: String(row.key || "flag"),
                  enabled: Boolean(row.enabled),
                  owner: String(row.owner || "platform"),
                  stage: String(row.stage || "phase8"),
                  dependsOn: Array.isArray(row.depends_on) ? row.depends_on.map(String) : [],
                  bundle: String(row.bundle || "ga_candidate"),
                  killSwitch: Boolean(row.kill_switch),
                  dependencyHealth: Boolean(row.dependency_health),
                }))
              : [],
            killSwitches: Array.isArray(
              (raw.feature_flags as Record<string, unknown> | undefined)?.kill_switches,
            )
              ? (
                  (raw.feature_flags as Record<string, unknown>).kill_switches as Record<
                    string,
                    unknown
                  >[]
                ).map((row) => ({
                  key: String(row.key || "flag"),
                  enabled: Boolean(row.enabled),
                  owner: String(row.owner || "platform"),
                  stage: String(row.stage || "phase8"),
                  dependsOn: Array.isArray(row.depends_on) ? row.depends_on.map(String) : [],
                  bundle: String(row.bundle || "ga_candidate"),
                  killSwitch: Boolean(row.kill_switch),
                  dependencyHealth: Boolean(row.dependency_health),
                }))
              : [],
          },
          releaseBaseline: raw.release_baseline
            ? {
                id: Number((raw.release_baseline as Record<string, unknown>).id || 0),
                releaseChannel: String(
                  (raw.release_baseline as Record<string, unknown>).release_channel ||
                    "ib-ga-candidate",
                ),
                status: String((raw.release_baseline as Record<string, unknown>).status || "draft"),
                packKey: String(
                  (raw.release_baseline as Record<string, unknown>).pack_key || "ib_continuum_v1",
                ),
                packVersion: String(
                  (raw.release_baseline as Record<string, unknown>).pack_version || "2026.2",
                ),
                ciStatus: String(
                  (raw.release_baseline as Record<string, unknown>).ci_status || "pending",
                ),
                migrationStatus: String(
                  (raw.release_baseline as Record<string, unknown>).migration_status || "pending",
                ),
                checklist:
                  ((raw.release_baseline as Record<string, unknown>).checklist as Record<
                    string,
                    { label?: string; status: string; detail: string; remediation: string }
                  >) || {},
                blockers: Array.isArray((raw.release_baseline as Record<string, unknown>).blockers)
                  ? (
                      (raw.release_baseline as Record<string, unknown>).blockers as Record<
                        string,
                        unknown
                      >[]
                    ).map((blocker) => ({
                      key: String(blocker.key || "blocker"),
                      detail: String(blocker.detail || ""),
                      remediation: String(blocker.remediation || ""),
                    }))
                  : [],
                verifiedAt:
                  typeof (raw.release_baseline as Record<string, unknown>).verified_at === "string"
                    ? ((raw.release_baseline as Record<string, unknown>).verified_at as string)
                    : null,
                certifiedAt:
                  typeof (raw.release_baseline as Record<string, unknown>).certified_at === "string"
                    ? ((raw.release_baseline as Record<string, unknown>).certified_at as string)
                    : null,
                rolledBackAt:
                  typeof (raw.release_baseline as Record<string, unknown>).rolled_back_at ===
                  "string"
                    ? ((raw.release_baseline as Record<string, unknown>).rolled_back_at as string)
                    : null,
              }
            : null,
          pilotBaseline: raw.pilot_baseline
            ? {
                packKey: String(
                  (raw.pilot_baseline as Record<string, unknown> | undefined)?.pack_key ||
                    "ib_continuum_v1",
                ),
                packVersion: String(
                  (raw.pilot_baseline as Record<string, unknown> | undefined)?.pack_version ||
                    "2026.2",
                ),
                releaseChannel: String(
                  (raw.pilot_baseline as Record<string, unknown> | undefined)?.release_channel ||
                    "ib-pilot",
                ),
                releaseFrozen: Boolean(
                  (raw.pilot_baseline as Record<string, unknown> | undefined)?.release_frozen,
                ),
                baselineApplied: Boolean(
                  (raw.pilot_baseline as Record<string, unknown> | undefined)?.baseline_applied,
                ),
              }
            : undefined,
          pilotSetup: raw.pilot_setup
            ? {
                status: String(
                  (raw.pilot_setup as Record<string, unknown> | undefined)?.status || "not_started",
                ),
                completedSteps: Number(
                  (
                    (raw.pilot_setup as Record<string, unknown> | undefined)?.summary_metrics as
                      | Record<string, unknown>
                      | undefined
                  )?.completed_steps || 0,
                ),
                totalSteps: Number(
                  (
                    (raw.pilot_setup as Record<string, unknown> | undefined)?.summary_metrics as
                      | Record<string, unknown>
                      | undefined
                  )?.total_steps || 0,
                ),
                blockerCount: Number(
                  (
                    (raw.pilot_setup as Record<string, unknown> | undefined)?.summary_metrics as
                      | Record<string, unknown>
                      | undefined
                  )?.blocker_count || 0,
                ),
                warningCount: Number(
                  (
                    (raw.pilot_setup as Record<string, unknown> | undefined)?.summary_metrics as
                      | Record<string, unknown>
                      | undefined
                  )?.warning_count || 0,
                ),
              }
            : null,
          routeReadiness: {
            checkedCount: Number(
              (raw.route_readiness as Record<string, unknown> | undefined)?.checked_count || 0,
            ),
            canonicalCount: Number(
              (raw.route_readiness as Record<string, unknown> | undefined)?.canonical_count || 0,
            ),
            fallbackCount: Number(
              (raw.route_readiness as Record<string, unknown> | undefined)?.fallback_count || 0,
            ),
            healthy: Boolean((raw.route_readiness as Record<string, unknown> | undefined)?.healthy),
          },
          migrationDrift: {
            documentCount: Number(
              (raw.migration_drift as Record<string, unknown> | undefined)?.document_count || 0,
            ),
            byPackVersion:
              ((raw.migration_drift as Record<string, unknown> | undefined)
                ?.by_pack_version as Record<string, number>) || {},
            bySchemaKey:
              ((raw.migration_drift as Record<string, unknown> | undefined)
                ?.by_schema_key as Record<string, number>) || {},
            missingSchemaKey: Number(
              (raw.migration_drift as Record<string, unknown> | undefined)?.missing_schema_key || 0,
            ),
            missingRouteHintRecords: Number(
              (raw.migration_drift as Record<string, unknown> | undefined)
                ?.missing_route_hint_records || 0,
            ),
          },
          programmeSettings: {
            rows: Array.isArray(
              (raw.programme_settings as Record<string, unknown> | undefined)?.rows,
            )
              ? ((raw.programme_settings as Record<string, unknown>).rows as IbProgrammeSetting[])
              : [],
            completeCount: Number(
              (raw.programme_settings as Record<string, unknown> | undefined)?.complete_count || 0,
            ),
            incompleteProgrammes: Array.isArray(
              (raw.programme_settings as Record<string, unknown> | undefined)
                ?.incomplete_programmes,
            )
              ? (
                  (raw.programme_settings as Record<string, unknown>)
                    .incomplete_programmes as unknown[]
                ).map(String)
              : [],
          },
          academicYear: {
            planningContextCount: Number(
              (raw.academic_year as Record<string, unknown> | undefined)?.planning_context_count ||
                0,
            ),
            pinnedContextCount: Number(
              (raw.academic_year as Record<string, unknown> | undefined)?.pinned_context_count || 0,
            ),
            healthy: Boolean((raw.academic_year as Record<string, unknown> | undefined)?.healthy),
          },
          legacyUsage: {
            legacyDocumentRoutes: Number(
              (raw.legacy_usage as Record<string, unknown> | undefined)?.legacy_document_routes ||
                0,
            ),
            legacyOperationalRoutes: Number(
              (raw.legacy_usage as Record<string, unknown> | undefined)
                ?.legacy_operational_routes || 0,
            ),
            demoRoutes: Number(
              (raw.legacy_usage as Record<string, unknown> | undefined)?.demo_routes || 0,
            ),
          },
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbRolloutPayload)
      : undefined,
  };
}

export function useIbPilotReadiness() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/pilot_readiness", {
    refreshInterval: 60_000,
  });
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          overallStatus: String(
            raw.overall_status || "yellow",
          ) as IbPilotReadinessPayload["overallStatus"],
          sections: Array.isArray(raw.sections)
            ? raw.sections.map((section) => ({
                key: String((section as Record<string, unknown>).key || "section"),
                title: String((section as Record<string, unknown>).title || "Section"),
                status: String((section as Record<string, unknown>).status || "yellow") as
                  | "green"
                  | "yellow"
                  | "red",
                summary: String((section as Record<string, unknown>).summary || ""),
                issues: Array.isArray((section as Record<string, unknown>).issues)
                  ? ((section as Record<string, unknown>).issues as unknown[]).map(String)
                  : [],
                rules: Array.isArray((section as Record<string, unknown>).rules)
                  ? ((section as Record<string, unknown>).rules as Record<string, unknown>[]).map(
                      (rule) => ({
                        id: String(rule.id || "rule"),
                        severity: String(rule.severity || "info") as "info" | "warning" | "blocker",
                        status: String(rule.status || "pass") as "pass" | "fail",
                        detail: String(rule.detail || ""),
                        remediation: String(rule.remediation || ""),
                        href: String(rule.href || IB_CANONICAL_ROUTES.readiness),
                      }),
                    )
                  : [],
              }))
            : [],
          generatedAt: String(raw.generated_at || ""),
          staleAfterSeconds: Number(raw.stale_after_seconds || 300),
        } satisfies IbPilotReadinessPayload)
      : undefined,
  };
}

export function useIbReports(params: Record<string, string | number | undefined> = {}) {
  const query = buildQueryString(params);
  const response = useSchoolSWR<Record<string, unknown>[] | Record<string, unknown>>(
    `/api/v1/ib/reports${query}`,
  );

  return {
    ...response,
    data: Array.isArray(response.data)
      ? response.data.map((item) => mapIbReport(item))
      : response.data && typeof response.data === "object"
        ? [mapIbReport(response.data as Record<string, unknown>)]
        : [],
  };
}

export function useIbCollaborationSessions(curriculumDocumentId: number | string | null) {
  const query = buildQueryString({ curriculum_document_id: curriculumDocumentId || undefined });
  const response = useSchoolSWR<Record<string, unknown>>(
    curriculumDocumentId ? `/api/v1/ib/collaboration_sessions${query}` : null,
    { refreshInterval: 15_000 },
  );
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          documentId: Number(raw.document_id || 0),
          currentSessionId:
            typeof raw.current_session_id === "number" ? raw.current_session_id : null,
          channelTopology: Array.isArray(raw.channel_topology)
            ? (raw.channel_topology as Record<string, unknown>[]).map((row) => ({
                key: String(row.key || "channel"),
                scope: String(row.scope || "document"),
                transport: String(row.transport || "polling"),
                auth: String(row.auth || "show"),
              }))
            : [],
          concurrencyPolicy: Object.fromEntries(
            Object.entries(
              raw.concurrency_policy &&
                typeof raw.concurrency_policy === "object" &&
                !Array.isArray(raw.concurrency_policy)
                ? (raw.concurrency_policy as Record<string, unknown>)
                : {},
            ).map(([key, value]) => [key, String(value)]),
          ),
          activeSessions: Array.isArray(raw.active_sessions)
            ? (raw.active_sessions as Record<string, unknown>[]).map((session) => ({
                id: Number(session.id || 0),
                userId: Number(session.user_id || 0),
                userLabel: typeof session.user_label === "string" ? session.user_label : null,
                role: String(session.role || "editor"),
                scopeType: String(session.scope_type || "document"),
                scopeKey: String(session.scope_key || "root"),
                status: String(session.status || "active"),
                deviceLabel: typeof session.device_label === "string" ? session.device_label : null,
                lastSeenAt: String(session.last_seen_at || ""),
                expiresAt: typeof session.expires_at === "string" ? session.expires_at : null,
                editingSameScope: Boolean(session.editing_same_scope),
                heartbeatAgeSeconds: Number(session.heartbeat_age_seconds || 0),
                metadata:
                  session.metadata &&
                  typeof session.metadata === "object" &&
                  !Array.isArray(session.metadata)
                    ? (session.metadata as Record<string, unknown>)
                    : {},
              }))
            : [],
          softLocks: Array.isArray(raw.soft_locks)
            ? (raw.soft_locks as Record<string, unknown>[]).map((lock) => ({
                scopeKey: String(lock.scope_key || "root"),
                ownerUserIds: Array.isArray(lock.owner_user_ids)
                  ? (lock.owner_user_ids as unknown[]).map((id) => Number(id || 0))
                  : [],
                ownerLabels: Array.isArray(lock.owner_labels)
                  ? (lock.owner_labels as unknown[]).map(String)
                  : [],
                contested: Boolean(lock.contested),
                sessionIds: Array.isArray(lock.session_ids)
                  ? (lock.session_ids as unknown[]).map((id) => Number(id || 0))
                  : [],
              }))
            : [],
          conflictRisk: Boolean(raw.conflict_risk),
          updatedAt: String(raw.updated_at || ""),
        } satisfies IbCollaborationPayload)
      : undefined,
  };
}

export function useIbSavedSearches(scopeKey = "ib") {
  const response = useSchoolSWR<Record<string, unknown>[]>(
    `/api/v1/ib/saved_searches?scope_key=${encodeURIComponent(scopeKey)}`,
  );

  return {
    ...response,
    data: response.data?.map((item) => mapSavedSearch(item)),
  };
}

export function useIbCommunicationPreference(audience: "guardian" | "student") {
  const response = useSchoolSWR<Record<string, unknown>>(
    `/api/v1/ib/communication_preferences?audience=${encodeURIComponent(audience)}`,
  );

  return {
    ...response,
    data: response.data
      ? ({
          id: Number(response.data.id || 0),
          audience: String(response.data.audience || audience),
          locale: String(response.data.locale || "en"),
          digestCadence: String(response.data.digest_cadence || "weekly_digest"),
          quietHoursStart: String(response.data.quiet_hours_start || "20:00"),
          quietHoursEnd: String(response.data.quiet_hours_end || "07:00"),
          quietHoursTimezone: String(response.data.quiet_hours_timezone || "UTC"),
          deliveryRules: asRecord(response.data.delivery_rules),
          metadata: asRecord(response.data.metadata),
          updatedAt: String(response.data.updated_at || ""),
        } satisfies IbCommunicationPreferencePayload)
      : undefined,
  };
}

function mapIbReport(raw: Record<string, unknown>): IbReportPayload {
  const mapVersion = (item: Record<string, unknown>) => ({
    id: Number(item.id || 0),
    versionNumber: Number(item.version_number || 0),
    status: String(item.status || "draft"),
    templateKey: String(item.template_key || "ib.reporting.unknown.v1"),
    contentPayload: asRecord(item.content_payload),
    renderPayload: asRecord(item.render_payload),
    proofingSummary: asRecord(item.proofing_summary),
  });

  return {
    id: Number(raw.id || 0),
    programme: String(raw.programme || "Mixed"),
    reportFamily: String(raw.report_family || "conference_packet"),
    audience: String(raw.audience || "internal"),
    status: String(raw.status || "draft"),
    title: String(raw.title || "Report"),
    summary: typeof raw.summary === "string" ? raw.summary : null,
    sourceRefs: Array.isArray(raw.source_refs) ? raw.source_refs.map(String) : [],
    proofingSummary: asRecord(raw.proofing_summary),
    releasedAt: typeof raw.released_at === "string" ? raw.released_at : null,
    lastRenderedAt: typeof raw.last_rendered_at === "string" ? raw.last_rendered_at : null,
    reportContract: asRecord(raw.report_contract),
    localization: asRecord(raw.localization),
    releaseWorkflow: asRecord(raw.release_workflow),
    archiveEntry: asRecord(raw.archive_entry),
    analytics: asRecord(raw.analytics),
    viewerPermissions: asRecord(raw.viewer_permissions),
    conferencePacket: asRecord(raw.conference_packet),
    currentVersion:
      raw.current_version && typeof raw.current_version === "object"
        ? mapVersion(raw.current_version as Record<string, unknown>)
        : null,
    versions: Array.isArray(raw.versions)
      ? (raw.versions as Record<string, unknown>[]).map((version) => mapVersion(version))
      : [],
    deliveries: Array.isArray(raw.deliveries)
      ? (raw.deliveries as Record<string, unknown>[]).map((delivery) => ({
          id: Number(delivery.id || 0),
          audienceRole: String(delivery.audience_role || "guardian"),
          channel: String(delivery.channel || "web"),
          locale: String(delivery.locale || "en"),
          status: String(delivery.status || "queued"),
          deliveredAt: typeof delivery.delivered_at === "string" ? delivery.delivered_at : null,
          readAt: typeof delivery.read_at === "string" ? delivery.read_at : null,
          acknowledgedAt:
            typeof delivery.acknowledged_at === "string" ? delivery.acknowledged_at : null,
          artifactUrl: typeof delivery.artifact_url === "string" ? delivery.artifact_url : null,
          archiveKey: typeof delivery.archive_key === "string" ? delivery.archive_key : null,
          feedbackWindow:
            typeof delivery.feedback_window === "string" ? delivery.feedback_window : null,
          analytics: asRecord(delivery.analytics),
          proofingState: asRecord(delivery.proofing_state),
        }))
      : [],
  };
}

function mapSavedSearch(raw: Record<string, unknown>): IbSavedSearchPayload {
  return {
    id: Number(raw.id || 0),
    name: String(raw.name || "Saved search"),
    query: typeof raw.query === "string" ? raw.query : null,
    lensKey: String(raw.lens_key || "custom"),
    scopeKey: String(raw.scope_key || "ib"),
    shareToken: String(raw.share_token || ""),
    filters: asRecord(raw.filters),
    metadata: asRecord(raw.metadata),
    lastRunAt: typeof raw.last_run_at === "string" ? raw.last_run_at : null,
    updatedAt: String(raw.updated_at || ""),
  };
}

export function useIbReviewGovernance() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/review_governance");
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          summaryMetrics: (raw.summary_metrics &&
          typeof raw.summary_metrics === "object" &&
          !Array.isArray(raw.summary_metrics)
            ? Object.fromEntries(
                Object.entries(raw.summary_metrics as Record<string, unknown>).map(
                  ([key, value]) => [key, Number(value || 0)],
                ),
              )
            : {}) as Record<string, number>,
          queues: (raw.queues && typeof raw.queues === "object" && !Array.isArray(raw.queues)
            ? Object.fromEntries(
                Object.entries(raw.queues as Record<string, unknown>).map(([key, rows]) => [
                  key,
                  Array.isArray(rows)
                    ? rows.map((row) => ({
                        id: String((row as Record<string, unknown>).id || key),
                        title: String((row as Record<string, unknown>).title || "Queue item"),
                        detail: String((row as Record<string, unknown>).detail || ""),
                        href: String(
                          (row as Record<string, unknown>).href || IB_CANONICAL_ROUTES.review,
                        ),
                        entityRef:
                          typeof (row as Record<string, unknown>).entity_ref === "string"
                            ? ((row as Record<string, unknown>).entity_ref as string)
                            : undefined,
                        routeId:
                          typeof (row as Record<string, unknown>).route_id === "string"
                            ? ((row as Record<string, unknown>).route_id as string)
                            : undefined,
                        fallbackRouteId:
                          typeof (row as Record<string, unknown>).fallback_route_id === "string"
                            ? ((row as Record<string, unknown>).fallback_route_id as string)
                            : undefined,
                        changedSinceLastSeen: Boolean(
                          (row as Record<string, unknown>).changed_since_last_seen,
                        ),
                        updatedAt:
                          typeof (row as Record<string, unknown>).updated_at === "string"
                            ? ((row as Record<string, unknown>).updated_at as string)
                            : null,
                      }))
                    : [],
                ]),
              )
            : {}) as IbReviewGovernancePayload["queues"],
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbReviewGovernancePayload)
      : undefined,
  };
}

export function useIbRouteResolution(params: { entityRef?: string | null; href?: string | null }) {
  const query = buildQueryString({
    entity_ref: params.entityRef || undefined,
    href: params.href || undefined,
  });
  const response = useSchoolSWR<Record<string, unknown>>(
    query ? `/api/v1/ib/resolve${query}` : null,
  );
  const raw = response.data;

  return {
    ...response,
    data: raw
      ? ({
          status: String(raw.status || "not_found") as IbRouteResolution["status"],
          routeId: String(raw.route_id || "ib.home"),
          href: String(raw.href || IB_CANONICAL_ROUTES.home),
          fallbackRouteId: String(raw.fallback_route_id || "ib.home"),
          fallbackHref: String(raw.fallback_href || IB_CANONICAL_ROUTES.home),
          displayLabel: String(raw.display_label || "IB Home"),
          entityRef: typeof raw.entity_ref === "string" ? raw.entity_ref : null,
          redirectTo: typeof raw.redirect_to === "string" ? raw.redirect_to : null,
        } satisfies IbRouteResolution)
      : undefined,
  };
}

export async function batchApplyEvidenceAction(
  ids: string[],
  action: "validate" | "reflection" | "story" | "hold-internal",
) {
  await Promise.all(
    ids.map(async (id) => {
      const mutation =
        action === "validate"
          ? { url: `/api/v1/ib/evidence_items/${id}/validate_item`, method: "POST" as const }
          : action === "hold-internal"
            ? {
                url: `/api/v1/ib/evidence_items/${id}/set_visibility`,
                method: "POST" as const,
                body: JSON.stringify({ visibility: "internal" }),
              }
            : action === "story"
              ? {
                  url: `/api/v1/ib/evidence_items/${id}`,
                  method: "PATCH" as const,
                  body: JSON.stringify({ ib_evidence_item: { status: "linked_to_story" } }),
                }
              : {
                  url: `/api/v1/ib/evidence_items/${id}`,
                  method: "PATCH" as const,
                  body: JSON.stringify({ ib_evidence_item: { status: "reflection_requested" } }),
                };

      try {
        await apiFetch(mutation.url, { method: mutation.method, body: mutation.body });
      } catch (error) {
        enqueueMutation({
          url: mutation.url,
          method: mutation.method,
          body: mutation.body,
          revalidateKeys: ["/api/v1/ib/evidence_items"],
        });
        throw error;
      }
    }),
  );
}

export async function createIbEvidenceItem(
  payload: FormData | Record<string, unknown>,
): Promise<IbEvidenceItem> {
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    const response = await apiFetch<Record<string, unknown>>("/api/v1/ib/evidence_items", {
      method: "POST",
      body: payload,
    });
    return mapEvidenceItem(response);
  }

  const response = await apiFetch<Record<string, unknown>>("/api/v1/ib/evidence_items", {
    method: "POST",
    body: JSON.stringify({ ib_evidence_item: payload }),
  });
  return mapEvidenceItem(response);
}

export async function linkIbEvidenceItemToStory(id: number | string, storyId: number) {
  return apiFetch(`/api/v1/ib/evidence_items/${id}/link_story`, {
    method: "POST",
    body: JSON.stringify({ ib_learning_story_id: storyId }),
  });
}

export async function updateIbReflectionRequest(
  id: number,
  payload: Record<string, unknown>,
): Promise<IbReflectionRequestItem> {
  const response = await apiFetch<Record<string, unknown>>(`/api/v1/ib/reflection_requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_reflection_request: payload }),
  });
  return mapReflectionRequest(response);
}

export async function updateIbLearningStory(
  id: number | string,
  payload: Record<string, unknown>,
): Promise<IbLearningStoryItem> {
  const response = await apiFetch<Record<string, unknown>>(`/api/v1/ib/learning_stories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_learning_story: payload }),
  });
  return mapStory(response);
}

export async function schedulePublishingQueueItem(
  id: number,
  cadence: "weekly" | "twice-weekly" | "publish-now",
) {
  const scheduledFor = new Date().toISOString();
  const url = `/api/v1/ib/publishing_queue_items/${id}/${cadence === "publish-now" ? "publish" : "schedule"}`;
  const body = JSON.stringify({ scheduled_for: scheduledFor });
  try {
    return await apiFetch(url, {
      method: "POST",
      body,
    });
  } catch (error) {
    enqueueMutation({
      url,
      method: "POST",
      body,
      revalidateKeys: ["/api/v1/ib/publishing_queue_items"],
    });
    throw error;
  }
}

export async function updateDocumentComment(id: number, status: string) {
  return apiFetch(`/api/v1/ib/document_comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_document_comment: { status } }),
  });
}

export async function createIbDocumentComment(
  curriculumDocumentId: number | string,
  payload: Record<string, unknown>,
) {
  return apiFetch<IbComment>(
    `/api/v1/ib/document_comments?curriculum_document_id=${encodeURIComponent(String(curriculumDocumentId))}`,
    {
      method: "POST",
      body: JSON.stringify({ ib_document_comment: payload }),
    },
  );
}

export async function updateIbDocumentComment(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return apiFetch<IbComment>(`/api/v1/ib/document_comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_document_comment: payload }),
  });
}

export async function createIbReport(payload: Record<string, unknown>) {
  return apiFetch<IbReportPayload>("/api/v1/ib/reports", {
    method: "POST",
    body: JSON.stringify({ ib_report: payload }),
  });
}

export async function updateIbReport(id: number | string, payload: Record<string, unknown>) {
  return apiFetch<IbReportPayload>(`/api/v1/ib/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_report: payload }),
  });
}

export async function syncIbCollaborationSession(
  curriculumDocumentId: number | string,
  payload: Record<string, unknown>,
) {
  return apiFetch<IbCollaborationPayload>(
    `/api/v1/ib/collaboration_sessions?curriculum_document_id=${encodeURIComponent(String(curriculumDocumentId))}`,
    {
      method: payload.id ? "PATCH" : "POST",
      body: JSON.stringify({ ib_collaboration_session: payload }),
    },
  );
}

export async function saveIbSavedSearch(payload: Record<string, unknown>) {
  return apiFetch<IbSavedSearchPayload>("/api/v1/ib/saved_searches", {
    method: "POST",
    body: JSON.stringify({ ib_saved_search: payload }),
  });
}

export async function updateIbSavedSearch(id: number | string, payload: Record<string, unknown>) {
  return apiFetch<IbSavedSearchPayload>(`/api/v1/ib/saved_searches/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_saved_search: payload }),
  });
}

export async function deleteIbSavedSearch(id: number | string) {
  return apiFetch(`/api/v1/ib/saved_searches/${id}`, {
    method: "DELETE",
  });
}

export async function updateIbCommunicationPreference(
  audience: "guardian" | "student",
  payload: Record<string, unknown>,
) {
  return apiFetch<IbCommunicationPreferencePayload>(
    `/api/v1/ib/communication_preferences?audience=${encodeURIComponent(audience)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ ib_communication_preference: payload }),
    },
  );
}

export async function saveIbProgrammeSetting(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/api/v1/ib/programme_settings", {
    method: "PATCH",
    body: JSON.stringify({ ib_programme_setting: payload }),
  });
}

export async function assignIbStandardsReviewer(
  packetId: number | string,
  reviewerId: number | string,
) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/ib/standards_packets/${packetId}/assign_reviewer`,
    {
      method: "POST",
      body: JSON.stringify({ reviewer_id: reviewerId }),
    },
  );
}

export async function approveIbStandardsPacket(packetId: number | string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/ib/standards_packets/${packetId}/approve`, {
    method: "POST",
  });
}

export async function returnIbStandardsPacket(packetId: number | string, reason: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/ib/standards_packets/${packetId}/return_packet`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function exportIbStandardsPacket(packetId: number | string) {
  return apiFetch<Record<string, unknown>>(`/api/v1/ib/standards_packets/${packetId}/export`, {
    method: "POST",
  });
}

export function useIbStandardsPacket(packetId: number | string | null | undefined) {
  const response = useSchoolSWR<Record<string, unknown>>(
    packetId ? `/api/v1/ib/standards_packets/${packetId}` : null,
  );
  return {
    ...response,
    data: response.data ? mapStandardsPacket(response.data) : undefined,
  };
}

export function useIbStandardsCycle(cycleId: number | string | null | undefined) {
  const cycles = useSchoolSWR<Record<string, unknown>>(
    cycleId ? `/api/v1/ib/standards_cycles/${cycleId}` : null,
  );
  return {
    ...cycles,
    data: cycles.data ? mapStandardsCycle(cycles.data) : undefined,
  };
}

export function useIbStandardsPacketComparison(packetId: number | string | null | undefined) {
  return useSchoolSWR<Record<string, unknown>>(
    packetId ? `/api/v1/ib/standards_packets/${packetId}/comparison` : null,
  );
}

export function useIbStandardsExportPreview(packetId: number | string | null | undefined) {
  return useSchoolSWR<Record<string, unknown>>(
    packetId ? `/api/v1/ib/standards_packets/${packetId}/export_preview` : null,
  );
}

export async function createIbOperationalRecord(payload: Record<string, unknown>) {
  return apiFetch<Record<string, unknown>>("/api/v1/ib/operational_records", {
    method: "POST",
    body: JSON.stringify({ ib_operational_record: payload }),
  });
}

export async function updateIbOperationalRecord(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return apiFetch<Record<string, unknown>>(`/api/v1/ib/operational_records/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_operational_record: payload }),
  });
}
