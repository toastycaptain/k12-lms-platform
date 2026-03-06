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
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function ProgrammeOperationsCenter({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbOperationsPayload();
  const [view, setView] = useState<"Whole school" | "PYP" | "MYP" | "DP">("Whole school");

  const visibleCards = useMemo(
    () =>
      (payload?.priorityExceptions || []).filter((card) =>
        view === "Whole school" ? true : card.programme === view,
      ),
    [payload?.priorityExceptions, view],
  );

  if (!payload) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Programme operations center"
      description="An exception-first view of programme health, incomplete work, approvals, publishing cadence, and team support needs."
      badges={
        <>
          <IbTonePill label="Exception-first" tone="accent" />
          <IbTonePill label="Deep links only" tone="success" />
        </>
      }
      filters={
        <SegmentedControl
          label="View"
          value={view}
          onChange={(value) => setView(value as "Whole school" | "PYP" | "MYP" | "DP")}
          options={[
            { value: "Whole school", label: "Whole school" },
            { value: "PYP", label: "PYP" },
            { value: "MYP", label: "MYP" },
            { value: "DP", label: "DP" },
          ]}
        />
      }
      metrics={payload.summaryMetrics}
      main={
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleCards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{card.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
                  </div>
                  <IbTonePill label={card.programme ?? "Mixed"} tone={card.tone} />
                </div>
              </Link>
            ))}
          </div>

          <WorkspacePanel
            title="Operational drilldown matrix"
            description="Cards summarize, but the matrix keeps route destinations and responsibility visible."
          >
            <VirtualDataGrid
              columns={[
                { key: "area", header: "Area" },
                { key: "signal", header: "Signal" },
                {
                  key: "destination",
                  header: "Destination",
                  render: (row) => (
                    <Link
                      href={row.destination}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      Open route
                    </Link>
                  ),
                },
              ]}
              rows={payload.drilldowns}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Role-specific default"
          description="The same shell serves PYP, MYP, DP, and whole-school leadership without becoming one giant table."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>PYP leads prioritize POI health and specialist coverage.</li>
            <li>MYP leads prioritize criteria balance and interdisciplinary follow-up.</li>
            <li>DP leads prioritize IA and core risk.</li>
          </ul>
        </WorkspacePanel>
      }
    />
  );

  return (
    <>
      <IbSurfaceState
        status={state}
        ready={ready}
        emptyTitle="Operations look healthy"
        emptyDescription="No current exception cards are surfacing for the selected programme view."
      />
      <MobileTriageTray
        title="Operations quick actions"
        description="On mobile, coordinators only get the highest-signal exceptions and their routes."
        items={visibleCards.slice(0, 3).map((card, index) => ({
          id: card.id,
          label: card.label,
          detail: card.detail,
          href: card.href,
          status: index === 0 ? "retry" : "saved",
        }))}
      />
    </>
  );
}
