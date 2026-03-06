"use client";

import { useMemo } from "react";
import { ActivityTimeline } from "@k12/ui";
import { EvidenceFeed } from "@/features/curriculum/evidence/EvidenceFeed";
import { useLearningStories } from "@/features/curriculum/evidence/hooks";
import { LearningStoryComposer } from "@/features/ib/family/LearningStoryComposer";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

interface PortfolioWorkspaceProps {
  mode: "teacher" | "student" | "guardian";
}

export function PortfolioWorkspace({ mode }: PortfolioWorkspaceProps) {
  const { stories, publishStory } = useLearningStories();

  const metrics = useMemo(() => {
    return mode === "student"
      ? [
          {
            label: "Evidence this month",
            value: "14",
            detail: "Across units, projects, and reflections",
            tone: "accent" as const,
          },
          {
            label: "Validated",
            value: "9",
            detail: "Teacher-reviewed evidence moments",
            tone: "success" as const,
          },
          {
            label: "Family-visible",
            value: "4",
            detail: "Shared without exposing internal workflow",
            tone: "warm" as const,
          },
          { label: "Reflection prompts", value: "3", detail: "Waiting on a response this week" },
        ]
      : [
          {
            label: "Evidence queue",
            value: "27",
            detail: "Needs validation or comment this week",
            tone: "warm" as const,
          },
          {
            label: "Family-ready stories",
            value: "6",
            detail: "Prepared for a calm weekly digest",
            tone: "success" as const,
          },
          {
            label: "ATL tags in use",
            value: "18",
            detail: "Visible across programmes",
            tone: "accent" as const,
          },
          {
            label: "Unshared highlights",
            value: "11",
            detail: "Strong evidence not yet published",
          },
        ];
  }, [mode]);

  const timelineItems = [
    {
      id: "portfolio-1",
      title: "Validate evidence before family digest",
      description:
        "Keep story publishing tied to real evidence moments and explicit visibility choices.",
      meta: "Today",
      tone: "accent" as const,
    },
    {
      id: "portfolio-2",
      title: "Prompt reflection on the next checkpoint",
      description: "Students should see why the evidence matters, not just that it was uploaded.",
      meta: "Tomorrow",
      tone: "warning" as const,
    },
    {
      id: "portfolio-3",
      title: "Publish one story with translated context",
      description: "Family-facing language stays calm and avoids exposing teacher workflow detail.",
      meta: "This week",
      tone: "success" as const,
    },
  ];

  const storyPanel = (
    <WorkspacePanel
      title={mode === "guardian" ? "Published learning stories" : "Learning stories"}
      description="Story-first updates keep the family view understandable while staying connected to evidence."
    >
      <div className="space-y-3">
        {stories.map((story) => (
          <article key={story.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {story.programme}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {story.notificationLevel}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-950">{story.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{story.narrative}</p>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Family prompt: {story.familyPrompt}
            </p>
          </article>
        ))}
      </div>
    </WorkspacePanel>
  );

  return (
    <IbWorkspaceScaffold
      title={mode === "student" ? "Portfolio" : "Evidence and learning stories"}
      description="A first-class evidence surface for student ownership, teacher validation, and calm family sharing."
      badges={
        <>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            IB evidence spine
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Family visibility is explicit
          </span>
        </>
      }
      metrics={metrics}
      timeline={timelineItems}
      main={
        <div className="space-y-5">
          {mode !== "guardian" ? <EvidenceFeed /> : null}
          {mode !== "guardian" ? <LearningStoryComposer onPublish={publishStory} /> : null}
          {storyPanel}
        </div>
      }
      aside={
        <div className="space-y-4">
          <WorkspacePanel
            title="Publishing rules"
            description="AI or quick actions never publish invisibly. Every story has explicit audience and notification intent."
          >
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Private drafts stay out of family feeds.</li>
              <li>Teacher validation stays visible on evidence detail, not buried in reports.</li>
              <li>Notification levels are tiered so families get signal, not noise.</li>
            </ul>
          </WorkspacePanel>
          <WorkspacePanel
            title="Recent publishing rhythm"
            description="A lightweight timeline helps staff see if the evidence pipeline is healthy."
          >
            <ActivityTimeline items={timelineItems} />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
