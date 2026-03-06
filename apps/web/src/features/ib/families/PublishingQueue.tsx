"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FilterBar, VirtualDataGrid } from "@k12/ui";
import { schedulePublishingQueueItem, useIbPublishingQueue } from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { FamilyPreviewPanel } from "@/features/ib/families/FamilyPreviewPanel";
import { DigestScheduler } from "@/features/ib/families/DigestScheduler";
import { StoryStatePill, type StoryState } from "@/features/ib/families/StoryStatePill";
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { useChangedSinceLastSeen } from "@/features/ib/mobile/useLastSeen";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function PublishingQueue({
  state = "ready",
  initialStoryId = "",
}: {
  state?: IbSurfaceStatus;
  initialStoryId?: string;
}) {
  const { data, mutate } = useIbPublishingQueue();
  const [activeStoryId, setActiveStoryId] = useState<string>(initialStoryId);
  const [filter, setFilter] = useState<"all" | StoryState>("all");
  const [cadence, setCadence] = useState<"weekly" | "twice-weekly" | "publish-now">("weekly");
  const stories = useMemo(() => data?.map((item) => item.story) || [], [data]);

  const visibleStories = useMemo(
    () => stories.filter((story) => (filter === "all" ? true : story.state === filter)),
    [filter, stories],
  );
  const { changedCount } = useChangedSinceLastSeen("k12.ib.publishing.last_seen", visibleStories);

  const resolvedActiveStoryId = activeStoryId || stories[0]?.id || "";
  const activeStory = stories.find((story) => story.id === resolvedActiveStoryId) ?? null;

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Family publishing queue"
      description="Family communication stays calm because drafting, preview, cadence, and scheduling live in one queue."
      badges={
        <>
          <IbTonePill label="Preview required" tone="accent" />
          <IbTonePill label="Cadence-aware" tone="success" />
        </>
      }
      metrics={[
        {
          label: "Ready",
          value: String(stories.filter((story) => story.state === "ready-for-digest").length),
          detail: "Can move into the next digest",
          tone: "success",
        },
        {
          label: "Needs context",
          value: String(stories.filter((story) => story.state === "needs-context").length),
          detail: "Publishing blocks are explained, not hidden",
          tone: "warm",
        },
        {
          label: "Scheduled",
          value: String(stories.filter((story) => story.state === "scheduled").length),
          detail: "Teachers can see what will send next",
          tone: "accent",
        },
        {
          label: "Held back",
          value: String(stories.filter((story) => story.state === "held").length),
          detail: "Intentional restraint is visible",
        },
        {
          label: "Changed since last visit",
          value: String(changedCount),
          detail: "Updated publishing items since the last queue visit",
          tone: changedCount > 0 ? "warm" : "success",
        },
      ]}
      main={
        <div className="space-y-5">
          <FilterBar
            title="Queue states"
            description="Explicit states reduce publishing ambiguity and prevent over-posting."
            controls={[
              ["all", "All"],
              ["draft", "Draft"],
              ["needs-context", "Needs context"],
              ["ready-for-digest", "Ready for digest"],
              ["scheduled", "Scheduled"],
              ["published", "Published"],
              ["held", "Held"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value as "all" | StoryState)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  filter === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          />

          <WorkspacePanel
            title="Publishing queue"
            description="Preview, schedule, or hold work without duplicating the story or losing the audience context."
          >
            <VirtualDataGrid
              columns={[
                {
                  key: "title",
                  header: "Story",
                  render: (row) => (
                    <button
                      type="button"
                      className="text-left font-semibold text-slate-900 underline-offset-4 hover:underline"
                      onClick={() => setActiveStoryId(row.id)}
                    >
                      {row.title}
                    </button>
                  ),
                },
                { key: "programme", header: "Programme" },
                { key: "teacher", header: "Teacher" },
                {
                  key: "state",
                  header: "State",
                  render: (row) => <StoryStatePill state={row.state} />,
                },
                { key: "cadence", header: "Cadence" },
              ]}
              rows={visibleStories}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <div className="space-y-5">
          <FamilyPreviewPanel story={activeStory} />
          <DigestScheduler
            cadence={cadence}
            onCadenceChange={setCadence}
            onSchedule={() =>
              void (async () => {
                if (!activeStory) {
                  return;
                }
                const queueItem = data.find((item) => item.story.id === activeStory.id);
                if (!queueItem) {
                  return;
                }
                await schedulePublishingQueueItem(queueItem.id, cadence);
                await mutate();
              })()
            }
          />
          <WorkspacePanel
            title="Canonical route"
            description="Queue items now resolve to durable publishing routes instead of hash anchors."
          >
            <Link
              href={activeStory?.href || IB_CANONICAL_ROUTES.familiesPublishing}
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              Open selected story route
            </Link>
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
        emptyTitle="No family stories are queued"
        emptyDescription="The queue will fill as evidence turns into previewed family updates."
      />
      <MobileTriageTray
        title="Publishing quick actions"
        description="On mobile, teachers can preview, schedule, or hold the highest-value items."
        items={visibleStories.slice(0, 3).map((story, index) => ({
          id: story.id,
          label: story.title,
          detail: `${story.state.replace(/-/g, " ")} • ${story.cadence}`,
          href: story.href || IB_CANONICAL_ROUTES.familyStory(story.id),
          status: story.changedSinceLastSeen ? "pending" : index === 0 ? "saved" : "retry",
        }))}
      />
    </>
  );
}
