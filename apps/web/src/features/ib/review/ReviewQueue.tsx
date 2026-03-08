"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CommentThread, SegmentedControl, VirtualDataGrid } from "@k12/ui";
import { useIbReviewGovernance } from "@/features/ib/data";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { useChangedSinceLastSeen } from "@/features/ib/mobile/useLastSeen";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function ReviewQueue({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbReviewGovernance();
  const [lane, setLane] = useState<
    "approvals" | "moderation" | "returned" | "orphaned" | "sla_breaches"
  >("approvals");

  const rows = useMemo(() => payload?.queues?.[lane] || [], [lane, payload]);
  const { changedCount } = useChangedSinceLastSeen(`k12.ib.review.${lane}.last_seen`, rows);

  if (!payload) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Approval and review queue"
      description="Approvals, moderation, and comments live in one disciplined workflow instead of scattered admin pages."
      badges={
        <>
          <IbTonePill label="No dead-end approvals" tone="accent" />
          <IbTonePill label="Comment summaries" tone="success" />
        </>
      }
      filters={
        <SegmentedControl
          label="Lane"
          value={lane}
          onChange={(value) =>
            setLane(value as "approvals" | "moderation" | "returned" | "orphaned" | "sla_breaches")
          }
          options={[
            { value: "approvals", label: "Approvals" },
            { value: "moderation", label: "Moderation" },
            { value: "returned", label: "Returned" },
            { value: "orphaned", label: "Orphaned" },
            { value: "sla_breaches", label: "SLA risk" },
          ]}
        />
      }
      metrics={[
        {
          label: "Current lane",
          value: lane,
          detail: "Filter state stays obvious",
          tone: "accent",
        },
        {
          label: "Items",
          value: String(rows.length),
          detail: "Only actionable work remains visible",
          tone: "warm",
        },
        {
          label: "Approvals",
          value: String(payload?.summaryMetrics?.approvals || 0),
          detail: "Pending approval count",
          tone: "success",
        },
        {
          label: "SLA risks",
          value: String(payload?.summaryMetrics?.sla_breaches || 0),
          detail: "Needs coordinator intervention",
          tone: "risk",
        },
        {
          label: "Changed since last visit",
          value: String(changedCount),
          detail: "New queue items since the last review pass",
          tone: changedCount > 0 ? "warm" : "success",
        },
      ]}
      mobileSummary={`${rows.length} ${lane.replace(/_/g, " ")} item(s) are visible and ${payload?.summaryMetrics?.sla_breaches || 0} item(s) are near SLA breach.`}
      mobileActions={[
        {
          id: "open-first-review",
          label: "Open first item",
          href: rows[0]?.href || "/ib/review",
          detail: rows[0]?.detail || "Jump straight into the next approval.",
        },
        {
          id: "moderation-lane",
          label: "Moderation",
          href: "/ib/review",
          detail: "Review the current moderation lane.",
          onSelect: () => setLane("moderation"),
        },
        {
          id: "sla-risk",
          label: "SLA risk",
          href: "/ib/review",
          detail: "Focus only on review items nearing escalation.",
          onSelect: () => setLane("sla_breaches"),
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Queue"
            description="Every row deep-links into live work rather than trapping users in summary-only admin tables."
          >
            <VirtualDataGrid
              columns={[
                { key: "title", header: "Item" },
                { key: "detail", header: "Why it matters" },
                {
                  key: "href",
                  header: "Go next",
                  render: (row) => (
                    <Link
                      href={row.href}
                      className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  ),
                },
              ]}
              rows={rows.map((row) => ({ ...row }))}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Returned context"
          description="Returned and orphaned work stays visible without forcing coordinators into multiple dashboards."
        >
          <CommentThread
            comments={(payload?.queues?.returned || []).slice(0, 2).map((row, index) => ({
              id: row.id,
              author: index === 0 ? "Coordinator" : "Reviewer",
              body: row.detail,
              timestamp: "Recently",
            }))}
          />
        </WorkspacePanel>
      }
    />
  );

  return (
    <>
      <IbSurfaceState
        status={state}
        ready={ready}
        emptyTitle="Nothing is waiting in review"
        emptyDescription="The next approval, moderation, or comment item will surface here with a direct route."
      />
      <MobileTriageTray
        title="Review quick actions"
        description="On mobile, keep approval moments and moderation blockers visible and explicit."
        items={rows.map((row, index) => ({
          id: row.id,
          label: row.title,
          detail: row.detail,
          href: row.href,
          status: row.changedSinceLastSeen ? "pending" : index === 0 ? "saved" : "retry",
        }))}
      />
    </>
  );
}
