"use client";

import Link from "next/link";
import { useState } from "react";
import { VirtualDataGrid } from "@k12/ui";
import {
  approveIbStandardsPacket,
  assignIbStandardsReviewer,
  exportIbStandardsPacket,
  returnIbStandardsPacket,
  useIbStandardsExportPreview,
  useIbStandardsPacket,
  useIbStandardsPacketComparison,
} from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbDetailPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { IbPageNotFound } from "@/features/ib/layout/IbPageStates";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function StandardsPacketDetail({ packetId }: { packetId: string }) {
  const { data: packet, mutate } = useIbStandardsPacket(packetId);
  const { data: comparison } = useIbStandardsPacketComparison(packetId);
  const { data: preview } = useIbStandardsExportPreview(packetId);
  const [reviewerId, setReviewerId] = useState("");
  const [returnReason, setReturnReason] = useState("");

  if (!packet) {
    return <IbPageLoading title="Loading standards packet..." />;
  }

  if (!packet.id) {
    return <IbPageNotFound actionHref={IB_CANONICAL_ROUTES.standardsPractices} />;
  }

  return (
    <IbDetailPageShell
      title={`${packet.code} packet`}
      description="Packet detail keeps reviewer assignment, export history, and provenance in one canonical route."
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void exportIbStandardsPacket(packet.id).then(() => mutate())}
          >
            Export
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
            onClick={() => void approveIbStandardsPacket(packet.id).then(() => mutate())}
          >
            Approve
          </button>
        </div>
      }
      metrics={[
        {
          label: "Review state",
          value: packet.reviewState,
          detail: "Current packet workflow state",
          tone: packet.reviewState === "approved" ? "success" : "warm",
        },
        {
          label: "Evidence strength",
          value: packet.evidenceStrength,
          detail: "Backend-computed packet signal",
          tone:
            packet.evidenceStrength === "strong"
              ? "success"
              : packet.evidenceStrength === "established"
                ? "accent"
                : "warm",
        },
        {
          label: "Completeness",
          value: `${packet.scoreSummary?.completenessScore ?? 0}%`,
          detail: `${packet.scoreSummary?.reviewedItemCount ?? 0}/${packet.scoreSummary?.totalItemCount ?? 0} items reviewed`,
          tone: "accent",
        },
        {
          label: "Exports",
          value: String(packet.exportHistory?.length ?? 0),
          detail: "Immutable artifact runs",
        },
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <WorkspacePanel
            title="Evidence provenance"
            description="Every packet item keeps a live source route so reviewers can verify context before approval."
          >
            <VirtualDataGrid
              columns={[
                { key: "summary", header: "Evidence" },
                { key: "reviewState", header: "Review state" },
                {
                  key: "provenanceHref",
                  header: "Source route",
                  render: (row) =>
                    row.provenanceHref ? (
                      <Link
                        href={row.provenanceHref}
                        className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                      >
                        Open source
                      </Link>
                    ) : (
                      <span className="text-slate-400">Unavailable</span>
                    ),
                },
              ]}
              rows={packet.items}
            />
          </WorkspacePanel>

          <WorkspacePanel
            title="Export preview"
            description="This preview shows what will be frozen into the export artifact."
          >
            <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(preview?.preview || {}, null, 2)}
            </pre>
          </WorkspacePanel>
        </div>

        <div className="space-y-5">
          <WorkspacePanel
            title="Reviewer assignment"
            description="Assign a reviewer explicitly before the packet moves forward."
          >
            <div className="space-y-3">
              <input
                className="block w-full rounded-2xl border border-slate-200 px-3 py-2"
                placeholder="Reviewer user id"
                value={reviewerId}
                onChange={(event) => setReviewerId(event.target.value)}
              />
              <button
                type="button"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
                onClick={() =>
                  void assignIbStandardsReviewer(packet.id, reviewerId).then(() => mutate())
                }
              >
                Assign reviewer
              </button>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Return or compare"
            description="Use return reasons and previous-cycle context instead of vague verbal feedback."
          >
            <textarea
              className="block min-h-28 w-full rounded-2xl border border-slate-200 px-3 py-2"
              placeholder="Return reason"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
            />
            <button
              type="button"
              className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
              onClick={() =>
                void returnIbStandardsPacket(packet.id, returnReason).then(() => mutate())
              }
            >
              Return with comments
            </button>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Previous cycle</p>
              <p className="mt-2">
                {(comparison?.previous_packet as { title?: string } | undefined)?.title ||
                  "No previous cycle packet available."}
              </p>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Export history"
            description="Immutable artifact runs are visible here for audit and comparison."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              {(packet.exportHistory || []).map((exportRow) => (
                <li
                  key={exportRow.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-slate-900">{exportRow.status}</p>
                  {exportRow.artifactUrl ? (
                    <Link
                      href={exportRow.artifactUrl}
                      className="mt-1 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
                    >
                      Download artifact
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </WorkspacePanel>
        </div>
      </div>
    </IbDetailPageShell>
  );
}
