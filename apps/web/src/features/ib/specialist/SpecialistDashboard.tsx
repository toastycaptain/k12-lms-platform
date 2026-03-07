"use client";

import { useState } from "react";
import { useIbSpecialistPayload } from "@/features/ib/data";
import {
  IbSurfaceState,
  IbTonePill,
  type IbSurfaceStatus,
} from "@/features/ib/core/IbSurfaceState";
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { SchoolWeekPlanner } from "@/features/ib/specialist/SchoolWeekPlanner";
import { SpecialistContributionDrawer } from "@/features/ib/specialist/SpecialistContributionDrawer";
import { SpecialistQueue } from "@/features/ib/specialist/SpecialistQueue";
import { ContributionOnlyStudio } from "@/features/ib/specialist/ContributionOnlyStudio";
import { SpecialistAnalyticsPanel } from "@/features/ib/specialist/SpecialistAnalyticsPanel";
import { NotificationPreferencesPanel } from "@/features/ib/specialist/NotificationPreferencesPanel";
import { SpecialistLibraryPanel } from "@/features/ib/specialist/SpecialistLibraryPanel";
import { SpecialistMobileCapture } from "@/features/ib/specialist/SpecialistMobileCapture";

export function SpecialistDashboard({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbSpecialistPayload();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"comment" | "evidence" | "resource" | "support-note">("comment");
  const [activeTitle, setActiveTitle] = useState("Specialist contribution");
  const [activeDetail, setActiveDetail] = useState("Open the next specialist action.");

  if (!payload) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const {
    requestedContributions = [],
    pendingResponses = [],
    evidenceToSort = [],
    overloadSignals = [],
    assignmentGaps = [],
    libraryItems = [],
    ...basePayload
  } = payload;
  const enhancedPayload = {
    ...basePayload,
    requestedContributions,
    pendingResponses,
    evidenceToSort,
    overloadSignals,
    assignmentGaps,
    libraryItems,
  };

  const openContribution = (title: string, detail: string) => {
    setActiveTitle(title);
    setActiveDetail(detail);
    setDrawerOpen(true);
  };

  const urgentCount = enhancedPayload.pendingResponses.filter(
    (item) => item.handoffState === "awaiting_response",
  ).length;

  const ready = (
    <IbWorkspaceScaffold
      title="Specialist dashboard"
      description="A lean cross-grade workflow for contribution requests, rapid evidence capture, and handoffs that respect timetable reality."
      badges={
        <>
          <IbTonePill label="Contribution-first" tone="accent" />
          <IbTonePill label="Cross-grade reuse" tone="success" />
        </>
      }
      metrics={[
        {
          label: "Requested contributions",
          value: String(enhancedPayload.requestedContributions.length),
          detail: "Specialist asks stay separated from full-owner work",
          tone: "accent",
        },
        {
          label: "Pending handoffs",
          value: String(enhancedPayload.pendingResponses.length),
          detail: "Responses waiting on the next timetable window",
          tone: enhancedPayload.pendingResponses.length > 0 ? "warm" : "success",
        },
        {
          label: "Evidence to sort",
          value: String(enhancedPayload.evidenceToSort.length),
          detail: "Rapid attach stays available between classes",
          tone: "success",
        },
        {
          label: "Reuse library",
          value: String(enhancedPayload.libraryItems.length),
          detail: "Save once, reuse across grades and programmes",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Where you are needed this week"
            description="The top of the page answers where to go next and what can be done in under a minute."
          >
            <SchoolWeekPlanner
              items={payload.weekItems.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                date: item.dueOn || null,
              }))}
            />
          </WorkspacePanel>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-5">
              <SpecialistQueue
                title="Requested contributions"
                description="Contribution-only asks keep specialists out of irrelevant owner fields."
                items={enhancedPayload.requestedContributions.map((unit) => ({
                  id: unit.id,
                  title: unit.title,
                  detail: unit.detail,
                  href: unit.href,
                  handoffState: unit.handoffState,
                }))}
              />
              <SpecialistQueue
                title="Pending handoffs"
                description="Clear what needs a response before the next specialist block begins."
                items={enhancedPayload.pendingResponses.map((unit) => ({
                  id: unit.id,
                  title: unit.title,
                  detail: unit.detail,
                  href: unit.href,
                  handoffState: unit.handoffState,
                }))}
              />
            </div>
            <div className="space-y-5">
              <WorkspacePanel
                title="Assigned units"
                description="Owned work stays visible, but lighter contributions remain the primary mode."
              >
                <div className="space-y-3">
                  {[...payload.ownedUnits, ...payload.contributedUnits].map((unit) => (
                    <button
                      key={`${unit.id}-${unit.href}`}
                      type="button"
                      className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                      onClick={() => openContribution(unit.title, unit.detail)}
                    >
                      <p className="text-sm font-semibold text-slate-950">{unit.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{unit.detail}</p>
                    </button>
                  ))}
                </div>
              </WorkspacePanel>
              <ContributionOnlyStudio title={activeTitle} detail={activeDetail} />
            </div>
          </div>

          <SpecialistQueue
            title="Evidence to sort"
            description="Quick evidence capture and rapid attach stay visible without opening the full teacher queue."
            items={enhancedPayload.evidenceToSort.map((item) => ({
              id: item.id,
              title: item.title,
              detail: item.detail,
              href: item.href,
              handoffState: item.status,
            }))}
          />
        </div>
      }
      aside={
        <div className="space-y-5">
          <NotificationPreferencesPanel urgentCount={urgentCount} />
          <SpecialistLibraryPanel items={enhancedPayload.libraryItems} />
          <SpecialistAnalyticsPanel
            overloadSignals={enhancedPayload.overloadSignals}
            assignmentGaps={enhancedPayload.assignmentGaps}
          />
          <SpecialistMobileCapture />
        </div>
      }
    />
  );

  return (
    <>
      <IbSurfaceState
        status={state}
        ready={ready}
        emptyTitle="No specialist requests this week"
        emptyDescription="The specialist queue will surface contribution asks and handoffs as classes need support."
      />
      <MobileTriageTray
        title="Specialist quick hits"
        description="Between classes, the most urgent specialist actions stay thumb-friendly."
        items={enhancedPayload.pendingResponses.slice(0, 3).map((unit, index) => ({
          id: String(unit.id),
          label: unit.title,
          detail: unit.detail,
          href: unit.href,
          status: index === 0 ? "pending" : "saved",
        }))}
      />
      <SpecialistContributionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contributionMode={mode}
        onContributionModeChange={setMode}
        title={activeTitle}
      />
    </>
  );
}
