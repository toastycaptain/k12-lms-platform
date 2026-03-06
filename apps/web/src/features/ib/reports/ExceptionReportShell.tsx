"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SegmentedControl, VirtualDataGrid } from "@k12/ui";
import { useIbOperationsPayload } from "@/features/ib/data";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const REPORT_LABELS = {
  poi: "POI balance",
  criteria: "MYP and review",
  evidence: "Evidence density",
  publishing: "Publishing cadence",
  dp: "DP risk",
} as const;

export function ExceptionReportShell({
  state = "ready",
  defaultReport = "poi",
}: {
  state?: IbSurfaceStatus;
  defaultReport?: keyof typeof REPORT_LABELS;
}) {
  const { data } = useIbOperationsPayload();
  const [report, setReport] = useState<keyof typeof REPORT_LABELS>(defaultReport);

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.priorityExceptions.filter((card) => {
      if (report === "poi") return card.programme === "PYP";
      if (report === "criteria") return card.programme === "MYP" || card.href.includes("/review");
      if (report === "evidence") return card.href.includes("/evidence");
      if (report === "publishing") return card.href.includes("/families");
      return card.programme === "DP";
    });
  }, [data, report]);

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Exception reports"
      description="IB reporting stays action-linked and exception-first so coordinators can move from insight to work without re-filtering."
      badges={
        <>
          <IbTonePill label="Action-linked" tone="accent" />
          <IbTonePill label="Smaller, higher-value report set" tone="success" />
        </>
      }
      filters={
        <SegmentedControl
          label="Report"
          value={report}
          onChange={(value) => setReport(value as keyof typeof REPORT_LABELS)}
          options={Object.entries(REPORT_LABELS).map(([value, label]) => ({ value, label }))}
        />
      }
      metrics={[
        {
          label: "Current report",
          value: REPORT_LABELS[report],
          detail: "The chosen question stays explicit",
          tone: "accent",
        },
        {
          label: "Findings",
          value: String(rows.length),
          detail: "Only exception rows are shown by default",
          tone: "warm",
        },
        {
          label: "Drilldowns",
          value: String(rows.length),
          detail: "Each finding opens live work",
          tone: "success",
        },
        {
          label: "Generated",
          value: new Date(data.generatedAt).toLocaleDateString(),
          detail: "Pulled from live operations aggregates",
        },
      ]}
      main={
        <WorkspacePanel
          title="Prioritized findings"
          description="Every finding explains why it matters and where to go next."
        >
          <VirtualDataGrid
            columns={[
              { key: "area", header: "Area" },
              { key: "finding", header: "Finding" },
              {
                key: "route",
                header: "Drilldown",
                render: (row) => (
                  <Link
                    href={row.route}
                    className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                  >
                    Open route
                  </Link>
                ),
              },
            ]}
            rows={rows.map((row) => ({
              area: row.programme || "Mixed",
              finding: row.detail,
              route: row.href,
            }))}
          />
        </WorkspacePanel>
      }
      aside={
        <WorkspacePanel
          title="Report discipline"
          description="Reports help a coordinator think, but they do not replace queue and workflow ownership."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Defaults stay opinionated toward current action.</li>
            <li>Charts are not required when a direct finding list is clearer.</li>
            <li>Filter context should survive the jump into live work.</li>
          </ul>
        </WorkspacePanel>
      }
    />
  );

  return (
    <IbSurfaceState
      status={state}
      ready={ready}
      emptyTitle="No exceptions in this report"
      emptyDescription="The selected report currently has no exception rows to escalate."
    />
  );
}
