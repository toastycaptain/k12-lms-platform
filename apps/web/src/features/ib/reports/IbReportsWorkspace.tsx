"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, SegmentedControl } from "@k12/ui";
import { createIbReport, updateIbReport, useIbReports } from "@/features/ib/data";
import { IbAiAssistPanel, type IbAiTaskOption } from "@/features/ib/ai/IbAiAssistPanel";
import { useIbReportingOps } from "@/features/ib/phase9/data";
import { ReportingOperationsPanel } from "@/features/ib/phase9/Phase9Panels";
import { ExceptionReportShell } from "@/features/ib/reports/ExceptionReportShell";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const REPORT_OPTIONS = [
  { value: "conference_packet", label: "Conference" },
  { value: "pyp_narrative", label: "PYP" },
  { value: "myp_snapshot", label: "MYP" },
  { value: "dp_progress", label: "DP" },
] as const;

const AUDIENCE_OPTIONS = [
  { value: "internal", label: "Professional" },
  { value: "guardian", label: "Guardian" },
  { value: "student", label: "Student" },
] as const;

function stringValue(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return fallback;
}

export function IbReportsWorkspace() {
  const [reportFamily, setReportFamily] =
    useState<(typeof REPORT_OPTIONS)[number]["value"]>("conference_packet");
  const [audience, setAudience] = useState<(typeof AUDIENCE_OPTIONS)[number]["value"]>("internal");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<
    "generate" | "sign_off" | "release" | "deliver" | null
  >(null);
  const { data: reports, mutate } = useIbReports({ report_family: reportFamily, audience });
  const { data: ops } = useIbReportingOps();

  const selectedReport = useMemo(
    () => (reports || []).find((report) => report.id === selectedId) || reports?.[0] || null,
    [reports, selectedId],
  );
  const currentSections = useMemo(
    () =>
      Array.isArray(selectedReport?.currentVersion?.contentPayload.sections)
        ? (selectedReport.currentVersion.contentPayload.sections as Array<Record<string, unknown>>)
        : [],
    [selectedReport],
  );

  async function generateReport() {
    setBusyAction("generate");
    try {
      await createIbReport({ report_family: reportFamily, audience });
      await mutate();
    } finally {
      setBusyAction(null);
    }
  }

  async function transitionReport(action: "sign_off" | "release" | "deliver") {
    if (!selectedReport) return;
    setBusyAction(action);
    try {
      await updateIbReport(selectedReport.id, {
        action,
        channel: action === "deliver" ? "web" : undefined,
        audience_role: audience,
      });
      await mutate();
    } finally {
      setBusyAction(null);
    }
  }

  const preflightWarnings = Array.isArray(selectedReport?.proofingSummary.preflight_warnings)
    ? selectedReport?.proofingSummary.preflight_warnings.map(String)
    : [];
  const localizationLocales = Array.isArray(selectedReport?.localization.available_locales)
    ? selectedReport.localization.available_locales.map(String)
    : [];
  const openRate = Number(selectedReport?.analytics.open_rate || 0);
  const currentRenderPayload = (selectedReport?.currentVersion?.renderPayload || {}) as Record<
    string,
    unknown
  >;
  const webViewer = (currentRenderPayload.web_viewer || {}) as Record<string, unknown>;
  const artifactBundle = (currentRenderPayload.artifact_bundle || {}) as Record<string, unknown>;
  const reportAiTasks = useMemo<IbAiTaskOption[]>(
    () =>
      selectedReport
        ? [
            {
              taskType: "ib_report_summary",
              label: "Summary draft",
              description: "Generate a grounded summary suggestion for the current audience.",
              mode: "diff",
              promptSeed:
                "Keep the summary grounded in the evidence and avoid unsupported performance claims.",
              targetFields: [
                {
                  field: "summary",
                  label: "Report summary",
                  currentValue: selectedReport.summary || "",
                },
              ],
              applyTarget: { type: "IbReport", id: selectedReport.id },
              context: {
                workflow: "reporting",
                audience,
                report_title: selectedReport.title,
                report_summary: selectedReport.summary || "",
                source_text: currentSections
                  .map((section) => String(section.body || section.summary || ""))
                  .join("\n"),
                grounding_refs: currentSections.slice(0, 4).map((section, index) => ({
                  type: "report_section",
                  label: String(section.title || `Section ${index + 1}`),
                  excerpt: String(section.body || section.summary || ""),
                })),
                target_fields: [{ field: "summary", label: "Report summary" }],
                current_values: { summary: selectedReport.summary || "" },
              },
              onApply: async (changes) => {
                await updateIbReport(selectedReport.id, { summary: changes.summary });
                await mutate();
              },
            },
            {
              taskType: "ib_evidence_gap",
              label: "Evidence gap",
              description: "Flag unsupported claims or thin evidence before sign-off.",
              mode: "analysis",
              promptSeed: "Look for missing evidence or claims that need clearer support.",
              context: {
                workflow: "reporting",
                audience,
                report_title: selectedReport.title,
                report_summary: selectedReport.summary || "",
                source_text: currentSections
                  .map((section) => String(section.body || section.summary || ""))
                  .join("\n"),
                grounding_refs: currentSections.slice(0, 4).map((section, index) => ({
                  type: "report_section",
                  label: String(section.title || `Section ${index + 1}`),
                  excerpt: String(section.body || section.summary || ""),
                })),
              },
            },
            {
              taskType: "ib_proofing",
              label: "Proofing",
              description: "Review clarity, tone, and missing context before release.",
              mode: "analysis",
              promptSeed:
                "Prioritize tone, clarity, and missing-context issues that matter before release.",
              context: {
                workflow: "reporting",
                audience,
                report_title: selectedReport.title,
                report_summary: selectedReport.summary || "",
                source_text: currentSections
                  .map((section) => String(section.body || section.summary || ""))
                  .join("\n"),
                grounding_refs: currentSections.slice(0, 4).map((section, index) => ({
                  type: "report_section",
                  label: String(section.title || `Section ${index + 1}`),
                  excerpt: String(section.body || section.summary || ""),
                })),
              },
            },
          ]
        : [],
    [audience, currentSections, mutate, selectedReport],
  );

  if (!reports) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title="IB reports"
      description="Draft, proof, release, archive, and deliver IB reports from one canonical reporting contract."
      filters={
        <>
          <SegmentedControl
            label="Family"
            value={reportFamily}
            onChange={(value) => setReportFamily(value as (typeof REPORT_OPTIONS)[number]["value"])}
            options={REPORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          />
          <SegmentedControl
            label="Audience"
            value={audience}
            onChange={(value) => setAudience(value as (typeof AUDIENCE_OPTIONS)[number]["value"])}
            options={AUDIENCE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generateReport()} disabled={busyAction !== null}>
            {busyAction === "generate" ? "Generating..." : "Generate report"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void transitionReport("sign_off")}
            disabled={!selectedReport || busyAction !== null}
          >
            {busyAction === "sign_off" ? "Signing off..." : "Sign off"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void transitionReport("release")}
            disabled={!selectedReport || busyAction !== null}
          >
            {busyAction === "release" ? "Releasing..." : "Release"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void transitionReport("deliver")}
            disabled={!selectedReport || busyAction !== null}
          >
            {busyAction === "deliver" ? "Delivering..." : "Deliver to web"}
          </Button>
        </div>
      }
      metrics={[
        {
          label: "Available reports",
          value: String(reports.length),
          detail: "Current family + audience filter",
          tone: reports.length > 0 ? "success" : "warm",
        },
        {
          label: "Current status",
          value: selectedReport?.status?.toUpperCase() || "DRAFT",
          detail: stringValue(selectedReport?.releaseWorkflow.status, "Selected workflow state"),
          tone: selectedReport?.status === "released" ? "success" : "accent",
        },
        {
          label: "Locales",
          value: String(localizationLocales.length || 0),
          detail: localizationLocales.join(", ") || "No family locales configured",
          tone: localizationLocales.length > 1 ? "success" : "warm",
        },
        {
          label: "Open rate",
          value: `${openRate.toFixed(1)}%`,
          detail: `${String(selectedReport?.analytics.read_count || 0)} read of ${String(selectedReport?.analytics.delivered_count || 0)} delivered`,
          tone: openRate >= 50 ? "success" : "warm",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Generated reports"
            description="Select a generated report or create one from current live evidence, stories, and milestones."
          >
            {reports.length === 0 ? (
              <EmptyState
                title="No reports generated yet"
                description="Generate the first report for this family and audience to review live content."
              />
            ) : (
              <div className="grid gap-3 xl:grid-cols-[minmax(18rem,0.55fr)_minmax(0,1fr)]">
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedId(report.id)}
                      className={`w-full rounded-[1.25rem] border px-4 py-3 text-left ${
                        selectedReport?.id === report.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-950"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{report.title}</p>
                          <p className="mt-1 text-xs opacity-75">
                            {report.reportFamily.replace(/_/g, " ")} • {report.audience}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
                          {report.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {selectedReport?.title || "Report preview"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedReport?.summary || "Select a report to inspect its current render."}
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-950">Proofing</span>
                      <p className="mt-2">
                        Missing sections:{" "}
                        {String(selectedReport?.proofingSummary.missing_sections || 0)}
                      </p>
                      <p>
                        Overlong items:{" "}
                        {String(selectedReport?.proofingSummary.overlong_items || 0)}
                      </p>
                      <p>
                        Translation review:{" "}
                        {stringValue(selectedReport?.proofingSummary.translation_review_required)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-950">Artifacts</span>
                      <p className="mt-2">Web view: {stringValue(webViewer.route)}</p>
                      <p>PDF: {stringValue(artifactBundle.pdf_url)}</p>
                      <p>Archive key: {stringValue(selectedReport?.archiveEntry.archive_key)}</p>
                    </div>
                  </div>
                  {preflightWarnings.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      <p className="font-semibold">Pre-release warnings</p>
                      <ul className="mt-2 space-y-1">
                        {preflightWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {reportAiTasks.length > 0 ? (
                    <IbAiAssistPanel
                      title="AI review assist"
                      description="Suggestions remain grounded, review-first, and blocked from sign-off or release decisions."
                      taskOptions={reportAiTasks}
                      compact
                    />
                  ) : null}
                  <div className="space-y-3">
                    {currentSections.length > 0 ? (
                      currentSections.map((section, index) => (
                        <div
                          key={`${String(section.title)}-${index}`}
                          className="rounded-2xl bg-slate-50 p-4"
                        >
                          <p className="text-sm font-semibold text-slate-950">
                            {String(section.title || "Section")}
                          </p>
                          <ul className="mt-2 space-y-2 text-sm text-slate-600">
                            {Array.isArray(section.items) && section.items.length > 0 ? (
                              (section.items as Array<Record<string, unknown>>).map(
                                (item, itemIndex) => (
                                  <li key={`${String(item.title)}-${itemIndex}`}>
                                    <span className="font-medium text-slate-900">
                                      {String(item.title || "Item")}
                                    </span>
                                    : {String(item.detail || "")}
                                  </li>
                                ),
                              )
                            ) : (
                              <li>No items in this section.</li>
                            )}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No rendered sections"
                        description="Generate a report to populate the shared template engine output."
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </WorkspacePanel>

          <WorkspacePanel
            title="Delivery log"
            description="Guardians, students, and conference packets share one delivery trail with artifacts and acknowledgement history."
          >
            {selectedReport?.deliveries.length ? (
              <ul className="space-y-2 text-sm text-slate-600">
                {selectedReport.deliveries.map((delivery) => (
                  <li key={delivery.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-950">
                      {delivery.audienceRole} • {delivery.channel} • {delivery.status}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {delivery.artifactUrl || "Artifact pending"} • archive{" "}
                      {delivery.archiveKey || "n/a"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Feedback window: {delivery.feedbackWindow || "n/a"} • Acknowledged:{" "}
                      {stringValue(delivery.analytics.acknowledged)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No deliveries yet"
                description="Release and deliver a report to create read/acknowledgement state."
              />
            )}
          </WorkspacePanel>

          <div className="grid gap-5 xl:grid-cols-2">
            <WorkspacePanel
              title="Localization and archive"
              description="Translation fallback, family-language readiness, and archive retention stay explicit before release."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Localization contract</p>
                  <p className="mt-2">
                    Default locale: {stringValue(selectedReport?.localization.default_locale)}
                  </p>
                  <p>Available locales: {localizationLocales.join(", ") || "en"}</p>
                  <p>
                    Fallback locales:{" "}
                    {Array.isArray(selectedReport?.localization.fallback_locales)
                      ? selectedReport.localization.fallback_locales.map(String).join(", ")
                      : "None"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Archive contract</p>
                  <p className="mt-2">
                    Retained versions: {stringValue(selectedReport?.archiveEntry.retained_versions)}
                  </p>
                  <p>Artifacts: {stringValue(selectedReport?.archiveEntry.artifact_count)}</p>
                  <p>Storage: {stringValue(selectedReport?.archiveEntry.storage_backend)}</p>
                </div>
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Release workflow"
              description="Approval boundaries, family permissions, and conference-packet prompts remain visible."
            >
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Workflow gates</p>
                  <p className="mt-2">
                    Ready for release:{" "}
                    {stringValue(selectedReport?.releaseWorkflow.ready_for_release)}
                  </p>
                  <p>
                    Acknowledgements pending:{" "}
                    {stringValue(selectedReport?.releaseWorkflow.acknowledgements_pending)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Viewer permissions</p>
                  <p className="mt-2">
                    Guardian visible:{" "}
                    {stringValue(selectedReport?.viewerPermissions.guardian_visible)}
                  </p>
                  <p>
                    Student visible:{" "}
                    {stringValue(selectedReport?.viewerPermissions.student_visible)}
                  </p>
                  <p>
                    Archive visible:{" "}
                    {stringValue(selectedReport?.viewerPermissions.archive_visible)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Conference packet</p>
                  <p className="mt-2">
                    Family view: {stringValue(selectedReport?.conferencePacket.family_view_enabled)}
                  </p>
                  <p>
                    Student-led prompts:{" "}
                    {Array.isArray(selectedReport?.conferencePacket.student_led_prompts)
                      ? selectedReport.conferencePacket.student_led_prompts.length
                      : 0}
                  </p>
                </div>
              </div>
            </WorkspacePanel>
          </div>

          {ops ? (
            <WorkspacePanel
              title="Canonical reporting contract"
              description="Programme-specific outputs stay on one rendering, archive, localization, and release contract."
            >
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Contract</p>
                  <p className="mt-2">Version: {ops.canonicalContract.version}</p>
                  <p>Families: {ops.canonicalContract.families.join(", ")}</p>
                  <p>Render targets: {ops.canonicalContract.renderTargets.join(", ")}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Release gates</p>
                  <p className="mt-2">
                    Awaiting release: {stringValue(ops.releaseGates.awaiting_release)}
                  </p>
                  <p>Localization review: {stringValue(ops.releaseGates.localization_review)}</p>
                  <p>
                    Awaiting acknowledgement:{" "}
                    {stringValue(ops.releaseGates.awaiting_acknowledgement)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">Analytics</p>
                  <p className="mt-2">Delivered: {stringValue(ops.analyticsSummary.delivered)}</p>
                  <p>Read: {stringValue(ops.analyticsSummary.read)}</p>
                  <p>Open rate: {stringValue(ops.analyticsSummary.open_rate)}</p>
                </div>
              </div>
            </WorkspacePanel>
          ) : null}

          <ReportingOperationsPanel />
        </div>
      }
      aside={
        <div className="space-y-5">
          <ExceptionReportShell defaultReport="poi" />
          {ops ? (
            <WorkspacePanel
              title="Proofing queue and locales"
              description="Template contracts, proofing backlog, and translation requirements stay close to the render preview."
            >
              <div className="space-y-3 text-sm text-slate-700">
                {ops.proofingQueue.slice(0, 3).map((row) => (
                  <a
                    key={row.id}
                    href={row.href}
                    className="block rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <p className="font-semibold text-slate-950">{row.title}</p>
                    <p className="mt-1">
                      {row.status} • missing {row.missingSections} • overlong {row.overlongItems}
                    </p>
                  </a>
                ))}
                {ops.localizationPipeline.slice(0, 2).map((row) => (
                  <div key={row.templateId} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-950">{row.name}</p>
                    <p className="mt-1">
                      {row.audience} • {row.requiredLocales.join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          ) : null}
        </div>
      }
    />
  );
}
