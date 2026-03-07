"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@k12/ui";
import { updateIbReport } from "@/features/ib/data";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

interface ReleasedReportRow {
  id: number;
  title: string;
  summary?: string | null;
  reportFamily: string;
  programme: string;
  href: string;
  releasedAt?: string | null;
}

interface DeliveryReceiptRow {
  id: string;
  state: string;
  deliverableType: string;
  deliverableId: number;
  readAt?: string | null;
  acknowledgedAt?: string | null;
}

export function ReleasedReportsPanel({
  title,
  description,
  reports,
  receipts,
  emptyDescription,
  onRefresh,
}: {
  title: string;
  description: string;
  reports: ReleasedReportRow[];
  receipts: DeliveryReceiptRow[];
  emptyDescription: string;
  onRefresh?: () => Promise<unknown> | void;
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function transitionReport(reportId: number, action: "mark_read" | "acknowledge") {
    setBusyAction(`${action}:${reportId}`);
    try {
      await updateIbReport(reportId, { action });
      await Promise.resolve(onRefresh?.());
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <WorkspacePanel title={title} description={description}>
      <div className="space-y-3">
        {reports.length > 0 ? (
          reports.map((report) => {
            const receipt = receipts.find(
              (candidate) =>
                candidate.deliverableType === "IbReport" && candidate.deliverableId === report.id,
            );
            const readBusy = busyAction === `mark_read:${report.id}`;
            const acknowledgeBusy = busyAction === `acknowledge:${report.id}`;

            return (
              <div
                key={report.id}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{report.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {report.programme} • {report.reportFamily.replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {report.summary ||
                        "Open the released report for the current narrative and next steps."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      State: {receipt?.state || "delivered"} • Released{" "}
                      {report.releasedAt || "recently"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={report.href}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
                    >
                      Open
                    </Link>
                    {receipt?.state !== "read" && receipt?.state !== "acknowledged" ? (
                      <Button
                        variant="secondary"
                        onClick={() => void transitionReport(report.id, "mark_read")}
                        disabled={Boolean(busyAction)}
                      >
                        {readBusy ? "Saving..." : "Mark read"}
                      </Button>
                    ) : null}
                    {receipt?.state !== "acknowledged" ? (
                      <Button
                        variant="secondary"
                        onClick={() => void transitionReport(report.id, "acknowledge")}
                        disabled={Boolean(busyAction)}
                      >
                        {acknowledgeBusy ? "Saving..." : "Acknowledge"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
            {emptyDescription}
          </div>
        )}
      </div>
    </WorkspacePanel>
  );
}
