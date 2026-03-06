import Link from "next/link";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { FieldAwareAiWorkbench } from "@/features/ib/ai/FieldAwareAiWorkbench";

export default function IbPlanningPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        {[
          {
            label: "PYP",
            href: "/ib/pyp/units/new",
            description:
              "Programme of Inquiry, unit studio, weekly flow, action, and family window.",
          },
          {
            label: "MYP",
            href: "/ib/myp/units/new",
            description:
              "Concept/context builder, inquiry questions, criteria, ATL, and interdisciplinary planning.",
          },
          {
            label: "DP",
            href: "/ib/dp/course-maps/new",
            description:
              "Two-year course mapping, assessment readiness, IA checkpoints, and core touchpoints.",
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {item.label} planning workspace
            </h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
          </Link>
        ))}
      </div>

      <WorkspacePanel
        title="AI workbench"
        description="Structured apply lives inside planning because teachers need field-aware help where the work actually happens."
      >
        <FieldAwareAiWorkbench />
      </WorkspacePanel>
    </div>
  );
}
