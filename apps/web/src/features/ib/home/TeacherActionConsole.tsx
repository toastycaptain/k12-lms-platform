"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@k12/ui";
import { apiFetch } from "@/lib/api";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { emitIbEvent } from "@/features/ib/analytics/emitIbEvent";
import { ChangedSinceLastVisit } from "@/features/ib/home/ChangedSinceLastVisit";
import { PinnedWorkPanel } from "@/features/ib/home/PinnedWorkPanel";
import { useIbHomePayload, type HomeLinkItem } from "@/features/ib/home/useIbHomePayload";
import { BenchmarkRefreshPanel } from "@/features/ib/phase9/Phase9Panels";
import { BulkCarryForwardPanel } from "@/features/ib/planning/BulkCarryForwardPanel";
import { DuplicateDocumentDialog } from "@/features/ib/planning/DuplicateDocumentDialog";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

function ActionListCard({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: HomeLinkItem[];
}) {
  return (
    <WorkspacePanel title={title} description={description}>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="block rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
                {item.tone ? <IbTonePill label={item.programme ?? "IB"} tone={item.tone} /> : null}
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm text-slate-600">
            No actions are currently queued here.
          </div>
        )}
      </div>
    </WorkspacePanel>
  );
}

function QuickActionsRail({ items }: { items: HomeLinkItem[] }) {
  return (
    <WorkspacePanel
      title="Quick actions"
      description="Common teacher actions stay one click away so the home page earns its keep."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 shadow-sm"
          >
            {item.label}
            <p className="mt-1 text-sm font-normal text-slate-600">{item.detail}</p>
          </Link>
        ))}
      </div>
    </WorkspacePanel>
  );
}

function QuickMutationPanel({
  items,
  fallbackItem,
  onDuplicate,
}: {
  items: Array<{ id: string; label: string; detail: string; mutationType: string }>;
  fallbackItem?: HomeLinkItem;
  onDuplicate: (sourceId: number) => void;
}) {
  async function handleMutation(mutationType: string) {
    if (mutationType === "pin_recent_work" && fallbackItem?.entityRef) {
      await apiFetch("/api/v1/ib/workspace_preferences", {
        method: "POST",
        body: JSON.stringify({
          ib_user_workspace_preference: {
            surface: "teacher_home",
            context_key: "pins",
            preference_key: "teacher_home",
            value: { entity_refs: [fallbackItem.entityRef] },
          },
        }),
      });
      return;
    }

    if (mutationType === "duplicate_document") {
      const ref = fallbackItem?.entityRef?.split(":") || [];
      if (ref[0] === "curriculum_document" && ref[1]) {
        onDuplicate(Number(ref[1]));
        return;
      }
    }

    await emitIbEvent({
      eventName: `ib.${mutationType}.executed`,
      eventFamily: "teacher_workflow",
      surface: "teacher_home",
      entityRef: fallbackItem?.entityRef,
      routeId: fallbackItem?.routeId,
      programme: fallbackItem?.programme,
      metadata: {
        mutation_type: mutationType,
        label: fallbackItem?.label,
      },
    });
  }

  return (
    <WorkspacePanel
      title="Quick mutations"
      description="Low-friction actions that should not require opening a full workspace first."
    >
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void handleMutation(item.mutationType)}
            className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
          >
            <p className="text-sm font-semibold text-slate-950">{item.label}</p>
            <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
          </button>
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function TeacherActionConsole({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbHomePayload();
  const [layout, setLayout] = useState<"focus" | "expanded">("focus");
  const [duplicateSourceId, setDuplicateSourceId] = useState<number | null>(null);

  if (!payload) {
    return (
      <IbSurfaceState
        status="loading"
        ready={null}
        emptyTitle="Loading teacher console"
        emptyDescription="Fetching IB actions and queues."
      />
    );
  }

  const {
    pinnedItems = [],
    dueToday = [],
    recentHistory = [],
    quickMutations = [],
    benchmarkSnapshot = [],
    performanceBudget = { generatedAt: "", budgets: [], regressions: [] },
    ...basePayload
  } = payload;
  const enhancedPayload = {
    ...basePayload,
    pinnedItems,
    dueToday,
    recentHistory,
    quickMutations,
    benchmarkSnapshot,
    performanceBudget,
  };

  const carryForwardItems = [
    ...enhancedPayload.resumeItems,
    ...enhancedPayload.projectsCoreFollowUp,
    ...enhancedPayload.dueToday,
  ].slice(0, 6);

  const benchmarkTimeline = enhancedPayload.benchmarkSnapshot.map((workflow) => ({
    id: workflow.workflowKey,
    title: workflow.label,
    description: `${Math.round(workflow.observedMs / 1000)}s observed across ${workflow.observedClicks} clicks. Target ${Math.round(workflow.targetMs / 1000)}s / ${workflow.clickTarget} clicks.`,
    meta: workflow.status.replace(/_/g, " "),
    tone: workflow.status === "over_budget" ? ("warning" as const) : ("success" as const),
  }));

  const ready = (
    <>
      <IbWorkspaceScaffold
        title="Teacher action console"
        description="Resume work, clear the blockers, and move directly into evidence, review, and family actions."
        badges={
          <>
            <IbTonePill label={payload.programme} tone="accent" />
            <IbTonePill label={enhancedPayload.schoolLabel} tone="default" />
          </>
        }
        filters={
          <SegmentedControl
            label="Console density"
            value={layout}
            onChange={(value) => setLayout(value as "focus" | "expanded")}
            options={[
              { value: "focus", label: "Focus" },
              { value: "expanded", label: "Expanded" },
            ]}
          />
        }
        metrics={[
          {
            label: "Pinned work",
            value: String(enhancedPayload.pinnedItems.length),
            detail: "Critical items stay above the fold",
            tone: "accent",
          },
          {
            label: "Due today",
            value: String(enhancedPayload.dueToday.length),
            detail: "Immediate follow-up stays visible",
            tone: enhancedPayload.dueToday.length > 0 ? "warm" : "success",
          },
          {
            label: "Quick mutations",
            value: String(enhancedPayload.quickMutations.length),
            detail: "Fast actions without route changes",
            tone: "success",
          },
          {
            label: "Workflow budgets",
            value: String(enhancedPayload.performanceBudget.regressions.length),
            detail: "Optimization backlog still over budget",
            tone: enhancedPayload.performanceBudget.regressions.length > 0 ? "warm" : "success",
          },
        ]}
        timeline={benchmarkTimeline}
        main={
          <div className="space-y-5">
            <div
              className={`grid gap-5 ${layout === "focus" ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}
            >
              <PinnedWorkPanel
                items={enhancedPayload.pinnedItems}
                fallbackItems={enhancedPayload.resumeItems}
              />
              <ChangedSinceLastVisit
                items={enhancedPayload.changeFeed}
                recentHistory={enhancedPayload.recentHistory}
              />
              {layout === "expanded" ? (
                <ActionListCard
                  title="Resume work"
                  description="Jump back into the exact unit, queue, or thread you touched last."
                  items={enhancedPayload.resumeItems}
                />
              ) : null}
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ActionListCard
                title="Due today"
                description="Items with same-day deadlines or handoffs stay out of buried secondary views."
                items={enhancedPayload.dueToday}
              />
              <ActionListCard
                title="Evidence needs action"
                description="Validate, request reflection, or route evidence into stories before the queue grows stale."
                items={enhancedPayload.evidenceActions}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ActionListCard
                title="Family publishing"
                description="Keep family output deliberate, previewed, and low-noise."
                items={enhancedPayload.publishingActions}
              />
              <ActionListCard
                title="Projects and core follow-up"
                description="Exhibition, projects, CAS, EE, and TOK stay in the daily console instead of separate trackers."
                items={enhancedPayload.projectsCoreFollowUp}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <ActionListCard
                title="Coordinator comments"
                description="Feedback that is blocking publish, approval, or student follow-up."
                items={enhancedPayload.coordinatorComments}
              />
              {layout === "expanded" ? (
                <BulkCarryForwardPanel items={carryForwardItems} />
              ) : (
                <ActionListCard
                  title="Resume work"
                  description="The fastest path back into current planning stays visible even in focus mode."
                  items={enhancedPayload.resumeItems}
                />
              )}
            </div>
          </div>
        }
        aside={
          <div className="space-y-5">
            <QuickActionsRail items={enhancedPayload.quickActions} />
            <QuickMutationPanel
              items={enhancedPayload.quickMutations}
              fallbackItem={enhancedPayload.pinnedItems[0] || enhancedPayload.resumeItems[0]}
              onDuplicate={setDuplicateSourceId}
            />
            <WorkspacePanel
              title="Workflow benchmark snapshot"
              description="The teacher home should make the common IB jobs faster than the old path lengths."
            >
              <div className="space-y-3">
                {enhancedPayload.benchmarkSnapshot.map((workflow) => (
                  <div
                    key={workflow.workflowKey}
                    className="rounded-[1.35rem] bg-slate-50 px-4 py-4 text-sm text-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{workflow.label}</p>
                        <p className="mt-1">
                          {Math.round(workflow.observedMs / 1000)}s observed,{" "}
                          {workflow.observedClicks} clicks
                        </p>
                      </div>
                      <IbTonePill
                        label={workflow.status === "over_budget" ? "Over budget" : "Within budget"}
                        tone={workflow.status === "over_budget" ? "warm" : "success"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
            <BenchmarkRefreshPanel
              title="Teacher-speed benchmark refresh"
              description="Phase 9 protects the teacher workflow sprint with fresh benchmark snapshots and visible regressions."
              roleScope="teacher"
            />
            {layout === "focus" ? <BulkCarryForwardPanel items={carryForwardItems} /> : null}
          </div>
        }
      />
      <DuplicateDocumentDialog
        open={duplicateSourceId !== null}
        onClose={() => setDuplicateSourceId(null)}
        sourceId={duplicateSourceId}
        sourceType="curriculum_document"
      />
    </>
  );

  return (
    <IbSurfaceState
      status={state}
      ready={ready}
      emptyTitle="No IB actions yet"
      emptyDescription="As plans, evidence, or review work arrives, the teacher console will turn into a daily action surface."
      offlineDescription="Quick links remain visible, but queue freshness will resume after reconnecting."
    />
  );
}
