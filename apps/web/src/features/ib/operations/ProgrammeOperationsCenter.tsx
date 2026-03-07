"use client";

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
import { ExceptionStack } from "@/features/ib/operations/ExceptionStack";
import { ProgrammeHealthSummary } from "@/features/ib/operations/ProgrammeHealthSummary";
import { BottleneckPanel } from "@/features/ib/operations/BottleneckPanel";
import { RecommendationPanel } from "@/features/ib/operations/RecommendationPanel";
import { ShareViewDialog } from "@/features/ib/operations/ShareViewDialog";
import { PoiCoverageHeatmap } from "@/features/ib/pyp/PoiCoverageHeatmap";
import { PoiOverlapPanel } from "@/features/ib/pyp/PoiOverlapPanel";
import { CoverageBalanceDashboard } from "@/features/ib/myp/CoverageBalanceDashboard";
import { RiskSummaryPanel } from "@/features/ib/dp/RiskSummaryPanel";
import { ProgressionExplorer } from "@/features/ib/coordinator/ProgressionExplorer";
import { EvidenceGapPanel } from "@/features/ib/standards/EvidenceGapPanel";

export function ProgrammeOperationsCenter({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbOperationsPayload();
  const [view, setView] = useState<"Whole school" | "PYP" | "MYP" | "DP">("Whole school");
  const [shareOpen, setShareOpen] = useState(false);

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
    <>
      <IbWorkspaceScaffold
        title="Programme operations center"
        description="An exception-first coordinator workspace with fast drill-ins, aggregated risk signals, and clear decision support across PYP, MYP, and DP."
        badges={
          <>
            <IbTonePill label="Exception-first" tone="accent" />
            <IbTonePill label="Aggregation-backed" tone="success" />
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Share snapshot
          </button>
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
            <ProgrammeHealthSummary summary={payload.programmeHealthSummary} />
            <ExceptionStack items={visibleCards} />

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
                      <a
                        href={row.destination}
                        className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                      >
                        Open route
                      </a>
                    ),
                  },
                ]}
                rows={payload.drilldowns}
              />
            </WorkspacePanel>

            <div className="grid gap-5 xl:grid-cols-2">
              <PoiCoverageHeatmap rows={payload.pypIntelligence.coverageHeatmap} />
              <PoiOverlapPanel rows={payload.pypIntelligence.overlapRows} />
            </div>

            <CoverageBalanceDashboard
              balances={{
                concept_balance: payload.mypIntelligence.conceptBalance,
                context_balance: payload.mypIntelligence.contextBalance,
                atl_balance: payload.mypIntelligence.atlBalance,
                criteria_balance: payload.mypIntelligence.criteriaBalance,
              }}
            />

            <div className="grid gap-5 xl:grid-cols-2">
              <RiskSummaryPanel rows={payload.dpRiskSummary} />
              <ProgressionExplorer rows={payload.continuumExplorer} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <BottleneckPanel stuckReasons={payload.bottlenecks.stuckReasons} />
              <RecommendationPanel recommendations={payload.recommendations} />
            </div>

            <EvidenceGapPanel rows={payload.standardsInsights} />
          </div>
        }
        aside={
          <div className="space-y-5">
            <WorkspacePanel
              title="Data mart snapshot"
              description="Coordinator intelligence should be trustworthy and fast because it is aggregated before render."
            >
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-950">Documents</p>
                  <p className="mt-1">{JSON.stringify(payload.dataMart.documents)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-950">Evidence</p>
                  <p className="mt-1">{JSON.stringify(payload.dataMart.evidence)}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-950">Publishing</p>
                  <p className="mt-1">{JSON.stringify(payload.dataMart.publishing)}</p>
                </div>
              </div>
            </WorkspacePanel>
            <WorkspacePanel
              title="SLA watch"
              description="Track queues that are at risk before they become programme-level escalations."
            >
              <div className="space-y-2">
                {payload.bottlenecks.slaRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-950">{row.label}</p>
                    <p className="mt-1">
                      {row.atRisk} at risk • threshold {row.thresholdDays} days
                    </p>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
            <WorkspacePanel
              title="Shareable view"
              description="Leadership summaries can be shared without exposing the entire coordinator console."
            >
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">Snapshot token</p>
                <p className="mt-1 break-all">
                  {payload.shareableView.shareToken || "Not generated"}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  Expires {payload.shareableView.expiresAt || "pending"}
                </p>
              </div>
            </WorkspacePanel>
          </div>
        }
      />
      <ShareViewDialog
        open={shareOpen}
        token={payload.shareableView.shareToken}
        onClose={() => setShareOpen(false)}
      />
    </>
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
