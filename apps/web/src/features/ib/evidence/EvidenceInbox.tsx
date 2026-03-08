"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar, VirtualDataGrid } from "@k12/ui";
import {
  batchApplyEvidenceAction,
  useIbEvidenceItems,
  useIbLearningStories,
  useIbReflectionRequests,
} from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import {
  BatchEvidenceActions,
  type EvidenceBatchAction,
} from "@/features/ib/evidence/BatchEvidenceActions";
import { MobileEvidenceCaptureSheet } from "@/features/ib/evidence/MobileEvidenceCaptureSheet";
import { MobileReflectionReviewSheet } from "@/features/ib/evidence/MobileReflectionReviewSheet";
import { EvidenceReviewDrawer } from "@/features/ib/evidence/EvidenceReviewDrawer";
import { EvidenceToStoryComposer } from "@/features/ib/evidence/EvidenceToStoryComposer";
import { MobileEvidenceTriage } from "@/features/ib/evidence/MobileEvidenceTriage";
import { useChangedSinceLastSeen } from "@/features/ib/mobile/useLastSeen";
import { useIbMutationQueue } from "@/features/ib/offline/useIbMutationQueue";
import { ConflictResolutionDialog } from "@/features/ib/offline/ConflictResolutionDialog";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function EvidenceInbox({
  state = "ready",
  initialActiveItemId = null,
}: {
  state?: IbSurfaceStatus;
  initialActiveItemId?: string | null;
}) {
  const { data, mutate } = useIbEvidenceItems();
  const [programme, setProgramme] = useState<"all" | "PYP" | "MYP" | "DP">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(initialActiveItemId);
  const [lastAction, setLastAction] = useState<EvidenceBatchAction | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const items = useMemo(() => data || [], [data]);
  const { data: reflectionRequests = [], mutate: mutateReflectionRequests } =
    useIbReflectionRequests({
      status: "requested",
    });
  const { data: storyOptions = [] } = useIbLearningStories();
  const mutationQueue = useIbMutationQueue();

  const visibleItems = useMemo(
    () => items.filter((item) => (programme === "all" ? true : item.programme === programme)),
    [items, programme],
  );
  const mobileStoryOptions = useMemo(
    () =>
      storyOptions
        .map((story) => ({ id: Number.parseInt(String(story.id), 10), title: story.title }))
        .filter((story) => Number.isFinite(story.id))
        .slice(0, 5),
    [storyOptions],
  );
  const { changedCount } = useChangedSinceLastSeen("k12.ib.evidence.last_seen", visibleItems);

  const resolvedActiveItemId = activeItemId || items[0]?.id || null;
  const activeItem = items.find((item) => item.id === resolvedActiveItemId) ?? null;
  const drawerItem = activeItemId ? (items.find((item) => item.id === activeItemId) ?? null) : null;

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Evidence inbox"
      description="Operational evidence triage stays separate from the polished portfolio showcase."
      badges={
        <>
          <IbTonePill label="Batch triage" tone="accent" />
          <IbTonePill label="Progressive tagging" tone="success" />
        </>
      }
      metrics={[
        {
          label: "In queue",
          value: String(visibleItems.length),
          detail: "Visible with status and next action",
          tone: "accent",
        },
        {
          label: "Needs validation",
          value: String(visibleItems.filter((item) => item.status.includes("validation")).length),
          detail: "Fast teacher decisions are surfaced first",
          tone: "warm",
        },
        {
          label: "Story-linked",
          value: String(visibleItems.filter((item) => item.status.includes("story")).length),
          detail: "Already routed toward family communication",
          tone: "success",
        },
        {
          label: "Warnings",
          value: String(visibleItems.reduce((sum, item) => sum + item.warnings.length, 0)),
          detail: "Missing context is explicit before publish",
        },
        {
          label: "Changed since last visit",
          value: String(changedCount),
          detail: "New or updated items since you last opened the inbox",
          tone: changedCount > 0 ? "warm" : "success",
        },
        {
          label: "Pending reflections",
          value: String(reflectionRequests.length),
          detail: "Responses waiting on teacher review",
          tone: reflectionRequests.length > 0 ? "warm" : "success",
        },
      ]}
      mobileSummary={`${mutationQueue.queuedCount} sync item(s), ${mutationQueue.draftCount} draft retry item(s), and ${reflectionRequests.length} reflection review(s) are active.`}
      mobileActions={[
        {
          id: "capture-evidence",
          label: "Capture evidence",
          href: IB_CANONICAL_ROUTES.evidence,
          detail: "Quick note or camera upload",
          onSelect: () => setCaptureOpen(true),
        },
        {
          id: "review-reflection",
          label: "Review reflection",
          href: IB_CANONICAL_ROUTES.evidence,
          detail: "Approve or return the next response",
          onSelect: () => setReflectionOpen(true),
        },
        {
          id: "story-queue",
          label: "Story queue",
          href: IB_CANONICAL_ROUTES.familiesPublishing,
          detail: "Move validated evidence into family-ready flow",
        },
      ]}
      main={
        <div className="space-y-5">
          <FilterBar
            title="Queue filters"
            description="Programme and queue state can be narrowed without losing the next action."
            controls={["all", "PYP", "MYP", "DP"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setProgramme(value as "all" | "PYP" | "MYP" | "DP")}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  programme === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {value === "all" ? "All programmes" : value}
              </button>
            ))}
          />

          <BatchEvidenceActions
            selectedCount={selectedIds.length}
            lastAction={lastAction}
            onAction={(action) =>
              void (async () => {
                setLastAction(action);
                await batchApplyEvidenceAction(selectedIds, action);
                await mutate();
              })()
            }
          />

          <WorkspacePanel
            title="Evidence queue"
            description="Cards show enough context to act without opening every item."
          >
            <VirtualDataGrid
              columns={[
                {
                  key: "selected",
                  header: "Pick",
                  render: (row) => (
                    <input
                      aria-label={`Select ${row.title}`}
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? [...current, row.id]
                            : current.filter((id) => id !== row.id),
                        );
                      }}
                    />
                  ),
                },
                {
                  key: "title",
                  header: "Evidence",
                  render: (row) => (
                    <button
                      type="button"
                      className="text-left font-semibold text-slate-900 underline-offset-4 hover:underline"
                      onClick={() => setActiveItemId(row.id)}
                    >
                      {row.title}
                    </button>
                  ),
                },
                { key: "context", header: "Context" },
                { key: "status", header: "Status" },
                { key: "visibility", header: "Visibility" },
                { key: "nextAction", header: "Next action" },
              ]}
              rows={visibleItems}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <EvidenceToStoryComposer item={activeItem} />
          <WorkspacePanel
            title="Queue discipline"
            description="Inbox is for triage, not for long-term curation."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Validate or request reflection before you publish.</li>
              <li>Use warnings to explain what context is missing.</li>
              <li>Move family-ready items into the queue instead of duplicating content.</li>
              <li>
                <Link
                  href={activeItem?.href || IB_CANONICAL_ROUTES.evidence}
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  Open canonical detail route
                </Link>
              </li>
            </ul>
          </WorkspacePanel>
        </div>
      }
    />
  );

  return (
    <>
      <IbSurfaceState
        status={state}
        ready={ready}
        emptyTitle="No evidence is waiting"
        emptyDescription="The inbox will surface new evidence, reflection requests, and family visibility decisions as they arrive."
      />
      <MobileEvidenceTriage items={visibleItems} />
      <EvidenceReviewDrawer
        item={drawerItem}
        open={Boolean(drawerItem)}
        onClose={() => setActiveItemId(null)}
      />
      <MobileEvidenceCaptureSheet
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCreated={() => void mutate()}
        curriculumDocumentId={activeItem?.curriculumDocumentId}
        operationalRecordId={activeItem?.operationalRecordId}
        storyOptions={mobileStoryOptions}
      />
      <MobileReflectionReviewSheet
        open={reflectionOpen}
        requests={reflectionRequests}
        onClose={() => setReflectionOpen(false)}
        onUpdated={() => void Promise.all([mutate(), mutateReflectionRequests()])}
      />
      <ConflictResolutionDialog
        open={mutationQueue.conflictCount > 0}
        onClose={() => mutationQueue.clearConflict(mutationQueue.conflicts[0]?.id || "")}
        onKeepLocal={() => mutationQueue.clearConflict(mutationQueue.conflicts[0]?.id || "")}
      />
    </>
  );
}
