"use client";

import { useState } from "react";
import { useIbStudentPayload } from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { LearningTimeline } from "@/features/ib/student/LearningTimeline";
import { TimelineFilters } from "@/features/ib/student/TimelineFilters";
import { StudentGoalsPanel } from "@/features/ib/student/StudentGoalsPanel";
import { NextActionsCard } from "@/features/ib/student/NextActionsCard";
import { ReflectionComposer } from "@/features/ib/student/ReflectionComposer";
import { ReflectionHistoryPanel } from "@/features/ib/student/ReflectionHistoryPanel";
import { CriteriaGrowthView } from "@/features/ib/student/CriteriaGrowthView";
import { AtlGrowthView } from "@/features/ib/student/AtlGrowthView";
import { MilestoneJourney } from "@/features/ib/student/MilestoneJourney";
import { PeerFeedbackPanel } from "@/features/ib/student/PeerFeedbackPanel";
import { StudentQuickActionsTray } from "@/features/ib/student/StudentQuickActionsTray";
import { NotificationPreferencesSheet } from "@/features/ib/student/NotificationPreferencesSheet";
import { PortfolioSearchBar } from "@/features/ib/portfolio/PortfolioSearchBar";
import { CollectionBuilder } from "@/features/ib/portfolio/CollectionBuilder";
import { TrustPolicyPanel } from "@/features/ib/phase9/Phase9Panels";
import { ReleasedReportsPanel } from "@/features/ib/reports/ReleasedReportsPanel";
import { CommunicationPreferencesPanel } from "@/features/ib/shared/CommunicationPreferencesPanel";

interface StudentExperienceProps {
  variant: "dashboard" | "progress";
}

export function StudentExperience({ variant }: StudentExperienceProps) {
  const { data, mutate } = useIbStudentPayload();
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [portfolioQuery, setPortfolioQuery] = useState("");

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const filteredTimeline = data.learningTimeline.filter((item) => {
    if (timelineFilter !== "all" && item.kind !== timelineFilter) {
      return false;
    }

    if (!portfolioQuery.trim()) {
      return true;
    }

    const query = portfolioQuery.trim().toLowerCase();
    return `${item.title} ${item.detail}`.toLowerCase().includes(query);
  });

  const filteredPortfolioResults = !portfolioQuery.trim()
    ? data.portfolio.evidenceResults
    : data.portfolio.evidenceResults.filter((item) =>
        `${item.title} ${item.detail || ""}`
          .toLowerCase()
          .includes(portfolioQuery.trim().toLowerCase()),
      );

  return (
    <>
      <IbWorkspaceScaffold
        title={variant === "dashboard" ? "Student home" : "Progress"}
        description="IB student surfaces prioritize next actions, evidence, reflection, and growth signals over generic averages."
        badges={
          <>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Agency-oriented
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Calm notifications
            </span>
          </>
        }
        metrics={[
          {
            label: "Timeline events",
            value: String(data.learningTimeline.length),
            detail: "One stream for learning, feedback, and milestones",
            tone: "accent",
          },
          {
            label: "Goals",
            value: String(data.goals.length),
            detail: "Student-owned priorities remain visible",
            tone: "success",
          },
          {
            label: "Next actions",
            value: String(data.nextActions.length),
            detail: "Today and this week stay explicit",
            tone: "warm",
          },
          {
            label: "Collections",
            value: String(data.portfolio.collections.length),
            detail: "Portfolio progression can be curated, not just accumulated",
          },
        ]}
        main={
          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-2">
              <NextActionsCard actions={data.nextActions} />
              <StudentGoalsPanel goals={data.goals} />
            </div>

            <WorkspacePanel
              title="Unified learning timeline"
              description="Lessons, evidence, goals, reflections, and milestones stay in one coherent stream."
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <TimelineFilters value={timelineFilter} onChange={setTimelineFilter} />
                <div className="w-full max-w-sm">
                  <PortfolioSearchBar value={portfolioQuery} onChange={setPortfolioQuery} />
                </div>
              </div>
              <LearningTimeline items={filteredTimeline} />
            </WorkspacePanel>

            <div className="grid gap-5 xl:grid-cols-2">
              <ReflectionComposer prompts={data.reflectionSystem.prompts} />
              <ReflectionHistoryPanel history={data.reflectionSystem.history} />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <CriteriaGrowthView points={data.growthVisualization.criteria} />
              <AtlGrowthView
                points={[
                  ...data.growthVisualization.atl,
                  ...data.growthVisualization.learnerProfile,
                ]}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <MilestoneJourney rows={data.milestoneJourney} />
              <PeerFeedbackPanel
                enabled={data.peerFeedback.enabled}
                guidelines={data.peerFeedback.guidelines}
                feedback={data.peerFeedback.recentFeedback}
              />
            </div>

            <WorkspacePanel
              title="Portfolio search and collections"
              description="Search evidence quickly, then organize progression into reusable collections."
            >
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,1fr)]">
                <div className="space-y-3">
                  {filteredPortfolioResults.length > 0 ? (
                    filteredPortfolioResults.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        className="block rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        <p className="font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1">{item.detail || item.programme}</p>
                      </a>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      No portfolio evidence matches this filter.
                    </div>
                  )}
                </div>
                <CollectionBuilder rows={data.portfolio.collections} />
              </div>
            </WorkspacePanel>
          </div>
        }
        aside={
          <div className="space-y-5">
            <WorkspacePanel
              title="Release gates"
              description="Student experience must stay calm, accessible, and mobile-ready."
            >
              <div className="space-y-2">
                {Object.entries(data.releaseGates).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <span className="font-semibold text-slate-950">{key.replace(/_/g, " ")}</span>
                    <span className="ml-2">{value ? "Pass" : "Watch"}</span>
                  </div>
                ))}
              </div>
            </WorkspacePanel>
            <ReleasedReportsPanel
              title="Released reports"
              description="Progress reports and conference packets stay tied to read-state and acknowledgement history."
              reports={data.releasedReports}
              receipts={data.deliveryReceipts}
              emptyDescription="Released report history will appear here when advisors or teachers publish it."
              onRefresh={() => mutate()}
            />
            <TrustPolicyPanel
              audience="student"
              title="Student trust policy"
              description="Student-facing communication remains calm, explicit, and tied to clear approval rules."
            />
            <CommunicationPreferencesPanel
              audience="student"
              fallback={data.communicationPreferences}
              title="Communication preferences"
              description="Students control digest cadence and quiet hours without losing important milestone updates."
              onSaved={() => mutate()}
            />
            <NotificationPreferencesSheet preferences={data.notificationPreferences} />
          </div>
        }
      />
      <StudentQuickActionsTray actions={data.quickActions} />
    </>
  );
}
