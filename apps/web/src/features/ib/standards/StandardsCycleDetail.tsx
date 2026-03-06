"use client";

import Link from "next/link";
import { VirtualDataGrid } from "@k12/ui";
import { useIbStandardsCycle } from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbDetailPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { IbPageNotFound } from "@/features/ib/layout/IbPageStates";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function StandardsCycleDetail({ cycleId }: { cycleId: string }) {
  const { data: cycle } = useIbStandardsCycle(cycleId);

  if (!cycle) {
    return <IbPageLoading title="Loading standards cycle..." />;
  }

  if (!cycle.id) {
    return <IbPageNotFound actionHref={IB_CANONICAL_ROUTES.standardsPractices} />;
  }

  return (
    <IbDetailPageShell
      title={cycle.title}
      description="Cycle detail keeps packet review, export readiness, and progression in one place."
      metrics={[
        {
          label: "Status",
          value: cycle.status,
          detail: "Current cycle state",
          tone: cycle.status === "exported" ? "success" : "accent",
        },
        {
          label: "Packets",
          value: String(cycle.packets.length),
          detail: "Live packet scope",
          tone: "accent",
        },
        {
          label: "Exports",
          value: String(cycle.exportCount ?? 0),
          detail: "Historical export runs",
          tone: "success",
        },
        {
          label: "Approved",
          value: String(cycle.packets.filter((packet) => packet.reviewState === "approved").length),
          detail: "Ready packet count",
          tone: "success",
        },
      ]}
    >
      <WorkspacePanel
        title="Cycle packet matrix"
        description="Each packet is a first-class route with its own reviewer, score, and export history."
      >
        <VirtualDataGrid
          columns={[
            { key: "title", header: "Packet" },
            { key: "reviewState", header: "Review state" },
            { key: "evidenceStrength", header: "Strength" },
            {
              key: "href",
              header: "Open",
              render: (row) => (
                <Link
                  href={row.href}
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  Open packet
                </Link>
              ),
            },
          ]}
          rows={cycle.packets.map((packet) => ({
            title: `${packet.code} • ${packet.title}`,
            reviewState: packet.reviewState,
            evidenceStrength: packet.evidenceStrength,
            href: packet.href || IB_CANONICAL_ROUTES.standardsPacket(packet.id),
          }))}
        />
      </WorkspacePanel>
    </IbDetailPageShell>
  );
}
