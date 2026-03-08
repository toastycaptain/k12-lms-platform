"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@k12/ui";

const RUNBOOKS = [
  {
    id: "publishing-queue",
    title: "Publishing queue",
    detail: "Replay failed family publishing jobs, verify story state, and confirm queue ordering.",
    docPath: "docs/ib/phase10/operational-reliability.md#publishing-queue",
  },
  {
    id: "standards-export",
    title: "Standards export",
    detail: "Inspect export snapshots, artifact storage, and requeue failed export jobs.",
    docPath: "docs/ib/phase10/operational-reliability.md#standards-export",
  },
  {
    id: "reporting-pipeline",
    title: "Reporting pipeline",
    detail: "Recover queued report deliveries and confirm guardian/student release artifacts.",
    docPath: "docs/ib/phase10/reporting-depth-and-release-confidence.md#delivery-and-archive",
  },
  {
    id: "migration-pipeline",
    title: "Migration pipeline",
    detail: "Resume import batches from the last checkpoint and verify rollback readiness.",
    docPath: "docs/ib/phase10/migration-confidence.md#resume-and-rollback",
  },
  {
    id: "analytics-backfill",
    title: "Analytics backfill",
    detail: "Queue benchmark and adoption analytics backfills after telemetry outages.",
    docPath: "docs/ib/phase10/operational-reliability.md#analytics-backfill",
  },
  {
    id: "observability",
    title: "Observability and alerting",
    detail: "Trace requests, inspect error budgets, and run the queue/storage chaos rehearsal.",
    docPath: "docs/ib/phase10/operational-reliability.md#observability",
  },
];

export default function AdminIbRunbooksPage() {
  const { user } = useAuth();
  const canAccess = user?.roles?.includes("admin") || false;

  return (
    <ProtectedRoute requiredRoles={["admin"]} unauthorizedRedirect="/dashboard">
      <AppShell>
        {!canAccess ? (
          <p className="text-sm text-slate-600">Access restricted to administrators.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">IB runbooks</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Use these anchors during failure recovery. Each card maps to the Phase 10
                operational documentation kept in the repository.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {RUNBOOKS.map((runbook) => (
                <Card key={runbook.id} id={runbook.id} className="scroll-mt-24">
                  <h2 className="text-lg font-semibold text-slate-950">{runbook.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{runbook.detail}</p>
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                    {runbook.docPath}
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/admin/health"
                      className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                    >
                      Open system health
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
