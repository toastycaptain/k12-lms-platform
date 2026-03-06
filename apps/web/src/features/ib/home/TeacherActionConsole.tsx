"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedControl } from "@k12/ui";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { useIbHomePayload, type HomeLinkItem } from "@/features/ib/home/useIbHomePayload";
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
        {items.map((item) => (
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
        ))}
      </div>
    </WorkspacePanel>
  );
}

export function QuickActionsRail({ items }: { items: HomeLinkItem[] }) {
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

export function TeacherActionConsole({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbHomePayload();
  const [layout, setLayout] = useState<"focus" | "expanded">("focus");

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

  const ready = (
    <IbWorkspaceScaffold
      title="Teacher action console"
      description="Resume work, clear the blockers, and move directly into evidence, review, and family actions."
      badges={
        <>
          <IbTonePill label={payload.programme} tone="accent" />
          <IbTonePill label={payload.schoolLabel} tone="default" />
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
          label: "Resume targets",
          value: String(payload.resumeItems.length),
          detail: "Current work is one click away",
          tone: "accent",
        },
        {
          label: "Evidence actions",
          value: String(payload.evidenceActions.length),
          detail: "Clear validation and reflection requests",
          tone: "warm",
        },
        {
          label: "Publishing actions",
          value: String(payload.publishingActions.length),
          detail: "Calm family cadence remains visible",
          tone: "success",
        },
        {
          label: "Change feed",
          value: String(payload.changeFeed.length),
          detail: "Only the updates that change action",
        },
      ]}
      main={
        <div className="space-y-5">
          <div className={`grid gap-5 ${layout === "focus" ? "xl:grid-cols-2" : "xl:grid-cols-3"}`}>
            <ActionListCard
              title="Resume work"
              description="Jump back into the exact unit, queue, or thread you touched last."
              items={payload.resumeItems}
            />
            <ActionListCard
              title="What changed"
              description="Concise collaboration and approval updates since your last visit."
              items={payload.changeFeed}
            />
            {layout === "expanded" ? (
              <ActionListCard
                title="Coordinator comments"
                description="Feedback that is blocking publish, approval, or student follow-up."
                items={payload.coordinatorComments}
              />
            ) : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ActionListCard
              title="Evidence needs action"
              description="Validate, request reflection, or route evidence into stories before the queue grows stale."
              items={payload.evidenceActions}
            />
            <ActionListCard
              title="Family publishing"
              description="Keep family output deliberate, previewed, and low-noise."
              items={payload.publishingActions}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ActionListCard
              title="Projects and core follow-up"
              description="Exhibition, projects, CAS, EE, and TOK stay in the daily console instead of separate trackers."
              items={payload.projectsCoreFollowUp}
            />
            {layout === "focus" ? (
              <ActionListCard
                title="Coordinator comments"
                description="Feedback that is blocking publish, approval, or student follow-up."
                items={payload.coordinatorComments}
              />
            ) : (
              <WorkspacePanel
                title="Click-budget review"
                description="This console is only useful if it beats the old path lengths."
              >
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>Open the current unit from home in one click.</li>
                  <li>Reach evidence validation in one click and batch act within two.</li>
                  <li>Reach the family publishing queue in one click.</li>
                  <li>Reach the next review blocker in one click.</li>
                </ul>
              </WorkspacePanel>
            )}
          </div>
        </div>
      }
      aside={<QuickActionsRail items={payload.quickActions} />}
    />
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
