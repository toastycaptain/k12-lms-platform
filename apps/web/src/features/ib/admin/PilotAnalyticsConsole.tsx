"use client";

import { useIbAnalytics } from "@/features/ib/admin/api";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

function MetricList({
  title,
  metrics,
}: {
  title: string;
  metrics: Record<string, number | string>;
}) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-600">{key.replace(/_/g, " ")}</span>
            <span className="font-semibold text-slate-950">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PilotAnalyticsConsole() {
  const { data } = useIbAnalytics();

  if (!data) {
    return (
      <WorkspacePanel
        title="Pilot analytics"
        description="Loading teacher friction, coordinator operations, and queue health metrics."
      >
        <p className="text-sm text-slate-600">Loading analytics…</p>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      title="Pilot analytics"
      description="Operational analytics for pilot review cadence, teacher friction, and queue health."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <MetricList title="Teacher friction" metrics={data.teacherFriction} />
        <MetricList title="Coordinator operations" metrics={data.coordinatorOperations} />
        <MetricList title="Latency and queue health" metrics={data.latencyAndQueueHealth} />
        <MetricList title="Pilot success scorecard" metrics={data.pilotSuccessScorecard} />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Generated {new Date(data.generatedAt).toLocaleString()} from the live IB pilot telemetry
        pipeline.
      </p>
    </WorkspacePanel>
  );
}
