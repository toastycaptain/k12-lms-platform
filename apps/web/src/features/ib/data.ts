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
  studentId?: number | null;
  href: string;
  entityRef?: string;
  routeId?: string;
  fallbackRouteId?: string;
  changedSinceLastSeen?: boolean;
  updatedAt?: string | null;
  linkedStoryCount?: number;
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
  commentType: string;
  status: string;
  visibility: string;
  anchorPath?: string | null;
  body: string;
  createdAt: string;
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
  stories: Array<{
    id: number;
    title: string;
    programme: string;
    summary?: string | null;
    supportPrompt?: string | null;
    cadence: string;
    state: string;
    publishedAt?: string | null;
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
  };
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
  }>;
  generatedAt: string;
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
        } satisfies IbHomePayload)
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
  return {
    ...response,
    data: response.data?.map(
      (comment) =>
        ({
          id: Number(comment.id),
          authorId: Number(comment.author_id),
          commentType: String(comment.comment_type || "general"),
          status: String(comment.status || "open"),
          visibility: String(comment.visibility || "internal"),
          anchorPath: (comment.anchor_path as string | undefined) || null,
          body: String(comment.body || ""),
          createdAt: String(comment.created_at || ""),
        }) satisfies IbComment,
    ),
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
  return useSchoolSWR<IbSpecialistPayload>("/api/v1/ib/specialist");
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
          },
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
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/pilot_readiness");
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
              }))
            : [],
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbPilotReadinessPayload)
      : undefined,
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
