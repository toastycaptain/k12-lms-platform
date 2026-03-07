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
  executionPayload: Record<string, unknown>;
  targetEntityRef?: string | null;
}

export interface IbImportBatchPayload {
  id: number;
  programme: string;
  status: string;
  sourceKind: string;
  sourceFormat: string;
  sourceFilename: string;
  sourceChecksum?: string | null;
  parserWarnings: string[];
  mappingPayload: Record<string, unknown>;
  validationSummary: Record<string, unknown>;
  dryRunSummary: Record<string, unknown>;
  executionSummary: Record<string, unknown>;
  rollbackSummary: Record<string, unknown>;
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
  }>;
  failures: Array<{
    id: number;
    operationType: string;
    title: string;
    detail: string;
    happenedAt: string;
  }>;
  generatedAt: string;
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
              }))
            : [],
          failures: Array.isArray(raw.failures)
            ? raw.failures.map((item) => ({
                id: Number((item as Record<string, unknown>).id || 0),
                operationType: String(
                  (item as Record<string, unknown>).operation_type || "unknown",
                ),
                title: String((item as Record<string, unknown>).title || "Failure"),
                detail: String((item as Record<string, unknown>).detail || ""),
                happenedAt: String((item as Record<string, unknown>).happened_at || ""),
              }))
            : [],
          generatedAt: String(raw.generated_at || ""),
        } satisfies IbJobOperationsPayload)
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

function mapImportBatch(raw: Record<string, unknown>): IbImportBatchPayload {
  return {
    id: Number(raw.id),
    programme: String(raw.programme || "Mixed"),
    status: String(raw.status || "uploaded"),
    sourceKind: String(raw.source_kind || "csv"),
    sourceFormat: String(raw.source_format || "csv"),
    sourceFilename: String(raw.source_filename || "upload.csv"),
    sourceChecksum: typeof raw.source_checksum === "string" ? raw.source_checksum : null,
    parserWarnings: Array.isArray(raw.parser_warnings) ? raw.parser_warnings.map(String) : [],
    mappingPayload:
      raw.mapping_payload &&
      typeof raw.mapping_payload === "object" &&
      !Array.isArray(raw.mapping_payload)
        ? (raw.mapping_payload as Record<string, unknown>)
        : {},
    validationSummary: normalizeMetricObject(raw.validation_summary),
    dryRunSummary: normalizeMetricObject(raw.dry_run_summary),
    executionSummary: normalizeMetricObject(raw.execution_summary),
    rollbackSummary: normalizeMetricObject(raw.rollback_summary),
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
          executionPayload:
            (row as Record<string, unknown>).execution_payload &&
            typeof (row as Record<string, unknown>).execution_payload === "object"
              ? ((row as Record<string, unknown>).execution_payload as Record<string, unknown>)
              : {},
          targetEntityRef:
            typeof (row as Record<string, unknown>).target_entity_ref === "string"
              ? ((row as Record<string, unknown>).target_entity_ref as string)
              : null,
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
