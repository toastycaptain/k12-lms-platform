"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState, SegmentedControl } from "@k12/ui";
import { createIbReport, updateIbReport, useIbReports } from "@/features/ib/data";
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

export function IbReportsWorkspace() {
  const [reportFamily, setReportFamily] =
    useState<(typeof REPORT_OPTIONS)[number]["value"]>("conference_packet");
  const [audience, setAudience] = useState<(typeof AUDIENCE_OPTIONS)[number]["value"]>("internal");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState<
    "generate" | "sign_off" | "release" | "deliver" | null
  >(null);
  const { data: reports, mutate } = useIbReports({ report_family: reportFamily, audience });

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) || reports[0] || null,
    [reports, selectedId],
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

  if (!reports) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const currentSections = Array.isArray(selectedReport?.currentVersion?.contentPayload.sections)
    ? (selectedReport?.currentVersion?.contentPayload.sections as Array<Record<string, unknown>>)
    : [];

  return (
    <IbWorkspaceScaffold
      title="IB reports"
      description="Draft, review, release, and delivery state now live beside the exception-first reporting view."
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
          detail: "Selected report workflow state",
          tone: selectedReport?.status === "released" ? "success" : "accent",
        },
        {
          label: "Versions",
          value: String(selectedReport?.versions.length || 0),
          detail: "Version history kept with the report",
          tone: "accent",
        },
        {
          label: "Deliveries",
          value: String(selectedReport?.deliveries.length || 0),
          detail: "Release and receipt state",
          tone: "success",
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
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-950">Delivery</span>
                      <p className="mt-2">
                        Current deliveries: {selectedReport?.deliveries.length || 0}
                      </p>
                      <p>Released at: {selectedReport?.releasedAt || "Not yet released"}</p>
                    </div>
                  </div>
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
            description="Guardians, students, and conference packets share one delivery trail."
          >
            {selectedReport?.deliveries.length ? (
              <ul className="space-y-2 text-sm text-slate-600">
                {selectedReport.deliveries.map((delivery) => (
                  <li key={delivery.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {delivery.audienceRole} • {delivery.channel} • {delivery.status}
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
        </div>
      }
      aside={<ExceptionReportShell defaultReport="poi" />}
    />
  );
}
