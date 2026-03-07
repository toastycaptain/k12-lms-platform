"use client";

import { Button, useToast } from "@k12/ui";
import { replayIbJobOperation, useIbJobOperations } from "@/features/ib/admin/api";
import { reportIbAdminEvent } from "@/features/ib/admin/analytics";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function JobOperationsConsole() {
  const { addToast } = useToast();
  const { data, mutate } = useIbJobOperations();

  async function replay(operationType: string, id: number) {
    try {
      await replayIbJobOperation(operationType, id);
      reportIbAdminEvent("ib_job_replayed", { operationType, id });
      addToast("success", "Replay queued.");
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Replay failed.");
    }
  }

  if (!data) {
    return (
      <WorkspacePanel
        title="Job operations"
        description="Loading queue inventory, retry rules, and replay controls."
      >
        <p className="text-sm text-slate-600">Loading job operations…</p>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      title="Job operations"
      description="Queue topology, idempotency rules, and replay controls for failed pilot jobs."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-950">Inventory</h3>
          <div className="mt-3 space-y-3">
            {data.inventory.map((item) => (
              <div
                key={item.key}
                className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{item.key}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    {item.queue}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Retry: {item.retry}</p>
                <p className="mt-1 text-sm text-slate-600">{item.idempotencyRule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold text-slate-950">Replay queue</h3>
          <div className="mt-3 space-y-3">
            {data.failures.length === 0 ? (
              <p className="text-sm text-slate-600">
                No failed or blocked operations currently require replay.
              </p>
            ) : (
              data.failures.map((failure) => (
                <div
                  key={`${failure.operationType}:${failure.id}`}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{failure.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{failure.detail}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(failure.happenedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => void replay(failure.operationType, failure.id)}
                    >
                      Replay
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
}
