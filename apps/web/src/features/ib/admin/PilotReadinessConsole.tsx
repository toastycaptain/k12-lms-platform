"use client";

import { useMemo, useState } from "react";
import { Button, EmptyState } from "@k12/ui";
import { validateIbPilotSetup } from "@/features/ib/admin/api";
import { OperationalChecklistPanel } from "@/features/curriculum/support/OperationalChecklistPanel";
import { useIbPilotReadiness } from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbCoordinatorPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";

const STATUS_TONE = {
  green: "success",
  yellow: "warm",
  red: "risk",
} as const;

const SECTION_OWNER: Record<string, string> = {
  pack_and_flags: "support",
  pilot_setup: "school_admin",
  programme_settings: "coordinator",
  route_readiness: "support",
  document_migration: "support",
  review_governance: "coordinator",
  standards_and_exports: "coordinator",
  publishing_reliability: "teacher",
  telemetry_signals: "support",
  analytics_and_scorecard: "support",
};

export function PilotReadinessConsole() {
  const { data, mutate } = useIbPilotReadiness();
  const [severityFilter, setSeverityFilter] = useState<"all" | "blocker" | "warning" | "info">(
    "all",
  );
  const [ownerFilter, setOwnerFilter] = useState<"all" | string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const filteredSections = useMemo(
    () =>
      (data?.sections || []).filter((section) => {
        const matchesOwner = ownerFilter === "all" || SECTION_OWNER[section.key] === ownerFilter;
        const matchesSeverity =
          severityFilter === "all" ||
          section.rules.some((rule) => rule.severity === severityFilter && rule.status === "fail");
        return matchesOwner && matchesSeverity;
      }),
    [data?.sections, ownerFilter, severityFilter],
  );

  if (!data) {
    return <IbPageLoading title="Loading pilot readiness..." />;
  }

  const stale = Date.now() - new Date(data.generatedAt).getTime() > data.staleAfterSeconds * 1000;

  async function refreshReadiness() {
    setRefreshing(true);
    try {
      await validateIbPilotSetup("Mixed");
      await mutate();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <IbCoordinatorPageShell
      title="Pilot readiness"
      description="One place to decide whether the current school is ready for IB pilot traffic, and what still needs remediation."
      actions={
        <Button variant="secondary" onClick={() => void refreshReadiness()} disabled={refreshing}>
          {refreshing ? "Refreshing..." : "Refresh readiness"}
        </Button>
      }
      filters={
        <>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Severity</span>
            <select
              aria-label="Severity filter"
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value as "all" | "blocker" | "warning" | "info")
              }
              className="rounded-full border border-slate-300 bg-white px-4 py-2"
            >
              <option value="all">All severities</option>
              <option value="blocker">Blockers</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Owner</span>
            <select
              aria-label="Owner filter"
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2"
            >
              <option value="all">All owners</option>
              <option value="support">Support</option>
              <option value="school_admin">School admin</option>
              <option value="coordinator">Coordinator</option>
              <option value="teacher">Teacher</option>
            </select>
          </label>
        </>
      }
      metrics={[
        {
          label: "Overall",
          value: data.overallStatus.toUpperCase(),
          detail: "Explainable readiness state",
          tone: STATUS_TONE[data.overallStatus],
        },
        {
          label: "Green sections",
          value: String(data.sections.filter((section) => section.status === "green").length),
          detail: "Ready without intervention",
          tone: "success",
        },
        {
          label: "Watch sections",
          value: String(data.sections.filter((section) => section.status === "yellow").length),
          detail: "Need follow-up before pilot grows",
          tone: "warm",
        },
        {
          label: "Blocked sections",
          value: String(data.sections.filter((section) => section.status === "red").length),
          detail: "Should stop launch",
          tone: "risk",
        },
        {
          label: "Freshness",
          value: stale ? "STALE" : "CURRENT",
          detail: `Checked ${new Date(data.generatedAt).toLocaleTimeString()}`,
          tone: stale ? "warm" : "success",
        },
      ]}
    >
      {stale ? (
        <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This readiness snapshot is older than {Math.round(data.staleAfterSeconds / 60)} minutes.
          Refresh before using it as a release or launch decision.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredSections.length === 0 ? (
          <EmptyState
            title="No readiness sections match the current filters"
            description="Clear the severity or owner filter to review the full pilot checklist."
          />
        ) : null}

        {filteredSections.map((section) => (
          <OperationalChecklistPanel
            key={section.key}
            title={section.title}
            summary={section.summary}
            owner={SECTION_OWNER[section.key] || "support"}
            status={section.status}
            issues={section.issues}
            rules={section.rules}
            severityFilter={severityFilter}
            fixHref={
              section.key === "programme_settings"
                ? IB_CANONICAL_ROUTES.settings
                : section.key === "route_readiness"
                  ? IB_CANONICAL_ROUTES.rollout
                  : IB_CANONICAL_ROUTES.operations
            }
          />
        ))}
      </div>
    </IbCoordinatorPageShell>
  );
}
