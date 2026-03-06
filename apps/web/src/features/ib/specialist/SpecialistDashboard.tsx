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

export function SpecialistDashboard({ state = "ready" }: { state?: IbSurfaceStatus }) {
  const { data: payload } = useIbSpecialistPayload();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"comment" | "evidence" | "resource" | "support-note">("comment");
  const [activeTitle, setActiveTitle] = useState("Specialist contribution");

  if (!payload) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const ready = (
    <IbWorkspaceScaffold
      title="Specialist dashboard"
      description="A lean cross-grade workflow for owned and contributed units, with quick attach paths that do not require full homeroom navigation."
      badges={
        <>
          <IbTonePill label="Owned vs contributed" tone="accent" />
          <IbTonePill label="Quick attach" tone="success" />
        </>
      }
      metrics={[
        {
          label: "Owned units",
          value: String(payload.ownedUnits.length),
          detail: "Clear specialist responsibility",
          tone: "accent",
        },
        {
          label: "Contributed units",
          value: String(payload.contributedUnits.length),
          detail: "Support without overexposure to unrelated work",
          tone: "success",
        },
        {
          label: "Next week blocks",
          value: String(payload.weekItems.length),
          detail: "Timetable-aware actions are ordered",
          tone: "warm",
        },
        {
          label: "Comments waiting",
          value: "2",
          detail: "Coordinator requests aimed at specialists",
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
            <WorkspacePanel
              title="Owned units"
              description="Your direct responsibilities are visible separately from lighter contributions."
            >
              <div className="space-y-3">
                {payload.ownedUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left"
                    onClick={() => {
                      setActiveTitle(unit.title);
                      setDrawerOpen(true);
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-950">{unit.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{unit.detail}</p>
                  </button>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Contributed units"
              description="Contribution-only work stays lightweight and permission-safe."
            >
              <div className="space-y-3">
                {payload.contributedUnits.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    className="w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4 text-left"
                    onClick={() => {
                      setActiveTitle(unit.title);
                      setDrawerOpen(true);
                    }}
                  >
                    <p className="text-sm font-semibold text-slate-950">{unit.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{unit.detail}</p>
                  </button>
                ))}
              </div>
            </WorkspacePanel>
          </div>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Fast contribution rules"
          description="Specialist mode stays leaner than the full teacher workflow."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Comment-only, evidence-only, resource-only, or quick support note.</li>
            <li>Attach once to several units when the pedagogical intent is shared.</li>
            <li>See coordinator requests without opening every unit.</li>
          </ul>
        </WorkspacePanel>
      }
    />
  );

  return (
    <>
      <IbSurfaceState
        status={state}
        ready={ready}
        emptyTitle="No specialist requests this week"
        emptyDescription="The specialist queue will surface owned and contributed work as classes need support."
      />
      <MobileTriageTray
        title="Specialist quick hits"
        description="Between classes, the most urgent specialist actions stay thumb-friendly."
        items={payload.weekItems.slice(0, 2).map((unit, index) => ({
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
