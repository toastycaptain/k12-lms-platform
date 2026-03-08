"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, VirtualDataGrid, useToast } from "@k12/ui";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import {
  captureIbBenchmarkSnapshot,
  captureIbPilotBaseline,
  captureIbReplacementReadiness,
  saveIbCollaborationEvent,
  saveIbCollaborationTask,
  saveIbIntelligenceMetricDefinition,
  saveIbMigrationMappingTemplate,
  saveIbMigrationSession,
  saveIbPilotFeedbackItem,
  saveIbPilotProfile,
  saveIbReportCycle,
  saveIbReportTemplate,
  saveIbSearchProfile,
  saveIbMobileSyncDiagnostic,
  useIbBenchmarkConsole,
  useIbCollaborationWorkbench,
  useIbIntelligenceSemanticLayer,
  useIbMigrationConsole,
  useIbMobileTrust,
  useIbPilotProgramme,
  useIbPilotSupport,
  useIbReplacementReadiness,
  useIbReportingOps,
  useIbSearchOps,
  useIbTrustConsole,
} from "@/features/ib/phase9/data";

function toneClasses(status: string) {
  switch (status) {
    case "green":
    case "active":
    case "healthy":
    case "within_budget":
      return "bg-emerald-50 text-emerald-900";
    case "red":
    case "risk":
    case "failed":
      return "bg-rose-50 text-rose-900";
    default:
      return "bg-amber-50 text-amber-900";
  }
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function DefinitionList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ key: string; value: string }>;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-3">
            <span className="text-slate-500">{humanize(row.key)}</span>
            <span className="text-right font-medium text-slate-950">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PilotAdoptionPanel() {
  const { addToast } = useToast();
  const { data, mutate } = useIbPilotProgramme();
  const { data: support, mutate: mutateSupport } = useIbPilotSupport();
  const [busy, setBusy] = useState<string | null>(null);

  async function createPilotProfile() {
    setBusy("profile");
    try {
      await saveIbPilotProfile({
        cohort_key: `phase9-${Date.now()}`,
        name: "Phase 9 pilot cohort",
        archetype_key: data?.archetypes[0]?.key || "continuum",
        programme_scope: "Mixed",
        launch_window: "Spring 2026",
      });
      await mutate();
      addToast("success", "Pilot cohort saved.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to save pilot cohort.");
    } finally {
      setBusy(null);
    }
  }

  async function captureBaseline() {
    if (!data?.profiles[0]) return;
    setBusy("baseline");
    try {
      await captureIbPilotBaseline(data.profiles[0].id);
      await Promise.all([mutate(), mutateSupport()]);
      addToast("success", "Pilot baseline captured.");
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "Unable to capture pilot baseline.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function logFeedback() {
    setBusy("feedback");
    try {
      await saveIbPilotFeedbackItem({
        ib_pilot_profile_id: data?.profiles[0]?.id,
        title: "Launch-day signal",
        detail: "Coordinator reviewed the updated rollout and readiness surfaces.",
        surface: "rollout_console",
        category: "onboarding",
        role_scope: "coordinator",
        tags: ["phase9", "pilot"],
      });
      await mutateSupport();
      addToast("success", "Pilot feedback logged.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to log feedback.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspacePanel
      title="Pilot adoption and support"
      description="Phase 9 starts with explicit pilot cohorts, baseline metrics, and launch-week support visibility."
    >
      {!data || !support ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading pilot adoption data...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void createPilotProfile()} disabled={busy !== null}>
              {busy === "profile" ? "Saving..." : "Add pilot cohort"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void captureBaseline()}
              disabled={busy !== null || !data.profiles[0]}
            >
              {busy === "baseline" ? "Capturing..." : "Capture baseline"}
            </Button>
            <Button variant="secondary" onClick={() => void logFeedback()} disabled={busy !== null}>
              {busy === "feedback" ? "Logging..." : "Log support signal"}
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DefinitionList
              title="Pilot archetypes"
              rows={data.archetypes.map((row) => ({ key: row.key, value: row.label }))}
            />
            <DefinitionList
              title="Success metrics"
              rows={data.metricDefinitions.slice(0, 4).map((row) => ({
                key: row.key,
                value: `${row.role} • ${row.target}`,
              }))}
            />
          </div>

          {data.profiles.length === 0 ? (
            <EmptyState
              title="No pilot cohorts yet"
              description="Create a pilot cohort to start tracking school adoption and baseline instrumentation."
            />
          ) : (
            <VirtualDataGrid
              columns={[
                { key: "name", header: "Cohort" },
                { key: "archetype", header: "Archetype" },
                { key: "status", header: "Status" },
                { key: "baseline", header: "Baselines" },
              ]}
              rows={data.profiles.map((profile) => ({
                name: profile.name,
                archetype: humanize(profile.archetypeKey),
                status: profile.status,
                baseline: `${profile.baselineSnapshotCount} captured`,
              }))}
            />
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            {[
              { title: "Launch day", rows: support.launchDay },
              { title: "Reporting week", rows: support.reportingWeek },
              { title: "Moderation week", rows: support.moderationWeek },
            ].map((section) => (
              <div key={section.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{section.title}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  {section.rows.map((row) => (
                    <a
                      key={row.key}
                      href={row.href}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3"
                    >
                      <span>{row.label}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses(row.status)}`}
                      >
                        {row.count}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-950">Latest support signals</p>
            {support.feedbackQueue.length > 0 ? (
              support.feedbackQueue.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses(item.sentiment)}`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                  <p className="mt-1">{item.detail}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No launch feedback logged yet.
              </div>
            )}
          </div>
        </div>
      )}
    </WorkspacePanel>
  );
}

export function MigrationConfidencePanel() {
  const { addToast } = useToast();
  const { data, mutate } = useIbMigrationConsole();
  const [busy, setBusy] = useState<string | null>(null);

  async function createSession() {
    setBusy("session");
    try {
      await saveIbMigrationSession({
        session_key: `phase9-migration-${Date.now()}`,
        source_system: "toddle",
        status: "discovered",
        cutover_state: "discovered",
      });
      await mutate();
      addToast("success", "Migration session created.");
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "Unable to create migration session.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function createTemplate() {
    setBusy("template");
    try {
      await saveIbMigrationMappingTemplate({
        source_system: "managebac",
        programme: "Mixed",
        name: "Phase 9 starter template",
        shared: true,
      });
      await mutate();
      addToast("success", "Mapping template saved.");
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "Unable to save mapping template.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspacePanel
      title="Migration moat and reconciliation"
      description="Source-aware sessions, mapping templates, and inventory summary make cutover safety explicit instead of implicit."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading migration console...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void createSession()} disabled={busy !== null}>
              {busy === "session" ? "Creating..." : "Create migration session"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void createTemplate()}
              disabled={busy !== null}
            >
              {busy === "template" ? "Saving..." : "Save mapping template"}
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DefinitionList
              title="Inventory summary"
              rows={Object.entries(data.inventorySummary).map(([key, value]) => ({
                key,
                value: typeof value === "object" ? JSON.stringify(value) : String(value),
              }))}
            />
            <DefinitionList
              title="Source contracts"
              rows={Object.entries(data.sourceContracts).map(([key, value]) => ({
                key,
                value: `${value.assumptions.length} assumption(s) tracked`,
              }))}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DefinitionList
              title="Confidence summary"
              rows={Object.entries(data.confidenceSummary).map(([key, value]) => ({
                key,
                value: String(value),
              }))}
            />
            <DefinitionList
              title="Template generators"
              rows={data.templateGenerators.map((value) => ({
                key: value,
                value: "available",
              }))}
            />
          </div>

          <VirtualDataGrid
            columns={[
              { key: "source", header: "Source" },
              { key: "cutover", header: "Cutover state" },
              { key: "status", header: "Status" },
              { key: "session", header: "Session key" },
            ]}
            rows={data.sessions.slice(0, 6).map((session) => ({
              source: session.sourceSystem,
              cutover: humanize(session.cutoverState),
              status: session.status,
              session: session.sessionKey,
            }))}
          />

          <VirtualDataGrid
            columns={[
              { key: "source", header: "Adapter" },
              { key: "connector", header: "Connector" },
              { key: "shadow", header: "Shadow mode" },
              { key: "delta", header: "Delta rerun" },
            ]}
            rows={Object.entries(data.adapterProtocols).map(([source, protocol]) => ({
              source,
              connector: protocol.connector,
              shadow: protocol.shadowMode ? "Yes" : "No",
              delta: protocol.deltaRerun ? "Yes" : "No",
            }))}
          />

          <VirtualDataGrid
            columns={[
              { key: "name", header: "Template" },
              { key: "source", header: "Source" },
              { key: "programme", header: "Programme" },
              { key: "shared", header: "Shared" },
            ]}
            rows={data.mappingTemplates.slice(0, 6).map((template) => ({
              name: template.name,
              source: template.sourceSystem,
              programme: template.programme,
              shared: template.shared ? "Yes" : "No",
            }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function ReplacementReadinessPanel() {
  const { addToast } = useToast();
  const { data, mutate } = useIbReplacementReadiness();
  const [busy, setBusy] = useState(false);

  async function refreshAudit() {
    setBusy(true);
    try {
      await captureIbReplacementReadiness();
      await mutate();
      addToast("success", "Replacement-readiness snapshot refreshed.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to refresh readiness.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePanel
      title="Replacement-readiness audit"
      description="The Phase 9 closeout compares track health, pilot success checks, and unresolved gaps in one exportable summary."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading replacement-readiness audit...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Recommended next step</p>
              <p className="mt-1">{humanize(data.nextStep)}</p>
            </div>
            <Button variant="secondary" onClick={() => void refreshAudit()} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh audit"}
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {data.tracks.map((track) => (
              <a
                key={track.key}
                href={track.href}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{track.title}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses(track.status)}`}
                  >
                    {track.status}
                  </span>
                </div>
                <p className="mt-2">{track.detail}</p>
                <p className="mt-3 text-xs text-slate-500">{track.followUp}</p>
              </a>
            ))}
          </div>

          <VirtualDataGrid
            columns={[
              { key: "goal", header: "Pilot goal" },
              { key: "role", header: "Role" },
              { key: "target", header: "Target" },
              { key: "observed", header: "Observed" },
              { key: "status", header: "Status" },
            ]}
            rows={data.pilotGoalChecks.map((goal) => ({
              goal: goal.label,
              role: goal.role,
              target: goal.target,
              observed: goal.observed,
              status: goal.status,
            }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function ReportingOperationsPanel() {
  const { addToast } = useToast();
  const { data, mutate } = useIbReportingOps();
  const [busy, setBusy] = useState<string | null>(null);

  async function createCycle() {
    setBusy("cycle");
    try {
      await saveIbReportCycle({
        programme: "Mixed",
        cycle_key: `phase9-cycle-${Date.now()}`,
        status: "open",
      });
      await mutate();
      addToast("success", "Reporting cycle created.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to create cycle.");
    } finally {
      setBusy(null);
    }
  }

  async function createTemplate() {
    setBusy("template");
    try {
      await saveIbReportTemplate({
        programme: "Mixed",
        audience: "guardian",
        family: "conference_packet",
        name: "Phase 9 reporting template",
      });
      await mutate();
      addToast("success", "Reporting template saved.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to save template.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspacePanel
      title="Reporting operations command center"
      description="Cycle health, template inventory, and delivery readiness sit next to the live report render so reporting becomes a switch trigger."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading reporting operations...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void createCycle()} disabled={busy !== null}>
              {busy === "cycle" ? "Creating..." : "Add report cycle"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void createTemplate()}
              disabled={busy !== null}
            >
              {busy === "template" ? "Saving..." : "Add template"}
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DefinitionList
              title="Delivery summary"
              rows={Object.entries(data.deliverySummary).map(([key, value]) => ({
                key,
                value: String(value),
              }))}
            />
            <DefinitionList
              title="Role ownership"
              rows={Object.entries(data.roleMatrix).map(([key, value]) => ({ key, value }))}
            />
          </div>

          <VirtualDataGrid
            columns={[
              { key: "cycle", header: "Cycle" },
              { key: "programme", header: "Programme" },
              { key: "status", header: "Status" },
              { key: "reports", header: "Reports" },
            ]}
            rows={data.cycles.slice(0, 6).map((cycle) => ({
              cycle: cycle.cycleKey,
              programme: cycle.programme,
              status: cycle.status,
              reports: String(cycle.reportCount),
            }))}
          />

          <VirtualDataGrid
            columns={[
              { key: "template", header: "Template" },
              { key: "family", header: "Family" },
              { key: "audience", header: "Audience" },
              { key: "status", header: "Status" },
            ]}
            rows={data.templates.slice(0, 6).map((template) => ({
              template: template.name,
              family: humanize(template.family),
              audience: template.audience,
              status: template.status,
            }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function CollaborationOperationsPanel({
  curriculumDocumentId,
}: {
  curriculumDocumentId?: number | null;
}) {
  const { addToast } = useToast();
  const { data, mutate } = useIbCollaborationWorkbench(curriculumDocumentId);
  const [busy, setBusy] = useState<string | null>(null);

  async function createTask() {
    setBusy("task");
    try {
      await saveIbCollaborationTask({
        curriculum_document_id: curriculumDocumentId,
        title: "Phase 9 follow-up task",
        detail: "Review the collaboration rollout guidance before expanding to more schools.",
        priority: "high",
        status: "open",
        section_key: "overview",
      });
      await mutate();
      addToast("success", "Collaboration follow-up created.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to create task.");
    } finally {
      setBusy(null);
    }
  }

  async function recordEvent() {
    setBusy("event");
    try {
      await saveIbCollaborationEvent({
        curriculum_document_id: curriculumDocumentId,
        event_name: "replay_event",
        route_id: "ib.review",
        scope_key: curriculumDocumentId ? String(curriculumDocumentId) : "phase9",
        section_key: "summary",
        durable: true,
        payload: { source: "phase9_panel" },
      });
      await mutate();
      addToast("success", "Collaboration replay event recorded.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to record event.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <WorkspacePanel
      title="Collaboration workbench"
      description="Phase 9 moves collaboration from passive presence to durable events, task follow-up, and rollout-safe transport."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading collaboration workbench...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void createTask()} disabled={busy !== null}>
              {busy === "task" ? "Creating..." : "Create follow-up"}
            </Button>
            <Button variant="secondary" onClick={() => void recordEvent()} disabled={busy !== null}>
              {busy === "event" ? "Recording..." : "Record replay event"}
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <DefinitionList
              title="Session summary"
              rows={Object.entries(data.sessionSummary).map(([key, value]) => ({
                key,
                value: String(value),
              }))}
            />
            <DefinitionList
              title="Transport strategy"
              rows={[
                { key: "strategy", value: data.transportStrategy.strategy },
                { key: "durable_events", value: data.transportStrategy.durableEvents.join(", ") },
                {
                  key: "ephemeral_events",
                  value: data.transportStrategy.ephemeralEvents.join(", "),
                },
              ]}
            />
          </div>

          <VirtualDataGrid
            columns={[
              { key: "event", header: "Event" },
              { key: "scope", header: "Scope" },
              { key: "route", header: "Route" },
              { key: "user", header: "User" },
            ]}
            rows={data.recentEvents.slice(0, 6).map((event) => ({
              event: event.eventName,
              scope: event.scopeKey,
              route: event.routeId || "n/a",
              user: event.userLabel,
            }))}
          />

          <VirtualDataGrid
            columns={[
              { key: "title", header: "Task" },
              { key: "status", header: "Status" },
              { key: "priority", header: "Priority" },
              { key: "owner", header: "Assigned to" },
            ]}
            rows={data.tasks.slice(0, 6).map((task) => ({
              title: task.title,
              status: task.status,
              priority: task.priority,
              owner: task.assignedToLabel || "Unassigned",
            }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function BenchmarkRefreshPanel({
  title = "Benchmark refresh",
  description = "Capture live benchmark snapshots so teacher and specialist speed work stays measurable.",
  roleScope = "teacher",
}: {
  title?: string;
  description?: string;
  roleScope?: string;
}) {
  const { addToast } = useToast();
  const { data, mutate } = useIbBenchmarkConsole();
  const [busy, setBusy] = useState(false);

  async function capture() {
    setBusy(true);
    try {
      await captureIbBenchmarkSnapshot({
        role_scope: roleScope,
        workflow_family: roleScope === "specialist" ? "specialist_contribution" : "planning",
        status: "current",
      });
      await mutate();
      addToast("success", "Benchmark snapshot captured.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to capture benchmark.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePanel title={title} description={description}>
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading benchmark data...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {data.currentBudget.regressions.length} workflow regression(s) currently over budget.
            </p>
            <Button variant="secondary" onClick={() => void capture()} disabled={busy}>
              {busy ? "Capturing..." : "Capture snapshot"}
            </Button>
          </div>

          <div className="space-y-2">
            {data.currentBenchmark.map((workflow) => (
              <div
                key={workflow.workflowKey}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{workflow.label}</p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses(workflow.status)}`}
                  >
                    {workflow.status === "within_budget" ? "Within budget" : "Watch"}
                  </span>
                </div>
                <p className="mt-1">
                  {Math.round(workflow.observedMs / 1000)}s observed across{" "}
                  {workflow.observedClicks} clicks.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </WorkspacePanel>
  );
}

export function SemanticLayerPanel() {
  const { addToast } = useToast();
  const { data, mutate } = useIbIntelligenceSemanticLayer();
  const { data: pilotProgramme } = useIbPilotProgramme();
  const [busy, setBusy] = useState(false);
  const latestPilot = pilotProgramme?.profiles[0];

  async function createDefinition() {
    setBusy(true);
    try {
      await saveIbIntelligenceMetricDefinition({
        key: `pilot_support_load_${Date.now()}`,
        metric_family: "workflow",
        label: "Pilot support load",
        definition: "Tracks support queue pressure during staged pilot rollout.",
        version: "phase9.v1",
      });
      await mutate();
      addToast("success", "Semantic-layer definition saved.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to save definition.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePanel
      title="Decision-support semantic layer"
      description="Coordinator intelligence is now explicit about provenance, thresholds, and pilot context."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading semantic layer...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {latestPilot
                ? `Active pilot archetype: ${humanize(latestPilot.archetypeKey)}`
                : "No active pilot profile is attached to this school yet."}
            </p>
            <Button variant="secondary" onClick={() => void createDefinition()} disabled={busy}>
              {busy ? "Saving..." : "Add governance metric"}
            </Button>
          </div>

          <DefinitionList
            title="Current intelligence summary"
            rows={Object.entries(data.summary).map(([key, value]) => ({
              key,
              value: typeof value === "object" ? JSON.stringify(value) : String(value),
            }))}
          />

          <VirtualDataGrid
            columns={[
              { key: "label", header: "Metric" },
              { key: "family", header: "Family" },
              { key: "status", header: "Status" },
              { key: "source", header: "Source" },
            ]}
            rows={data.metricDictionary.slice(0, 8).map((definition) => ({
              label: definition.label,
              family: definition.metricFamily,
              status: definition.status,
              source: Object.values(definition.sourceOfTruth)[0] || "service",
            }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function TrustPolicyPanel({
  audience,
  title = "Trust policy",
  description = "Quiet-hours, cadence, and approval rules stay visible so family and student communication feels deliberate.",
}: {
  audience: "guardian" | "student" | "mixed";
  title?: string;
  description?: string;
}) {
  const { data } = useIbTrustConsole();
  const policies = useMemo(
    () =>
      data?.policies.filter(
        (policy) => policy.audience === audience || policy.audience === "mixed",
      ) || [],
    [audience, data?.policies],
  );

  return (
    <WorkspacePanel title={title} description={description}>
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading trust policy...
        </div>
      ) : policies.length === 0 ? (
        <EmptyState
          title="No trust policy configured"
          description="Add a trust rule in the internal rollout console before widening communication volume."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">
                    {humanize(policy.contentType)} • {humanize(policy.cadenceMode)}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${toneClasses(policy.status)}`}
                  >
                    {policy.status}
                  </span>
                </div>
                <p className="mt-2">
                  {humanize(policy.deliveryMode)} delivery with {humanize(policy.approvalMode)}{" "}
                  approval.
                </p>
              </div>
            ))}
          </div>

          <DefinitionList
            title="Trust framework"
            rows={Object.entries(data.trustFramework).map(([key, value]) => ({ key, value }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function MobileTrustPanel({ allowAction = false }: { allowAction?: boolean }) {
  const { addToast } = useToast();
  const { data, mutate } = useIbMobileTrust();
  const [busy, setBusy] = useState(false);

  async function logDiagnostic() {
    if (!allowAction) return;
    setBusy(true);
    try {
      await saveIbMobileSyncDiagnostic({
        workflow_key: "quick_contribution",
        device_class: "phone",
        status: "healthy",
        queue_depth: 0,
      });
      await mutate();
      addToast("success", "Mobile diagnostic logged.");
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "Unable to save mobile diagnostic.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePanel
      title="Mobile and offline trust"
      description="The mobile rollout stays explicit about trusted workflows, sync health, and recovery expectations."
    >
      {!data ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading mobile diagnostics...
        </div>
      ) : (
        <div className="space-y-4">
          {allowAction ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => void logDiagnostic()} disabled={busy}>
                {busy ? "Saving..." : "Log mobile health"}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            {data.trustContract.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <span>{row.label}</span>
                <span className="text-xs font-semibold text-slate-500">
                  {row.desktopFirst ? "Desktop first" : "Mobile trusted"}
                </span>
              </div>
            ))}
          </div>

          <DefinitionList
            title="Success criteria"
            rows={Object.entries(data.successCriteria).map(([key, value]) => ({ key, value }))}
          />
        </div>
      )}
    </WorkspacePanel>
  );
}

export function SearchOpsPanel({ compact = false }: { compact?: boolean }) {
  const { addToast } = useToast();
  const { data, mutate } = useIbSearchOps();
  const [busy, setBusy] = useState(false);

  async function createProfile() {
    if (compact) return;
    setBusy(true);
    try {
      await saveIbSearchProfile({
        key: `phase9-large-school-${Date.now()}`,
        status: "active",
        latency_budget_ms: 800,
        scope_rules: { school_size: "large" },
      });
      await mutate();
      addToast("success", "Search operations profile saved.");
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to save search profile.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return compact ? null : (
      <WorkspacePanel
        title="Search operations"
        description="Loading search profiles and large-school inventory..."
      >
        <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Loading search operations...
        </div>
      </WorkspacePanel>
    );
  }

  const content = (
    <div className="space-y-4">
      {!compact ? (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => void createProfile()} disabled={busy}>
            {busy ? "Saving..." : "Add large-school profile"}
          </Button>
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <DefinitionList
          title="Entity inventory"
          rows={Object.entries(data.entityInventory).map(([key, value]) => ({
            key,
            value: String(value),
          }))}
        />
        <DefinitionList
          title="Result groups"
          rows={data.resultGroups.map((group) => ({ key: group, value: "Indexed" }))}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DefinitionList
          title="Freshness"
          rows={[
            { key: "Index strategy", value: data.freshness.indexStrategy },
            { key: "Latency budget", value: `${data.freshness.latencyBudgetMs} ms` },
            { key: "Backpressure", value: data.freshness.backpressureStrategy },
            { key: "Window", value: `${data.freshness.adoptionWindowDays} days` },
          ]}
        />
        <DefinitionList
          title="Adoption summary"
          rows={Object.entries(data.adoptionSummary).map(([key, value]) => ({
            key,
            value: String(value),
          }))}
        />
      </div>
      <VirtualDataGrid
        columns={[
          { key: "profile", header: "Profile" },
          { key: "status", header: "Status" },
          { key: "latency", header: "Latency budget" },
        ]}
        rows={data.profiles.map((profile) => ({
          profile: profile.key,
          status: profile.status,
          latency: `${profile.latencyBudgetMs} ms`,
        }))}
      />
      {data.savedLenses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Saved lenses
          </p>
          {data.savedLenses.slice(0, compact ? 2 : 4).map((lens) => (
            <div
              key={lens.id}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-950">{lens.name}</span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  {lens.lensKey}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{lens.query}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-[1.5rem] bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">Search operations</p>
        <div className="mt-3">{content}</div>
      </div>
    );
  }

  return (
    <WorkspacePanel
      title="Search operations"
      description="Search remains permission-safe and fast at large-school scale through explicit profile and latency budgets."
    >
      {content}
    </WorkspacePanel>
  );
}
