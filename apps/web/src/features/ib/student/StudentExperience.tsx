"use client";

import { useIbStudentPayload } from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { StudentLearningStream } from "@/features/ib/student/StudentLearningStream";
import { StudentProgressPanel } from "@/features/ib/student/StudentProgressPanel";

interface StudentExperienceProps {
  variant: "dashboard" | "progress";
}

export function StudentExperience({ variant }: StudentExperienceProps) {
  const { data } = useIbStudentPayload();

  if (!data) {
    return <IbSurfaceState status="loading" ready={null} />;
  }

  const mypActions = data.nextCheckpoints.filter((item) => item.programme === "MYP");
  const dpActions = data.nextCheckpoints.filter((item) => item.programme === "DP");

  return (
    <IbWorkspaceScaffold
      title={variant === "dashboard" ? "Student home" : "Progress"}
      description="IB student surfaces prioritize next steps, evidence, reflection, and growth signals over generic grade averages."
      badges={
        <>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            Agency-oriented
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            Context inline
          </span>
        </>
      }
      metrics={[
        {
          label: "Next checkpoints",
          value: String(data.nextCheckpoints.length),
          detail: "Across learning, portfolio, and project work",
          tone: "accent",
        },
        {
          label: "Reflections due",
          value: String(data.reflectionsDue.length),
          detail: "Prompted by evidence and feedback",
          tone: "warm",
        },
        {
          label: "Validated evidence",
          value: String(data.validatedEvidence.length),
          detail: "Visible in your portfolio and progress signals",
          tone: "success",
        },
        {
          label: "Project milestones",
          value: String(data.projectMilestones.length),
          detail: "Including service, projects, or DP core",
        },
      ]}
      timeline={[
        {
          id: "student-1",
          title: "Upload one reflection-linked evidence item",
          description:
            "Keep reflection and evidence close together so the progress model feels coherent.",
          meta: "Today",
          tone: "accent",
        },
        {
          id: "student-2",
          title: "Check the next project milestone",
          description:
            "Projects and core live in the same daily stream instead of a hidden secondary workflow.",
          meta: "Tomorrow",
          tone: "warning",
        },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Student learning stream"
            description="Lessons, tasks, reflections, feedback, and project checkpoints are shown in one coherent sequence."
          >
            <StudentLearningStream
              items={data.nextCheckpoints.map((item) => ({
                id: item.id,
                title: item.title,
                context: `${item.programme} • ${item.recordFamily.replace(/_/g, " ")}`,
                detail: item.nextAction || item.summary || "",
                href: item.href,
              }))}
            />
          </WorkspacePanel>

          <WorkspacePanel
            title="Programme next actions"
            description="MYP and DP obligations stay distinguishable without splitting the student into separate products."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">MYP</p>
                <p className="mt-2">
                  {mypActions[0]?.nextAction ||
                    mypActions[0]?.summary ||
                    "No current MYP blockers."}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">DP</p>
                <p className="mt-2">
                  {dpActions[0]?.nextAction || dpActions[0]?.summary || "No current DP blockers."}
                </p>
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            title="Progress model"
            description="IB progress surfaces should explain growth, not just display numeric averages."
          >
            <StudentProgressPanel
              rows={[
                {
                  area: "Validated evidence",
                  signal: `${data.validatedEvidence.length} pieces of evidence are validated.`,
                  next:
                    data.reflectionsDue[0]?.title ||
                    "Add your next reflection-linked evidence item.",
                },
                {
                  area: "Reflections due",
                  signal: `${data.reflectionsDue.length} reflection prompts are waiting.`,
                  next:
                    data.reflectionsDue[0]?.summary || "Respond to the next reflection request.",
                },
                {
                  area: "Project milestones",
                  signal: `${data.projectMilestones.length} project or core milestones are visible.`,
                  next: data.projectMilestones[0]?.nextAction || "Check your next milestone.",
                },
              ]}
            />
          </WorkspacePanel>
        </div>
      }
      aside={
        <WorkspacePanel
          title="Reflection prompts"
          description="Give students a clear place to add or revisit reflections tied to evidence, units, or core work."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="rounded-3xl bg-slate-50 p-4">
              What changed after your first attempt, and why?
            </li>
            <li className="rounded-3xl bg-slate-50 p-4">Which ATL skill helped most this week?</li>
            <li className="rounded-3xl bg-slate-50 p-4">
              What evidence best shows growth, not just completion?
            </li>
          </ul>
        </WorkspacePanel>
      }
    />
  );
}
