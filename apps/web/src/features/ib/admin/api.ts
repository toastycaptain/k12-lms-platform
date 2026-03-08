import { apiFetch } from "@/lib/api";
import { useSchoolSWR } from "@/lib/useSchoolSWR";

export interface PilotSetupStep {
  key: string;
  title: string;
  owner: string;
  status: "green" | "yellow" | "red";
  blockers: string[];
  warnings: string[];
  details: Record<string, unknown>;
  actionHref?: string;
  actionLabel?: string;
}

export interface IbPilotSetupPayload {
  id?: number;
  programme: string;
  status: string;
  computedStatus: string;
  featureFlagBundle: Record<string, unknown>;
  ownerAssignments: Record<string, unknown>;
  statusDetails: Record<string, unknown>;
  pausedReason?: string | null;
  lastValidatedAt?: string | null;
  activatedAt?: string | null;
  generatedAt: string;
  summaryMetrics: {
    completedSteps: number;
    totalSteps: number;
    blockerCount: number;
    warningCount: number;
  };
  steps: PilotSetupStep[];
  nextActions: string[];
}

export interface IbImportBatchRow {
  id: number;
  rowIndex: number;
  sheetName?: string | null;
  sourceIdentifier: string;
  status: string;
  sourcePayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  mappingPayload: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  conflictPayload: Record<string, unknown>;
  resolutionPayload: Record<string, unknown>;
  executionPayload: Record<string, unknown>;
  targetEntityRef?: string | null;
  entityKind?: string | null;
  dataLossRisk?: string | null;
  duplicateCandidateRef?: string | null;
  unsupportedFields: string[];
}

export interface IbImportBatchPayload {
  id: number;
  programme: string;
  status: string;
  sourceKind: string;
  sourceFormat: string;
  sourceSystem: string;
  importMode: string;
  coexistenceMode: boolean;
  sourceFilename: string;
  sourceChecksum?: string | null;
  sourceContractVersion?: string | null;
  scopeMetadata: Record<string, unknown>;
  parserWarnings: string[];
  mappingPayload: Record<string, unknown>;
  validationSummary: Record<string, unknown>;
  previewSummary: Record<string, unknown>;
  dryRunSummary: Record<string, unknown>;
  executionSummary: Record<string, unknown>;
  rollbackSummary: Record<string, unknown>;
  rollbackCapabilities: Record<string, unknown>;
  recoveryPayload: Record<string, unknown>;
  resumeCursor?: number | null;
  lastEnqueuedJobId?: number | null;
  errorMessage?: string | null;
  lastDryRunAt?: string | null;
  executedAt?: string | null;
  rows: IbImportBatchRow[];
  createdAt: string;
  updatedAt: string;
}

export interface IbJobOperationsPayload {
  inventory: Array<{
    key: string;
    queue: string;
    retry: string;
    idempotencyRule: string;
    replaySupported: boolean;
    cancelSupported?: boolean;
    timeoutSeconds?: number;
    runbookUrl?: string;
  }>;
  queueHealth: Array<{
    queue: string;
    depth: number;
    latencySeconds: number;
    operations: string[];
    status: string;
    error?: string;
  }>;
  attentionSummary: {
    queued: number;
    running: number;
    failed: number;
    deadLetter: number;
    recovered: number;
  };
  failures: Array<{
    id: number;
    operationType: string;
    title: string;
    detail: string;
    happenedAt: string;
    queue?: string;
    correlationId?: string;
    runbookUrl?: string;
  }>;
  recentEvents: Array<{
    id: number;
    jobId: number;
    eventType: string;
    message: string;
    occurredAt: string;
    payload: Record<string, unknown>;
  }>;
  generatedAt: string;
}

export interface IbOperationalReliabilityPayload {
  generatedAt: string;
  failureDomains: Array<{
    key: string;
    queue: string;
    runbookUrl: string;
    totalJobs: number;
    failedJobs: number;
    activeJobs: number;
    lastFailureAt?: string;
  }>;
  queueHealth: IbJobOperationsPayload["queueHealth"];
  recoverySummary: {
    queued: number;
    running: number;
    failed: number;
    deadLetter: number;
    recentFailures: Array<{
      id: number;
      operationKey: string;
      status: string;
      queueName: string;
      lastErrorMessage?: string;
      correlationId?: string;
      runbookUrl?: string;
      updatedAt: string;
    }>;
  };
  sloSummary: Array<{
    key: string;
    label: string;
    objective: string;
    currentValue: string;
    status: string;
  }>;
  traceSummary: {
    enabled: boolean;
    traceId?: string;
    correlationId?: string;
    requestId?: string;
    strategy: string;
  };
  sentrySummary: {
    configured: boolean;
    tracesSampleRate: number;
    errorBudget: {
      dailyFailureThreshold: number;
      queueDeadLetterThreshold: number;
    };
  };
  queryObservability: {
    thresholds: Record<string, number>;
    indexedSurfaces: string[];
    capacityNotes: string[];
  };
  loadRehearsals: Array<{
    key: string;
    label: string;
    path: string;
  }>;
}

export interface IbAnalyticsPayload {
  teacherFriction: Record<string, number | string>;
  coordinatorOperations: Record<string, number | string>;
  latencyAndQueueHealth: Record<string, number | string>;
  pilotSuccessScorecard: Record<string, number | string>;
  generatedAt: string;
}

export interface IbReleaseBaselinePayload {
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
  generatedAt: string;
}

export function useIbPilotSetup(programme = "Mixed") {
  const response = useSchoolSWR<Record<string, unknown>>(
    `/api/v1/ib/pilot_setup?programme=${encodeURIComponent(programme)}`,
  );
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          id: typeof raw.id === "number" ? raw.id : undefined,
          programme: String(raw.programme || programme),
          status: String(raw.status || "not_started"),
          computedStatus: String(raw.computed_status || "in_progress"),
          featureFlagBundle:
            raw.feature_flag_bundle &&
            typeof raw.feature_flag_bundle === "object" &&
            !Array.isArray(raw.feature_flag_bundle)
              ? (raw.feature_flag_bundle as Record<string, unknown>)
              : {},
          ownerAssignments:
            raw.owner_assignments &&
            typeof raw.owner_assignments === "object" &&
            !Array.isArray(raw.owner_assignments)
              ? (raw.owner_assignments as Record<string, unknown>)
              : {},
          statusDetails:
            raw.status_details &&
            typeof raw.status_details === "object" &&
            !Array.isArray(raw.status_details)
              ? (raw.status_details as Record<string, unknown>)
              : {},
          pausedReason: typeof raw.paused_reason === "string" ? raw.paused_reason : null,
          lastValidatedAt: typeof raw.last_validated_at === "string" ? raw.last_validated_at : null,
          activatedAt: typeof raw.activated_at === "string" ? raw.activated_at : null,
          generatedAt: String(raw.generated_at || ""),
          summaryMetrics: {
            completedSteps: Number(
              (raw.summary_metrics as Record<string, unknown> | undefined)?.completed_steps || 0,
            ),
            totalSteps: Number(
              (raw.summary_metrics as Record<string, unknown> | undefined)?.total_steps || 0,
            ),
            blockerCount: Number(
              (raw.summary_metrics as Record<string, unknown> | undefined)?.blocker_count || 0,
            ),
            warningCount: Number(
              (raw.summary_metrics as Record<string, unknown> | undefined)?.warning_count || 0,
            ),
          },
          steps: Array.isArray(raw.steps)
            ? raw.steps.map((step) => ({
                key: String((step as Record<string, unknown>).key || "step"),
                title: String((step as Record<string, unknown>).title || "Step"),
                owner: String((step as Record<string, unknown>).owner || "owner"),
                status: String(
                  (step as Record<string, unknown>).status || "yellow",
                ) as PilotSetupStep["status"],
                blockers: Array.isArray((step as Record<string, unknown>).blockers)
                  ? ((step as Record<string, unknown>).blockers as unknown[]).map(String)
                  : [],
                warnings: Array.isArray((step as Record<string, unknown>).warnings)
                  ? ((step as Record<string, unknown>).warnings as unknown[]).map(String)
                  : [],
                details:
                  (step as Record<string, unknown>).details &&
                  typeof (step as Record<string, unknown>).details === "object"
                    ? ((step as Record<string, unknown>).details as Record<string, unknown>)
                    : {},
                actionHref:
                  typeof (step as Record<string, unknown>).action_href === "string"
                    ? ((step as Record<string, unknown>).action_href as string)
                    : undefined,
                actionLabel:
                  typeof (step as Record<string, unknown>).action_label === "string"
                    ? ((step as Record<string, unknown>).action_label as string)
                    : undefined,
              }))
            : [],
          nextActions: Array.isArray(raw.next_actions) ? raw.next_actions.map(String) : [],
        } satisfies IbPilotSetupPayload)
      : undefined,
  };
}

export function useIbImportBatches() {
  const response = useSchoolSWR<Record<string, unknown>[]>("/api/v1/ib/import_batches");
  return {
    ...response,
    data: response.data?.map(mapImportBatch),
  };
}

export function useIbJobOperations() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/job_operations");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          inventory: Array.isArray(raw.inventory)
            ? raw.inventory.map((item) => ({
                key: String((item as Record<string, unknown>).key || "operation"),
                queue: String((item as Record<string, unknown>).queue || "default"),
                retry: String((item as Record<string, unknown>).retry || "manual"),
                idempotencyRule: String(
                  (item as Record<string, unknown>).idempotency_rule || "n/a",
                ),
                replaySupported: Boolean((item as Record<string, unknown>).replay_supported),
                cancelSupported: Boolean((item as Record<string, unknown>).cancel_supported),
                timeoutSeconds: Number((item as Record<string, unknown>).timeout_seconds || 0),
                runbookUrl:
                  typeof (item as Record<string, unknown>).runbook_url === "string"
                    ? ((item as Record<string, unknown>).runbook_url as string)
                    : undefined,
              }))
            : [],
          queueHealth: Array.isArray(raw.queue_health)
            ? raw.queue_health.map((item) => ({
                queue: String((item as Record<string, unknown>).queue || "default"),
                depth: Number((item as Record<string, unknown>).depth || 0),
                latencySeconds: Number((item as Record<string, unknown>).latency_seconds || 0),
                operations: Array.isArray((item as Record<string, unknown>).operations)
                  ? ((item as Record<string, unknown>).operations as unknown[]).map(String)
                  : [],
                status: String((item as Record<string, unknown>).status || "healthy"),
                error:
                  typeof (item as Record<string, unknown>).error === "string"
                    ? ((item as Record<string, unknown>).error as string)
                    : undefined,
              }))
            : [],
          attentionSummary: {
            queued: Number(
              (raw.attention_summary as Record<string, unknown> | undefined)?.queued || 0,
            ),
            running: Number(
              (raw.attention_summary as Record<string, unknown> | undefined)?.running || 0,
            ),
            failed: Number(
              (raw.attention_summary as Record<string, unknown> | undefined)?.failed || 0,
            ),
            deadLetter: Number(
              (raw.attention_summary as Record<string, unknown> | undefined)?.dead_letter || 0,
            ),
            recovered: Number(
              (raw.attention_summary as Record<string, unknown> | undefined)?.recovered || 0,
            ),
          },
          failures: Array.isArray(raw.failures)
            ? raw.failures.map((item) => ({
                id: Number((item as Record<string, unknown>).id || 0),
                operationType: String(
                  (item as Record<string, unknown>).operation_type || "unknown",
                ),
                title: String((item as Record<string, unknown>).title || "Failure"),
                detail: String((item as Record<string, unknown>).detail || ""),
                happenedAt: String((item as Record<string, unknown>).happened_at || ""),
                queue:
                  typeof (item as Record<string, unknown>).queue === "string"
                    ? ((item as Record<string, unknown>).queue as string)
                    : undefined,
                correlationId:
                  typeof (item as Record<string, unknown>).correlation_id === "string"
                    ? ((item as Record<string, unknown>).correlation_id as string)
                    : undefined,
                runbookUrl:
                  typeof (item as Record<string, unknown>).runbook_url === "string"
                    ? ((item as Record<string, unknown>).runbook_url as string)
                    : undefined,
              }))
            : [],
          recentEvents: Array.isArray(raw.recent_events)
            ? raw.recent_events.map((item) => ({
                id: Number((item as Record<string, unknown>).id || 0),
                jobId: Number((item as Record<string, unknown>).job_id || 0),
                eventType: String((item as Record<string, unknown>).event_type || "queued"),
                message: String((item as Record<string, unknown>).message || ""),
                occurredAt: String((item as Record<string, unknown>).occurred_at || ""),
                payload:
                  (item as Record<string, unknown>).payload &&
                  typeof (item as Record<string, unknown>).payload === "object"
                    ? ((item as Record<string, unknown>).payload as Record<string, unknown>)
                    : {},
              }))
            : [],
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbJobOperationsPayload)
      : undefined,
  };
}

export function useIbOperationalReliability() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/operational_reliability");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          generatedAt: String(raw.generated_at || ""),
          failureDomains: Array.isArray(raw.failure_domains)
            ? raw.failure_domains.map((item) => ({
                key: String((item as Record<string, unknown>).key || "operation"),
                queue: String((item as Record<string, unknown>).queue || "default"),
                runbookUrl: String((item as Record<string, unknown>).runbook_url || "#"),
                totalJobs: Number((item as Record<string, unknown>).total_jobs || 0),
                failedJobs: Number((item as Record<string, unknown>).failed_jobs || 0),
                activeJobs: Number((item as Record<string, unknown>).active_jobs || 0),
                lastFailureAt:
                  typeof (item as Record<string, unknown>).last_failure_at === "string"
                    ? ((item as Record<string, unknown>).last_failure_at as string)
                    : undefined,
              }))
            : [],
          queueHealth: Array.isArray(raw.queue_health)
            ? raw.queue_health.map((item) => ({
                queue: String((item as Record<string, unknown>).queue || "default"),
                depth: Number((item as Record<string, unknown>).depth || 0),
                latencySeconds: Number((item as Record<string, unknown>).latency_seconds || 0),
                operations: Array.isArray((item as Record<string, unknown>).operations)
                  ? ((item as Record<string, unknown>).operations as unknown[]).map(String)
                  : [],
                status: String((item as Record<string, unknown>).status || "healthy"),
                error:
                  typeof (item as Record<string, unknown>).error === "string"
                    ? ((item as Record<string, unknown>).error as string)
                    : undefined,
              }))
            : [],
          recoverySummary: {
            queued: Number(
              (raw.recovery_summary as Record<string, unknown> | undefined)?.queued || 0,
            ),
            running: Number(
              (raw.recovery_summary as Record<string, unknown> | undefined)?.running || 0,
            ),
            failed: Number(
              (raw.recovery_summary as Record<string, unknown> | undefined)?.failed || 0,
            ),
            deadLetter: Number(
              (raw.recovery_summary as Record<string, unknown> | undefined)?.dead_letter || 0,
            ),
            recentFailures: Array.isArray(
              (raw.recovery_summary as Record<string, unknown> | undefined)?.recent_failures,
            )
              ? (
                  (raw.recovery_summary as Record<string, unknown>).recent_failures as Array<
                    Record<string, unknown>
                  >
                ).map((item) => ({
                  id: Number(item.id || 0),
                  operationKey: String(item.operation_key || "operation"),
                  status: String(item.status || "failed"),
                  queueName: String(item.queue_name || "default"),
                  lastErrorMessage:
                    typeof item.last_error_message === "string"
                      ? (item.last_error_message as string)
                      : undefined,
                  correlationId:
                    typeof item.correlation_id === "string"
                      ? (item.correlation_id as string)
                      : undefined,
                  runbookUrl:
                    typeof item.runbook_url === "string" ? (item.runbook_url as string) : undefined,
                  updatedAt: String(item.updated_at || ""),
                }))
              : [],
          },
          sloSummary: Array.isArray(raw.slo_summary)
            ? raw.slo_summary.map((item) => ({
                key: String((item as Record<string, unknown>).key || "slo"),
                label: String((item as Record<string, unknown>).label || "SLO"),
                objective: String((item as Record<string, unknown>).objective || ""),
                currentValue: String((item as Record<string, unknown>).current_value || ""),
                status: String((item as Record<string, unknown>).status || "success"),
              }))
            : [],
          traceSummary:
            raw.trace_summary &&
            typeof raw.trace_summary === "object" &&
            !Array.isArray(raw.trace_summary)
              ? {
                  enabled: Boolean((raw.trace_summary as Record<string, unknown>).enabled),
                  traceId:
                    typeof (raw.trace_summary as Record<string, unknown>).trace_id === "string"
                      ? ((raw.trace_summary as Record<string, unknown>).trace_id as string)
                      : undefined,
                  correlationId:
                    typeof (raw.trace_summary as Record<string, unknown>).correlation_id ===
                    "string"
                      ? ((raw.trace_summary as Record<string, unknown>).correlation_id as string)
                      : undefined,
                  requestId:
                    typeof (raw.trace_summary as Record<string, unknown>).request_id === "string"
                      ? ((raw.trace_summary as Record<string, unknown>).request_id as string)
                      : undefined,
                  strategy: String(
                    (raw.trace_summary as Record<string, unknown>).strategy || "logs",
                  ),
                }
              : {
                  enabled: false,
                  strategy: "logs",
                },
          sentrySummary:
            raw.sentry_summary &&
            typeof raw.sentry_summary === "object" &&
            !Array.isArray(raw.sentry_summary)
              ? {
                  configured: Boolean((raw.sentry_summary as Record<string, unknown>).configured),
                  tracesSampleRate: Number(
                    (raw.sentry_summary as Record<string, unknown>).traces_sample_rate || 0,
                  ),
                  errorBudget:
                    (raw.sentry_summary as Record<string, unknown>).error_budget &&
                    typeof (raw.sentry_summary as Record<string, unknown>).error_budget === "object"
                      ? {
                          dailyFailureThreshold: Number(
                            (
                              (raw.sentry_summary as Record<string, unknown>)
                                .error_budget as Record<string, unknown>
                            ).daily_failure_threshold || 0,
                          ),
                          queueDeadLetterThreshold: Number(
                            (
                              (raw.sentry_summary as Record<string, unknown>)
                                .error_budget as Record<string, unknown>
                            ).queue_dead_letter_threshold || 0,
                          ),
                        }
                      : {
                          dailyFailureThreshold: 0,
                          queueDeadLetterThreshold: 0,
                        },
                }
              : {
                  configured: false,
                  tracesSampleRate: 0,
                  errorBudget: { dailyFailureThreshold: 0, queueDeadLetterThreshold: 0 },
                },
          queryObservability:
            raw.query_observability &&
            typeof raw.query_observability === "object" &&
            !Array.isArray(raw.query_observability)
              ? {
                  thresholds:
                    (raw.query_observability as Record<string, unknown>).thresholds &&
                    typeof (raw.query_observability as Record<string, unknown>).thresholds ===
                      "object"
                      ? Object.fromEntries(
                          Object.entries(
                            (raw.query_observability as Record<string, unknown>)
                              .thresholds as Record<string, unknown>,
                          ).map(([key, item]) => [key, Number(item || 0)]),
                        )
                      : {},
                  indexedSurfaces: Array.isArray(
                    (raw.query_observability as Record<string, unknown>).indexed_surfaces,
                  )
                    ? (
                        (raw.query_observability as Record<string, unknown>)
                          .indexed_surfaces as unknown[]
                      ).map(String)
                    : [],
                  capacityNotes: Array.isArray(
                    (raw.query_observability as Record<string, unknown>).capacity_notes,
                  )
                    ? (
                        (raw.query_observability as Record<string, unknown>)
                          .capacity_notes as unknown[]
                      ).map(String)
                    : [],
                }
              : {
                  thresholds: {},
                  indexedSurfaces: [],
                  capacityNotes: [],
                },
          loadRehearsals: Array.isArray(raw.load_rehearsals)
            ? raw.load_rehearsals.map((item) => ({
                key: String((item as Record<string, unknown>).key || "drill"),
                label: String((item as Record<string, unknown>).label || "Drill"),
                path: String((item as Record<string, unknown>).path || ""),
              }))
            : [],
        } satisfies IbOperationalReliabilityPayload)
      : undefined,
  };
}

export function useIbAnalytics() {
  const response = useSchoolSWR<Record<string, unknown>>("/api/v1/ib/analytics");
  const raw = response.data;
  return {
    ...response,
    data: raw
      ? ({
          teacherFriction: normalizeMetricObject(raw.teacher_friction),
          coordinatorOperations: normalizeMetricObject(raw.coordinator_operations),
          latencyAndQueueHealth: normalizeMetricObject(raw.latency_and_queue_health),
          pilotSuccessScorecard: normalizeMetricObject(raw.pilot_success_scorecard),
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbAnalyticsPayload)
      : undefined,
  };
}

export async function saveIbPilotSetup(programme: string, payload: Record<string, unknown>) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup?programme=${encodeURIComponent(programme)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ pilot_setup: { programme, ...payload } }),
    },
  );
}

export async function applyIbPilotBaseline(programme: string) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup/apply_baseline?programme=${encodeURIComponent(programme)}`,
    {
      method: "POST",
    },
  );
}

export async function validateIbPilotSetup(programme: string) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup/validate_setup?programme=${encodeURIComponent(programme)}`,
    {
      method: "POST",
    },
  );
}

export async function verifyIbReleaseBaseline() {
  return apiFetch<IbReleaseBaselinePayload>("/api/v1/ib/release_baseline/verify", {
    method: "POST",
  });
}

export async function certifyIbReleaseBaseline() {
  return apiFetch<IbReleaseBaselinePayload>("/api/v1/ib/release_baseline/certify", {
    method: "POST",
  });
}

export async function rollbackIbReleaseBaseline() {
  return apiFetch<IbReleaseBaselinePayload>("/api/v1/ib/release_baseline/rollback", {
    method: "POST",
  });
}

export async function activateIbPilotSetup(programme: string) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup/activate?programme=${encodeURIComponent(programme)}`,
    {
      method: "POST",
    },
  );
}

export async function pauseIbPilotSetup(programme: string, reason: string) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup/pause?programme=${encodeURIComponent(programme)}`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}

export async function resumeIbPilotSetup(programme: string) {
  return apiFetch<IbPilotSetupPayload>(
    `/api/v1/ib/pilot_setup/resume?programme=${encodeURIComponent(programme)}`,
    {
      method: "POST",
    },
  );
}

export async function createIbImportBatch(payload: Record<string, unknown>) {
  return apiFetch<IbImportBatchPayload>("/api/v1/ib/import_batches", {
    method: "POST",
    body: JSON.stringify({ ib_import_batch: payload }),
  });
}

export async function updateIbImportBatch(id: number, payload: Record<string, unknown>) {
  return apiFetch<IbImportBatchPayload>(`/api/v1/ib/import_batches/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ib_import_batch: payload }),
  });
}

export async function dryRunIbImportBatch(id: number) {
  return apiFetch<IbImportBatchPayload>(`/api/v1/ib/import_batches/${id}/dry_run`, {
    method: "POST",
  });
}

export async function executeIbImportBatch(id: number) {
  return apiFetch<IbImportBatchPayload>(`/api/v1/ib/import_batches/${id}/execute`, {
    method: "POST",
  });
}

export async function rollbackIbImportBatch(id: number) {
  return apiFetch<IbImportBatchPayload>(`/api/v1/ib/import_batches/${id}/rollback`, {
    method: "POST",
  });
}

export async function replayIbJobOperation(operationType: string, id: number) {
  return apiFetch<IbJobOperationsPayload>("/api/v1/ib/job_operations/replay", {
    method: "POST",
    body: JSON.stringify({ operation_type: operationType, id }),
  });
}

export async function cancelIbJobOperation(jobId: number, reason?: string) {
  return apiFetch<IbJobOperationsPayload>("/api/v1/ib/job_operations/cancel", {
    method: "POST",
    body: JSON.stringify({ job_id: jobId, reason }),
  });
}

export async function backfillIbJobOperations(kind: "analytics") {
  return apiFetch<IbJobOperationsPayload>("/api/v1/ib/job_operations/backfill", {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

function mapImportBatch(raw: Record<string, unknown>): IbImportBatchPayload {
  return {
    id: Number(raw.id),
    programme: String(raw.programme || "Mixed"),
    status: String(raw.status || "uploaded"),
    sourceKind: String(raw.source_kind || "csv"),
    sourceFormat: String(raw.source_format || "csv"),
    sourceSystem: String(raw.source_system || "generic"),
    importMode: String(raw.import_mode || "draft"),
    coexistenceMode: Boolean(raw.coexistence_mode),
    sourceFilename: String(raw.source_filename || "upload.csv"),
    sourceChecksum: typeof raw.source_checksum === "string" ? raw.source_checksum : null,
    sourceContractVersion:
      typeof raw.source_contract_version === "string" ? raw.source_contract_version : null,
    scopeMetadata: normalizeRecord(raw.scope_metadata),
    parserWarnings: Array.isArray(raw.parser_warnings) ? raw.parser_warnings.map(String) : [],
    mappingPayload:
      raw.mapping_payload &&
      typeof raw.mapping_payload === "object" &&
      !Array.isArray(raw.mapping_payload)
        ? (raw.mapping_payload as Record<string, unknown>)
        : {},
    validationSummary: normalizeMetricObject(raw.validation_summary),
    previewSummary: normalizeRecord(raw.preview_summary),
    dryRunSummary: normalizeMetricObject(raw.dry_run_summary),
    executionSummary: normalizeMetricObject(raw.execution_summary),
    rollbackSummary: normalizeMetricObject(raw.rollback_summary),
    rollbackCapabilities: normalizeRecord(raw.rollback_capabilities),
    recoveryPayload: normalizeRecord(raw.recovery_payload),
    resumeCursor: typeof raw.resume_cursor === "number" ? raw.resume_cursor : null,
    lastEnqueuedJobId:
      typeof raw.last_enqueued_job_id === "number" ? raw.last_enqueued_job_id : null,
    errorMessage: typeof raw.error_message === "string" ? raw.error_message : null,
    lastDryRunAt: typeof raw.last_dry_run_at === "string" ? raw.last_dry_run_at : null,
    executedAt: typeof raw.executed_at === "string" ? raw.executed_at : null,
    rows: Array.isArray(raw.rows)
      ? raw.rows.map((row) => ({
          id: Number((row as Record<string, unknown>).id),
          rowIndex: Number((row as Record<string, unknown>).row_index || 0),
          sheetName:
            typeof (row as Record<string, unknown>).sheet_name === "string"
              ? ((row as Record<string, unknown>).sheet_name as string)
              : null,
          sourceIdentifier: String((row as Record<string, unknown>).source_identifier || "row"),
          status: String((row as Record<string, unknown>).status || "staged"),
          sourcePayload:
            (row as Record<string, unknown>).source_payload &&
            typeof (row as Record<string, unknown>).source_payload === "object"
              ? ((row as Record<string, unknown>).source_payload as Record<string, unknown>)
              : {},
          normalizedPayload:
            (row as Record<string, unknown>).normalized_payload &&
            typeof (row as Record<string, unknown>).normalized_payload === "object"
              ? ((row as Record<string, unknown>).normalized_payload as Record<string, unknown>)
              : {},
          mappingPayload:
            (row as Record<string, unknown>).mapping_payload &&
            typeof (row as Record<string, unknown>).mapping_payload === "object"
              ? ((row as Record<string, unknown>).mapping_payload as Record<string, unknown>)
              : {},
          warnings: Array.isArray((row as Record<string, unknown>).warnings)
            ? ((row as Record<string, unknown>).warnings as unknown[]).map(String)
            : [],
          errors: Array.isArray((row as Record<string, unknown>).errors)
            ? ((row as Record<string, unknown>).errors as unknown[]).map(String)
            : [],
          conflictPayload:
            (row as Record<string, unknown>).conflict_payload &&
            typeof (row as Record<string, unknown>).conflict_payload === "object"
              ? ((row as Record<string, unknown>).conflict_payload as Record<string, unknown>)
              : {},
          resolutionPayload:
            (row as Record<string, unknown>).resolution_payload &&
            typeof (row as Record<string, unknown>).resolution_payload === "object"
              ? ((row as Record<string, unknown>).resolution_payload as Record<string, unknown>)
              : {},
          executionPayload:
            (row as Record<string, unknown>).execution_payload &&
            typeof (row as Record<string, unknown>).execution_payload === "object"
              ? ((row as Record<string, unknown>).execution_payload as Record<string, unknown>)
              : {},
          targetEntityRef:
            typeof (row as Record<string, unknown>).target_entity_ref === "string"
              ? ((row as Record<string, unknown>).target_entity_ref as string)
              : null,
          entityKind:
            typeof (row as Record<string, unknown>).entity_kind === "string"
              ? ((row as Record<string, unknown>).entity_kind as string)
              : null,
          dataLossRisk:
            typeof (row as Record<string, unknown>).data_loss_risk === "string"
              ? ((row as Record<string, unknown>).data_loss_risk as string)
              : null,
          duplicateCandidateRef:
            typeof (row as Record<string, unknown>).duplicate_candidate_ref === "string"
              ? ((row as Record<string, unknown>).duplicate_candidate_ref as string)
              : null,
          unsupportedFields: Array.isArray((row as Record<string, unknown>).unsupported_fields)
            ? ((row as Record<string, unknown>).unsupported_fields as unknown[]).map(String)
            : [],
        }))
      : [],
    createdAt: String(raw.created_at || ""),
    updatedAt: String(raw.updated_at || ""),
  };
}

function normalizeMetricObject(value: unknown): Record<string, number | string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      typeof item === "number" ? item : String(item ?? ""),
    ]),
  );
}

function normalizeRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
