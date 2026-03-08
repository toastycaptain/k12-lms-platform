"use client";

import Link from "next/link";
import { Button, useToast } from "@k12/ui";
import {
  backfillIbJobOperations,
  cancelIbJobOperation,
  replayIbJobOperation,
  useIbJobOperations,
  useIbOperationalReliability,
} from "@/features/ib/admin/api";
import { reportIbAdminEvent } from "@/features/ib/admin/analytics";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

function QueueStatusPill({ status }: { status: string }) {
  const classes =
    status === "healthy"
      ? "bg-emerald-100 text-emerald-900"
      : status === "warning"
        ? "bg-amber-100 text-amber-900"
        : "bg-rose-100 text-rose-900";
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${classes}`}>
      {status}
    </span>
  );
}

export function JobOperationsConsole() {
  const { addToast } = useToast();
  const { data, mutate } = useIbJobOperations();
  const { data: reliability } = useIbOperationalReliability();

  async function replay(operationType: string, id: number) {
    try {
      await replayIbJobOperation(operationType, id);
      reportIbAdminEvent("ib_job_replayed", { operationType, id });
      addToast("success", "Recovery action queued.");
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Replay failed.");
    }
  }

  async function cancel(jobId: number) {
    try {
      await cancelIbJobOperation(jobId, "Cancelled from rollout console.");
      reportIbAdminEvent("ib_job_cancelled", { jobId });
      addToast("success", "Cancellation recorded.");
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Cancel failed.");
    }
  }

  async function backfillAnalytics() {
    try {
      await backfillIbJobOperations("analytics");
      reportIbAdminEvent("ib_job_backfill_requested", { kind: "analytics" });
      addToast("success", "Analytics backfill queued.");
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Backfill failed.");
    }
  }

  if (!data) {
    return (
      <WorkspacePanel
        title="Job operations"
        description="Loading queue inventory, retry rules, and recovery controls."
      >
        <p className="text-sm text-slate-600">Loading job operations…</p>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      title="Job operations"
      description="Operational queue health, dead-letter recovery, and runbook-guided actions for IB background work."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            ["Queued", data.attentionSummary.queued],
            ["Running", data.attentionSummary.running],
            ["Failed", data.attentionSummary.failed],
            ["Dead letter", data.attentionSummary.deadLetter],
            ["Recovered", data.attentionSummary.recovered],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Queue health</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Depth and latency stay explicit before teachers feel them.
                </p>
              </div>
              <Button variant="secondary" onClick={() => void backfillAnalytics()}>
                Backfill analytics
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {data.queueHealth.map((queue) => (
                <div
                  key={queue.queue}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{queue.queue}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {queue.operations.join(", ")} • depth {queue.depth} • latency{" "}
                        {queue.latencySeconds}s
                      </p>
                      {queue.error ? (
                        <p className="mt-2 text-xs text-rose-700">{queue.error}</p>
                      ) : null}
                    </div>
                    <QueueStatusPill status={queue.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-950">Catalog</h3>
            <div className="mt-4 space-y-3">
              {data.inventory.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.key}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Queue {item.queue} • retry {item.retry} • timeout {item.timeoutSeconds || 0}
                        s
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{item.idempotencyRule}</p>
                    </div>
                    {item.runbookUrl ? (
                      <Link
                        href={item.runbookUrl}
                        className="text-xs font-semibold text-slate-700 underline underline-offset-4"
                      >
                        Runbook
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold text-slate-950">Recovery queue</h3>
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
                      <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-slate-950">{failure.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{failure.detail}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{new Date(failure.happenedAt).toLocaleString()}</span>
                          {failure.queue ? <span>Queue {failure.queue}</span> : null}
                          {failure.correlationId ? (
                            <span>Trace {failure.correlationId}</span>
                          ) : null}
                          {failure.runbookUrl ? (
                            <Link
                              href={failure.runbookUrl}
                              className="font-semibold text-slate-700 underline underline-offset-4"
                            >
                              Open runbook
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => void replay(failure.operationType, failure.id)}
                        >
                          Replay
                        </Button>
                        {failure.queue ? (
                          <Button variant="secondary" onClick={() => void cancel(failure.id)}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-950">Recent recovery timeline</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-600">
                {data.recentEvents.length ? (
                  data.recentEvents.map((event) => (
                    <li key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="font-semibold text-slate-950">
                        {event.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="mt-1">{event.message}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Job #{event.jobId} • {new Date(event.occurredAt).toLocaleString()}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl bg-slate-50 px-4 py-3">
                    Recovery events will appear here after retries, replays, or cancellations.
                  </li>
                )}
              </ul>
            </div>

            {reliability ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">Reliability posture</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {reliability.sloSummary.map((item) => (
                    <li key={item.key} className="rounded-2xl bg-white px-4 py-3">
                      <span className="font-semibold text-slate-950">{item.label}</span>:{" "}
                      {item.currentValue} against {item.objective}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Trace strategy: {reliability.traceSummary.strategy}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WorkspacePanel>
  );
}
