"use client";

import Link from "next/link";
import { PresenceStack } from "@k12/ui";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const DASHBOARD_METRICS = [
  {
    label: "Units in progress",
    value: "8",
    detail: "Across PYP, MYP, and DP planning windows",
    tone: "accent" as const,
  },
  {
    label: "Evidence needing review",
    value: "27",
    detail: "Validation or family visibility decisions due this week",
    tone: "warm" as const,
  },
  {
    label: "Projects and core",
    value: "11",
    detail: "Exhibition, Personal Project, CAS, EE, and TOK checkpoints",
    tone: "success" as const,
  },
  {
    label: "Family updates pending",
    value: "5",
    detail: "Publishable summaries waiting on final review",
  },
];

const HOME_TIMELINE = [
  {
    id: "home-1",
    title: "Publish one family window from the current PYP unit",
    description:
      "Reduce click depth by keeping evidence, family context, and publishing controls in one path.",
    meta: "Today",
    tone: "accent" as const,
  },
  {
    id: "home-2",
    title: "Review MYP criterion coverage balance",
    description: "Spot under-used criteria before the assessment window closes.",
    meta: "Tomorrow",
    tone: "warning" as const,
  },
  {
    id: "home-3",
    title: "Prepare DP IA readiness check",
    description: "Keep assessment windows and supervision notes in one operations view.",
    meta: "This week",
    tone: "success" as const,
  },
];

const PRESENCE = [
  { id: "1", name: "Amina Coordinator" },
  { id: "2", name: "Luis Specialist" },
  { id: "3", name: "Tara Teacher" },
];

export function IbDashboardPage() {
  return (
    <IbWorkspaceScaffold
      title="IB Home"
      description="A role-aware overview that keeps planning, evidence, projects, and family visibility in one workspace system."
      badges={
        <>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            IB workspace mode
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Unified timeline active
          </span>
        </>
      }
      actions={
        <>
          <Link
            href="/ib/pyp/units/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Open unit studio
          </Link>
          <Link
            href="/ib/portfolio"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Review evidence
          </Link>
        </>
      }
      metrics={DASHBOARD_METRICS}
      timeline={HOME_TIMELINE}
      main={
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-2">
            <WorkspacePanel
              title="Units in progress"
              description="Keep active work visible without forcing staff into separate programme silos."
            >
              <div className="space-y-3">
                {[
                  ["PYP", "Who We Are - Grade 4", "/ib/pyp/units/new"],
                  ["MYP", "Design for Sustainable Futures", "/ib/myp/units/new"],
                  ["DP", "Economics course map", "/ib/dp/courses/new"],
                ].map(([programme, title, href]) => (
                  <Link
                    key={title}
                    href={href}
                    className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {programme}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
                    </div>
                    <span className="text-sm text-slate-500">Open</span>
                  </Link>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Family-facing publishing rhythm"
              description="The family channel stays calm when teachers can see which updates are ready, missing context, or intentionally held."
            >
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-3xl border border-slate-200 p-4">
                  2 stories are ready for the weekly digest once evidence visibility is confirmed.
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  1 PYP family window needs a simpler home question before publishing.
                </div>
                <div className="rounded-3xl border border-slate-200 p-4">
                  2 DP support summaries are due before the next milestone cycle.
                </div>
              </div>
            </WorkspacePanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
            <WorkspacePanel
              title="Coordinator snapshot"
              description="Programme coherence, evidence health, and project follow-up all stay visible from the home view."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "PYP POI coverage is balanced across five themes; one specialist contribution is still unpublished.",
                  "MYP interdisciplinary planning has two active pairings and one draft awaiting concept/context review.",
                  "DP IA readiness shows one cohort needing supervision follow-up on authenticity markers.",
                  "Standards and Practices evidence has three sections ready for export packet generation.",
                ].map((item) => (
                  <div key={item} className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                    {item}
                  </div>
                ))}
              </div>
            </WorkspacePanel>

            <WorkspacePanel
              title="Live collaboration"
              description="Planning and evidence work should show who is active without sending everyone into detached message threads."
            >
              <PresenceStack people={PRESENCE} />
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="rounded-3xl bg-slate-50 p-4">
                  Amina is reviewing the transdisciplinary theme balance in Grade 4.
                </li>
                <li className="rounded-3xl bg-slate-50 p-4">
                  Luis added a specialist note to the PYP weekly flow.
                </li>
                <li className="rounded-3xl bg-slate-50 p-4">
                  Tara is preparing an MYP assessment and criterion map.
                </li>
              </ul>
            </WorkspacePanel>
          </div>
        </div>
      }
      aside={
        <div className="space-y-4">
          <WorkspacePanel
            title="What matters now"
            description="A daily operations summary replaces the fragmented dashboard habit."
          >
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Review evidence before it reaches families.</li>
              <li>Check MYP criterion balance before publishing the assessment.</li>
              <li>Confirm DP supervision notes for the next IA milestone.</li>
              <li>Open the collaboration hub for any cross-grade planning threads.</li>
            </ul>
          </WorkspacePanel>
        </div>
      }
    />
  );
}
