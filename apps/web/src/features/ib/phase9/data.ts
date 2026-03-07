"use client";

import { buildQueryString } from "@/lib/swr";
import { apiFetch } from "@/lib/api";
import { useSchoolSWR } from "@/lib/useSchoolSWR";
import type { IbPerformanceBudget, IbWorkflowBenchmarkRow } from "@/features/ib/data";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map((entry) => asRecord(entry)) : [];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapWorkflowBudget(value: unknown): IbPerformanceBudget {
  const raw = asRecord(value);
  return {
    generatedAt: String(raw.generated_at || ""),
    budgets: asArray(raw.budgets).map((budget) => ({
      workflowKey: String(budget.workflow_key || "workflow"),
      label: String(budget.label || "Workflow"),
      targetMs: Number(budget.target_ms || 0),
      observedMs: Number(budget.observed_ms || 0),
      regressionMs: Number(budget.regression_ms || 0),
      status: String(budget.status || "within_budget"),
    })),
    regressions: asArray(raw.regressions).map((row) => ({
      workflowKey: String(row.workflow_key || "workflow"),
      impact: String(row.impact || "medium"),
      complexity: String(row.complexity || "medium"),
      note: String(row.note || ""),
    })),
  };
}

function mapWorkflowRows(value: unknown): IbWorkflowBenchmarkRow[] {
  const raw = asRecord(value);
  return asArray(raw.workflows).map((row) => ({
    workflowKey: String(row.workflow_key || "workflow"),
    label: String(row.label || "Workflow"),
    targetMs: Number(row.target_ms || 0),
    observedMs: Number(row.observed_ms || 0),
    clickTarget: Number(row.click_target || 0),
    observedClicks: Number(row.observed_clicks || 0),
    surface: String(row.surface || "ib"),
    status: String(row.status || "within_budget"),
  }));
}

export interface IbPilotProgrammePayload {
  generatedAt: string;
  archetypes: Array<{ key: string; label: string; detail: string }>;
  metricDefinitions: Array<{ key: string; label: string; role: string; target: string }>;
  profiles: Array<{
    id: number;
    name: string;
    status: string;
    cohortKey: string;
    archetypeKey: string;
    programmeScope: string;
    launchWindow?: string | null;
    goLiveTargetOn?: string | null;
    roleSuccessMetrics: Record<string, unknown>;
    baselineSummary: Record<string, unknown>;
    readinessSummary: Record<string, unknown>;
    rolloutBundle: Record<string, unknown>;
    baselineSnapshotCount: number;
    lastCapturedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface IbPilotSupportPayload {
  generatedAt: string;
  launchDay: Array<{ key: string; label: string; count: number; status: string; href: string }>;
  reportingWeek: Array<{
    key: string;
    label: string;
    count: number;
    status: string;
    href: string;
  }>;
  moderationWeek: Array<{
    key: string;
    label: string;
    count: number;
    status: string;
    href: string;
  }>;
  feedbackQueue: Array<{
    id: number;
    title: string;
    detail: string;
    status: string;
    sentiment: string;
    category: string;
    roleScope: string;
    surface: string;
    tags: string[];
    routingPayload: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface IbMigrationConsolePayload {
  generatedAt: string;
  lifecycle: Array<{ key: string; label: string }>;
  sourceContracts: Record<string, { assumptions: string[] }>;
  inventorySummary: Record<string, unknown>;
  sessions: Array<{
    id: number;
    sessionKey: string;
    sourceSystem: string;
    status: string;
    cutoverState: string;
    sourceInventory: Record<string, unknown>;
    mappingSummary: Record<string, unknown>;
    dryRunSummary: Record<string, unknown>;
    reconciliationSummary: Record<string, unknown>;
    rollbackSummary: Record<string, unknown>;
    sourceContract: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>;
  mappingTemplates: Array<{
    id: number;
    sourceSystem: string;
    programme: string;
    name: string;
    status: string;
    shared: boolean;
    fieldMappings: Record<string, unknown>;
    transformLibrary: Record<string, unknown>;
    roleMappingRules: Record<string, unknown>;
    updatedAt: string;
  }>;
}

export interface IbReportingOpsPayload {
  generatedAt: string;
  roleMatrix: Record<string, string>;
  lifecycle: string[];
  cycles: Array<{
    id: number;
    programme: string;
    cycleKey: string;
    status: string;
    startsOn?: string | null;
    endsOn?: string | null;
    dueOn?: string | null;
    deliveryWindow: Record<string, unknown>;
    localizationSettings: Record<string, unknown>;
    approvalSummary: Record<string, unknown>;
    metrics: Record<string, unknown>;
    reportCount: number;
    updatedAt: string;
  }>;
  templates: Array<{
    id: number;
    programme: string;
    audience: string;
    family: string;
    name: string;
    status: string;
    schemaVersion: string;
    sectionDefinitions: Record<string, unknown>;
    translationRules: Record<string, unknown>;
    updatedAt: string;
  }>;
  deliverySummary: Record<string, unknown>;
}

export interface IbCollaborationWorkbenchPayload {
  generatedAt: string;
  transportStrategy: {
    strategy: string;
    detail: string;
    durableEvents: string[];
    ephemeralEvents: string[];
  };
  routeAudit: string[];
  sessionSummary: Record<string, number>;
  eventSummary: Record<string, number>;
  taskSummary: Record<string, number>;
  recentEvents: Array<{
    id: number;
    eventName: string;
    routeId?: string | null;
    scopeKey: string;
    sectionKey?: string | null;
    durable: boolean;
    payload: Record<string, unknown>;
    occurredAt: string;
    userLabel: string;
  }>;
  tasks: Array<{
    id: number;
    curriculumDocumentId?: number | null;
    status: string;
    priority: string;
    title: string;
    detail?: string | null;
    dueOn?: string | null;
    sectionKey?: string | null;
    mentionPayload: Record<string, unknown>;
    assignedToLabel?: string | null;
    updatedAt: string;
  }>;
}

export interface IbBenchmarkConsolePayload {
  generatedAt: string;
  catalog: Array<{ key: string; role: string; label: string; clickBudget: number }>;
  currentBenchmark: IbWorkflowBenchmarkRow[];
  currentBudget: IbPerformanceBudget;
  snapshots: Array<{
    id: number;
    benchmarkVersion: string;
    status: string;
    roleScope: string;
    workflowFamily: string;
    capturedAt: string;
    metrics: Record<string, unknown>;
    thresholds: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }>;
}

export interface IbIntelligenceSemanticLayerPayload {
  generatedAt: string;
  metricDictionary: Array<{
    id: number;
    key: string;
    status: string;
    metricFamily: string;
    label: string;
    definition: string;
    version: string;
    sourceOfTruth: Record<string, unknown>;
    thresholdConfig: Record<string, unknown>;
    updatedAt: string;
  }>;
  summary: Record<string, unknown>;
  sourceMap: Record<string, string>;
}

export interface IbTrustConsolePayload {
  generatedAt: string;
  trustFramework: Record<string, string>;
  policies: Array<{
    id: number;
    audience: string;
    contentType: string;
    status: string;
    cadenceMode: string;
    deliveryMode: string;
    approvalMode: string;
    policyRules: Record<string, unknown>;
    privacyRules: Record<string, unknown>;
    localizationRules: Record<string, unknown>;
    updatedAt: string;
  }>;
  deliverySummary: Record<string, unknown>;
}

export interface IbMobileTrustPayload {
  generatedAt: string;
  trustContract: Array<{ key: string; label: string; desktopFirst: boolean }>;
  diagnostics: Array<{
    id: number;
    deviceClass: string;
    workflowKey: string;
    status: string;
    queueDepth: number;
    lastSyncedAt?: string | null;
    failurePayload: Record<string, unknown>;
    diagnostics: Record<string, unknown>;
    updatedAt: string;
  }>;
  successCriteria: Record<string, string>;
}

export interface IbSearchOpsPayload {
  generatedAt: string;
  resultGroups: string[];
  entityInventory: Record<string, number>;
  profiles: Array<{
    id: number;
    key: string;
    status: string;
    latencyBudgetMs: number;
    facetConfig: Record<string, unknown>;
    rankingRules: Record<string, unknown>;
    scopeRules: Record<string, unknown>;
    updatedAt: string;
  }>;
}

export interface IbReplacementReadinessPayload {
  generatedAt: string;
  summary: Record<string, { status: string } & Record<string, unknown>>;
  pilotGoalChecks: Array<{
    key: string;
    label: string;
    role: string;
    target: string;
    observed: string;
    status: string;
  }>;
  tracks: Array<{
    key: string;
    title: string;
    status: string;
    href: string;
    detail: string;
    gap?: { key: string; status: string; detail: Record<string, unknown> } | null;
    followUp: string;
  }>;
  gaps: Array<{ key: string; status: string; detail: Record<string, unknown> }>;
  nextStep: string;
  exportPayload: Record<string, unknown>;
}

function mutation<T>(path: string, payload: Record<string, unknown>, method: "POST" | "PATCH") {
  return apiFetch<T>(path, {
    method,
    body: JSON.stringify(payload),
  });
}

function mapPilotProgrammePayload(raw: Record<string, unknown>): IbPilotProgrammePayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    archetypes: asArray(raw.archetypes).map((item) => ({
      key: String(item.key || "archetype"),
      label: String(item.label || "Archetype"),
      detail: String(item.detail || ""),
    })),
    metricDefinitions: asArray(raw.metric_definitions).map((item) => ({
      key: String(item.key || "metric"),
      label: String(item.label || "Metric"),
      role: String(item.role || "teacher"),
      target: String(item.target || "Tracked"),
    })),
    profiles: asArray(raw.profiles).map((item) => ({
      id: Number(item.id || 0),
      name: String(item.name || "Pilot cohort"),
      status: String(item.status || "draft"),
      cohortKey: String(item.cohort_key || ""),
      archetypeKey: String(item.archetype_key || ""),
      programmeScope: String(item.programme_scope || "Mixed"),
      launchWindow: typeof item.launch_window === "string" ? item.launch_window : null,
      goLiveTargetOn: typeof item.go_live_target_on === "string" ? item.go_live_target_on : null,
      roleSuccessMetrics: asRecord(item.role_success_metrics),
      baselineSummary: asRecord(item.baseline_summary),
      readinessSummary: asRecord(item.readiness_summary),
      rolloutBundle: asRecord(item.rollout_bundle),
      baselineSnapshotCount: Number(item.baseline_snapshot_count || 0),
      lastCapturedAt: typeof item.last_captured_at === "string" ? item.last_captured_at : null,
      createdAt: String(item.created_at || ""),
      updatedAt: String(item.updated_at || ""),
    })),
  };
}

function mapPilotSupportPayload(raw: Record<string, unknown>): IbPilotSupportPayload {
  const mapHealthRow = (item: Record<string, unknown>) => ({
    key: String(item.key || "health"),
    label: String(item.label || "Signal"),
    count: Number(item.count || 0),
    status: String(item.status || "watch"),
    href: String(item.href || "/ib/rollout"),
  });

  return {
    generatedAt: String(raw.generated_at || ""),
    launchDay: asArray(raw.launch_day).map(mapHealthRow),
    reportingWeek: asArray(raw.reporting_week).map(mapHealthRow),
    moderationWeek: asArray(raw.moderation_week).map(mapHealthRow),
    feedbackQueue: asArray(raw.feedback_queue).map((item) => ({
      id: Number(item.id || 0),
      title: String(item.title || "Feedback"),
      detail: String(item.detail || ""),
      status: String(item.status || "new"),
      sentiment: String(item.sentiment || "neutral"),
      category: String(item.category || "general"),
      roleScope: String(item.role_scope || "teacher"),
      surface: String(item.surface || "unknown"),
      tags: asStringArray(item.tags),
      routingPayload: asRecord(item.routing_payload),
      createdAt: String(item.created_at || ""),
      updatedAt: String(item.updated_at || ""),
    })),
  };
}

function mapMigrationConsolePayload(raw: Record<string, unknown>): IbMigrationConsolePayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    lifecycle: asArray(raw.lifecycle).map((item) => ({
      key: String(item.key || "draft"),
      label: String(item.label || "Draft"),
    })),
    sourceContracts: Object.entries(asRecord(raw.source_contracts)).reduce<
      Record<string, { assumptions: string[] }>
    >((memo, [key, value]) => {
      memo[key] = { assumptions: asStringArray(asRecord(value).assumptions) };
      return memo;
    }, {}),
    inventorySummary: asRecord(raw.inventory_summary),
    sessions: asArray(raw.sessions).map((item) => ({
      id: Number(item.id || 0),
      sessionKey: String(item.session_key || ""),
      sourceSystem: String(item.source_system || "generic"),
      status: String(item.status || "disconnected"),
      cutoverState: String(item.cutover_state || "disconnected"),
      sourceInventory: asRecord(item.source_inventory),
      mappingSummary: asRecord(item.mapping_summary),
      dryRunSummary: asRecord(item.dry_run_summary),
      reconciliationSummary: asRecord(item.reconciliation_summary),
      rollbackSummary: asRecord(item.rollback_summary),
      sourceContract: asRecord(item.source_contract),
      createdAt: String(item.created_at || ""),
      updatedAt: String(item.updated_at || ""),
    })),
    mappingTemplates: asArray(raw.mapping_templates).map((item) => ({
      id: Number(item.id || 0),
      sourceSystem: String(item.source_system || "generic"),
      programme: String(item.programme || "Mixed"),
      name: String(item.name || "Template"),
      status: String(item.status || "draft"),
      shared: Boolean(item.shared),
      fieldMappings: asRecord(item.field_mappings),
      transformLibrary: asRecord(item.transform_library),
      roleMappingRules: asRecord(item.role_mapping_rules),
      updatedAt: String(item.updated_at || ""),
    })),
  };
}

function mapReportingOpsPayload(raw: Record<string, unknown>): IbReportingOpsPayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    roleMatrix: Object.fromEntries(
      Object.entries(asRecord(raw.role_matrix)).map(([key, value]) => [key, String(value)]),
    ),
    lifecycle: asStringArray(raw.lifecycle),
    cycles: asArray(raw.cycles).map((item) => ({
      id: Number(item.id || 0),
      programme: String(item.programme || "Mixed"),
      cycleKey: String(item.cycle_key || ""),
      status: String(item.status || "draft"),
      startsOn: typeof item.starts_on === "string" ? item.starts_on : null,
      endsOn: typeof item.ends_on === "string" ? item.ends_on : null,
      dueOn: typeof item.due_on === "string" ? item.due_on : null,
      deliveryWindow: asRecord(item.delivery_window),
      localizationSettings: asRecord(item.localization_settings),
      approvalSummary: asRecord(item.approval_summary),
      metrics: asRecord(item.metrics),
      reportCount: Number(item.report_count || 0),
      updatedAt: String(item.updated_at || ""),
    })),
    templates: asArray(raw.templates).map((item) => ({
      id: Number(item.id || 0),
      programme: String(item.programme || "Mixed"),
      audience: String(item.audience || "internal"),
      family: String(item.family || "conference_packet"),
      name: String(item.name || "Template"),
      status: String(item.status || "draft"),
      schemaVersion: String(item.schema_version || "phase9.v1"),
      sectionDefinitions: asRecord(item.section_definitions),
      translationRules: asRecord(item.translation_rules),
      updatedAt: String(item.updated_at || ""),
    })),
    deliverySummary: asRecord(raw.delivery_summary),
  };
}

function mapCollaborationWorkbenchPayload(
  raw: Record<string, unknown>,
): IbCollaborationWorkbenchPayload {
  const strategy = asRecord(raw.transport_strategy);

  return {
    generatedAt: String(raw.generated_at || ""),
    transportStrategy: {
      strategy: String(strategy.strategy || "heartbeat_plus_polling"),
      detail: String(strategy.detail || ""),
      durableEvents: asStringArray(strategy.durable_events),
      ephemeralEvents: asStringArray(strategy.ephemeral_events),
    },
    routeAudit: asStringArray(raw.route_audit),
    sessionSummary: Object.fromEntries(
      Object.entries(asRecord(raw.session_summary)).map(([key, value]) => [
        key,
        Number(value || 0),
      ]),
    ),
    eventSummary: Object.fromEntries(
      Object.entries(asRecord(raw.event_summary)).map(([key, value]) => [key, Number(value || 0)]),
    ),
    taskSummary: Object.fromEntries(
      Object.entries(asRecord(raw.task_summary)).map(([key, value]) => [key, Number(value || 0)]),
    ),
    recentEvents: asArray(raw.recent_events).map((item) => ({
      id: Number(item.id || 0),
      eventName: String(item.event_name || "event"),
      routeId: typeof item.route_id === "string" ? item.route_id : null,
      scopeKey: String(item.scope_key || ""),
      sectionKey: typeof item.section_key === "string" ? item.section_key : null,
      durable: Boolean(item.durable),
      payload: asRecord(item.payload),
      occurredAt: String(item.occurred_at || ""),
      userLabel: String(item.user_label || "Unknown"),
    })),
    tasks: asArray(raw.tasks).map((item) => ({
      id: Number(item.id || 0),
      curriculumDocumentId:
        typeof item.curriculum_document_id === "number" ? item.curriculum_document_id : null,
      status: String(item.status || "open"),
      priority: String(item.priority || "medium"),
      title: String(item.title || "Follow-up"),
      detail: typeof item.detail === "string" ? item.detail : null,
      dueOn: typeof item.due_on === "string" ? item.due_on : null,
      sectionKey: typeof item.section_key === "string" ? item.section_key : null,
      mentionPayload: asRecord(item.mention_payload),
      assignedToLabel: typeof item.assigned_to_label === "string" ? item.assigned_to_label : null,
      updatedAt: String(item.updated_at || ""),
    })),
  };
}

function mapBenchmarkConsolePayload(raw: Record<string, unknown>): IbBenchmarkConsolePayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    catalog: asArray(raw.catalog).map((item) => ({
      key: String(item.key || "workflow"),
      role: String(item.role || "teacher"),
      label: String(item.label || "Workflow"),
      clickBudget: Number(item.click_budget || 0),
    })),
    currentBenchmark: mapWorkflowRows(raw.current_benchmark),
    currentBudget: mapWorkflowBudget(raw.current_budget),
    snapshots: asArray(raw.snapshots).map((item) => ({
      id: Number(item.id || 0),
      benchmarkVersion: String(item.benchmark_version || "phase9.v1"),
      status: String(item.status || "baseline"),
      roleScope: String(item.role_scope || "teacher"),
      workflowFamily: String(item.workflow_family || "planning"),
      capturedAt: String(item.captured_at || ""),
      metrics: asRecord(item.metrics),
      thresholds: asRecord(item.thresholds),
      metadata: asRecord(item.metadata),
    })),
  };
}

function mapIntelligenceSemanticLayerPayload(
  raw: Record<string, unknown>,
): IbIntelligenceSemanticLayerPayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    metricDictionary: asArray(raw.metric_dictionary).map((item) => ({
      id: Number(item.id || 0),
      key: String(item.key || "metric"),
      status: String(item.status || "draft"),
      metricFamily: String(item.metric_family || "programme_health"),
      label: String(item.label || "Metric"),
      definition: String(item.definition || ""),
      version: String(item.version || "phase9.v1"),
      sourceOfTruth: asRecord(item.source_of_truth),
      thresholdConfig: asRecord(item.threshold_config),
      updatedAt: String(item.updated_at || ""),
    })),
    summary: asRecord(raw.summary),
    sourceMap: Object.fromEntries(
      Object.entries(asRecord(raw.source_map)).map(([key, value]) => [key, String(value)]),
    ),
  };
}

function mapTrustConsolePayload(raw: Record<string, unknown>): IbTrustConsolePayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    trustFramework: Object.fromEntries(
      Object.entries(asRecord(raw.trust_framework)).map(([key, value]) => [key, String(value)]),
    ),
    policies: asArray(raw.policies).map((item) => ({
      id: Number(item.id || 0),
      audience: String(item.audience || "guardian"),
      contentType: String(item.content_type || "story"),
      status: String(item.status || "active"),
      cadenceMode: String(item.cadence_mode || "weekly_digest"),
      deliveryMode: String(item.delivery_mode || "digest"),
      approvalMode: String(item.approval_mode || "teacher_reviewed"),
      policyRules: asRecord(item.policy_rules),
      privacyRules: asRecord(item.privacy_rules),
      localizationRules: asRecord(item.localization_rules),
      updatedAt: String(item.updated_at || ""),
    })),
    deliverySummary: asRecord(raw.delivery_summary),
  };
}

function mapMobileTrustPayload(raw: Record<string, unknown>): IbMobileTrustPayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    trustContract: asArray(raw.trust_contract).map((item) => ({
      key: String(item.key || "workflow"),
      label: String(item.label || "Workflow"),
      desktopFirst: Boolean(item.desktop_first),
    })),
    diagnostics: asArray(raw.diagnostics).map((item) => ({
      id: Number(item.id || 0),
      deviceClass: String(item.device_class || "phone"),
      workflowKey: String(item.workflow_key || "workflow"),
      status: String(item.status || "healthy"),
      queueDepth: Number(item.queue_depth || 0),
      lastSyncedAt: typeof item.last_synced_at === "string" ? item.last_synced_at : null,
      failurePayload: asRecord(item.failure_payload),
      diagnostics: asRecord(item.diagnostics),
      updatedAt: String(item.updated_at || ""),
    })),
    successCriteria: Object.fromEntries(
      Object.entries(asRecord(raw.success_criteria)).map(([key, value]) => [key, String(value)]),
    ),
  };
}

function mapSearchOpsPayload(raw: Record<string, unknown>): IbSearchOpsPayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    resultGroups: asStringArray(raw.result_groups),
    entityInventory: Object.fromEntries(
      Object.entries(asRecord(raw.entity_inventory)).map(([key, value]) => [
        key,
        Number(value || 0),
      ]),
    ),
    profiles: asArray(raw.profiles).map((item) => ({
      id: Number(item.id || 0),
      key: String(item.key || "search"),
      status: String(item.status || "draft"),
      latencyBudgetMs: Number(item.latency_budget_ms || 0),
      facetConfig: asRecord(item.facet_config),
      rankingRules: asRecord(item.ranking_rules),
      scopeRules: asRecord(item.scope_rules),
      updatedAt: String(item.updated_at || ""),
    })),
  };
}

function mapReplacementReadinessPayload(
  raw: Record<string, unknown>,
): IbReplacementReadinessPayload {
  return {
    generatedAt: String(raw.generated_at || ""),
    summary: Object.fromEntries(
      Object.entries(asRecord(raw.summary)).map(([key, value]) => [key, asRecord(value)]),
    ) as IbReplacementReadinessPayload["summary"],
    pilotGoalChecks: asArray(raw.pilot_goal_checks).map((item) => ({
      key: String(item.key || "goal"),
      label: String(item.label || "Goal"),
      role: String(item.role || "teacher"),
      target: String(item.target || "Tracked"),
      observed: String(item.observed || "Tracked"),
      status: String(item.status || "yellow"),
    })),
    tracks: asArray(raw.tracks).map((item) => ({
      key: String(item.key || "track"),
      title: String(item.title || "Track"),
      status: String(item.status || "yellow"),
      href: String(item.href || "/ib/rollout"),
      detail: String(item.detail || ""),
      gap:
        item.gap && typeof item.gap === "object" && !Array.isArray(item.gap)
          ? {
              key: String(asRecord(item.gap).key || ""),
              status: String(asRecord(item.gap).status || "yellow"),
              detail: asRecord(asRecord(item.gap).detail),
            }
          : null,
      followUp: String(item.follow_up || "Track progress."),
    })),
    gaps: asArray(raw.gaps).map((item) => ({
      key: String(item.key || "gap"),
      status: String(item.status || "yellow"),
      detail: asRecord(item.detail),
    })),
    nextStep: String(raw.next_step || "stabilization"),
    exportPayload: asRecord(raw.export_payload),
  };
}

export function useIbPilotProgramme() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/pilot_profiles");
  return {
    ...response,
    data: response.data ? mapPilotProgrammePayload(response.data) : undefined,
  };
}

export function useIbPilotSupport() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/pilot_support");
  return {
    ...response,
    data: response.data ? mapPilotSupportPayload(response.data) : undefined,
  };
}

export function useIbMigrationConsole() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/migration_sessions");
  return {
    ...response,
    data: response.data ? mapMigrationConsolePayload(response.data) : undefined,
  };
}

export function useIbReportingOps() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/report_cycles");
  return {
    ...response,
    data: response.data ? mapReportingOpsPayload(response.data) : undefined,
  };
}

export function useIbCollaborationWorkbench(curriculumDocumentId?: number | null) {
  const response = useSchoolSWR<Record<string, unknown>>(
    `/api/v1/ib/collaboration_workbench${buildQueryString({
      curriculum_document_id: curriculumDocumentId ?? undefined,
    })}`,
  );
  return {
    ...response,
    data: response.data ? mapCollaborationWorkbenchPayload(response.data) : undefined,
  };
}

export function useIbBenchmarkConsole() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/benchmark_snapshots");
  return {
    ...response,
    data: response.data ? mapBenchmarkConsolePayload(response.data) : undefined,
  };
}

export function useIbIntelligenceSemanticLayer() {
  const response = useSchoolSWR<Record<string, unknown>>(
    "/api/v1/ib/intelligence_metric_definitions",
  );
  return {
    ...response,
    data: response.data ? mapIntelligenceSemanticLayerPayload(response.data) : undefined,
  };
}

export function useIbTrustConsole() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/trust_policies");
  return {
    ...response,
    data: response.data ? mapTrustConsolePayload(response.data) : undefined,
  };
}

export function useIbMobileTrust() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/mobile_sync_diagnostics");
  return {
    ...response,
    data: response.data ? mapMobileTrustPayload(response.data) : undefined,
  };
}

export function useIbSearchOps() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/search_profiles");
  return {
    ...response,
    data: response.data ? mapSearchOpsPayload(response.data) : undefined,
  };
}

export function useIbReplacementReadiness() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/replacement_readiness");
  return {
    ...response,
    data: response.data ? mapReplacementReadinessPayload(response.data) : undefined,
  };
}

export function saveIbPilotProfile(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/pilot_profiles/${id}` : "/api/v1/ib/pilot_profiles",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function captureIbPilotBaseline(ibPilotProfileId: number) {
  return mutation(
    "/api/v1/ib/pilot_baseline_snapshots",
    { ib_pilot_profile_id: ibPilotProfileId },
    "POST",
  );
}

export function saveIbPilotFeedbackItem(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/pilot_feedback_items/${id}` : "/api/v1/ib/pilot_feedback_items",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbMigrationSession(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/migration_sessions/${id}` : "/api/v1/ib/migration_sessions",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbMigrationMappingTemplate(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/migration_mapping_templates/${id}` : "/api/v1/ib/migration_mapping_templates",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbReportCycle(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/report_cycles/${id}` : "/api/v1/ib/report_cycles",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbReportTemplate(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/report_templates/${id}` : "/api/v1/ib/report_templates",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbCollaborationTask(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/collaboration_tasks/${id}` : "/api/v1/ib/collaboration_tasks",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbCollaborationEvent(payload: Record<string, unknown>) {
  return mutation("/api/v1/ib/collaboration_events", payload, "POST");
}

export function captureIbBenchmarkSnapshot(payload: Record<string, unknown>) {
  return mutation("/api/v1/ib/benchmark_snapshots", payload, "POST");
}

export function saveIbIntelligenceMetricDefinition(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id
      ? `/api/v1/ib/intelligence_metric_definitions/${id}`
      : "/api/v1/ib/intelligence_metric_definitions",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbTrustPolicy(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/trust_policies/${id}` : "/api/v1/ib/trust_policies",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbMobileSyncDiagnostic(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/mobile_sync_diagnostics/${id}` : "/api/v1/ib/mobile_sync_diagnostics",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function saveIbSearchProfile(payload: Record<string, unknown>) {
  const id = payload.id;
  return mutation(
    id ? `/api/v1/ib/search_profiles/${id}` : "/api/v1/ib/search_profiles",
    payload,
    id ? "PATCH" : "POST",
  );
}

export function captureIbReplacementReadiness() {
  return mutation("/api/v1/ib/replacement_readiness", {}, "POST");
}
