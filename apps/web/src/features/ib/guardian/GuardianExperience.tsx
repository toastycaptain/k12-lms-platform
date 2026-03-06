"use client";

import { useIbGuardianPayload } from "@/features/ib/data";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { CalendarDigest } from "@/features/ib/guardian/CalendarDigest";
import { CurrentUnitWindow } from "@/features/ib/guardian/CurrentUnitWindow";
import { LearningStoryFeed } from "@/features/ib/guardian/LearningStoryFeed";
import { PortfolioHighlights } from "@/features/ib/guardian/PortfolioHighlights";
import { ProgressSummary } from "@/features/ib/guardian/ProgressSummary";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";

export function GuardianExperience() {
  const { data } = useIbGuardianPayload();

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  return (
    <IbWorkspaceScaffold
      title="Family home"
      description="Guardian views stay permissioned, understandable, and calm while still showing what matters in IB learning."
      badges={
        <>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            Family-facing only
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Tiered notifications
          </span>
        </>
      }
      metrics={[
        {
          label: "Stories this week",
          value: String(data.progressSummary.storyCount),
          detail: "Narrative updates with clear home prompts",
          tone: "success",
        },
        {
          label: "Upcoming milestones",
          value: String(data.calendarDigest.length),
          detail: "Only relevant, family-visible dates",
          tone: "accent",
        },
        {
          label: "Portfolio highlights",
          value: String(data.progressSummary.highlightCount),
          detail: "Approved evidence moments",
        },
        {
          label: "Support prompts",
          value: String(data.progressSummary.supportPrompts),
          detail: "Concrete ways to help at home",
          tone: "warm",
        },
      ]}
      timeline={[
        {
          id: "guardian-1",
          title: "Read this week’s learning story",
          description:
            "Stories translate curriculum context into language families can actually use.",
          meta: "Today",
          tone: "accent",
        },
        {
          id: "guardian-2",
          title: "Ask one current unit question at home",
          description:
            "The home prompt should support conversation, not turn families into compliance monitors.",
          meta: "This week",
          tone: "success",
        },
      ]}
      main={
        <div className="space-y-5">
          <LearningStoryFeed
            stories={data.stories.map((story) => ({
              id: story.id,
              title: story.title,
              detail: story.summary || "",
              prompt: story.supportPrompt || "",
            }))}
          />
          <CurrentUnitWindow
            title={data.currentUnits[0]?.title}
            summary={data.currentUnits[0]?.summary}
          />
          <WorkspacePanel
            title="Upcoming milestones"
            description="Families see the next supportable milestone without internal review clutter."
          >
            <div className="space-y-3">
              {data.milestoneDigest.length > 0 ? (
                data.milestoneDigest.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    className="block rounded-3xl bg-slate-50 p-4 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1">
                      {item.programme} • {item.cadence}
                    </p>
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No family-visible milestones are currently scheduled.
                </p>
              )}
            </div>
          </WorkspacePanel>
          <PortfolioHighlights items={data.portfolioHighlights.map((item) => item.title)} />
        </div>
      }
      aside={
        <div className="space-y-4">
          <ProgressSummary
            items={[
              `${data.progressSummary.storyCount} published stories are visible.`,
              `${data.progressSummary.highlightCount} portfolio highlights are approved.`,
              `${data.progressSummary.supportPrompts} support prompts are available for home conversations.`,
            ]}
          />
          <WorkspacePanel
            title="Calendar digest"
            description="Only the dates families need for support, preparation, or celebration."
          >
            <CalendarDigest
              items={data.calendarDigest.map((item) => ({
                id: item.id,
                date: item.publishedAt || null,
                title: item.title,
                detail: item.cadence,
              }))}
            />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
