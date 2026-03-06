import Link from "next/link";
import { ProjectsHub } from "@/features/ib/myp/ProjectsHub";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { IB_CANONICAL_ROUTES } from "@/features/ib/core/route-registry";

export default function ProjectsCorePage() {
  return (
    <IbWorkspaceScaffold
      title="Projects and core"
      description="PYP exhibition, MYP projects, CAS, EE, and TOK workspaces live together instead of across improvised trackers."
      metrics={[
        { label: "Active projects", value: "19", detail: "Across MYP and PYP", tone: "accent" },
        { label: "Core follow-ups", value: "6", detail: "CAS, EE, or TOK items due", tone: "warm" },
        {
          label: "Mentor pairings",
          value: "12",
          detail: "For exhibition and project support",
          tone: "success",
        },
        { label: "Family-ready summaries", value: "4", detail: "Support-oriented updates" },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="MYP projects hub"
            description="Personal Project, Community Project, and Service as Action."
          >
            <ProjectsHub />
          </WorkspacePanel>
          <div className="grid gap-4 xl:grid-cols-4">
            {[
              [IB_CANONICAL_ROUTES.pypExhibition, "PYP Exhibition"],
              [IB_CANONICAL_ROUTES.mypProjects, "MYP Projects"],
              [IB_CANONICAL_ROUTES.dpCas, "CAS"],
              [IB_CANONICAL_ROUTES.dpCoreEe, "EE"],
              [IB_CANONICAL_ROUTES.dpCoreTok, "TOK"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-lg font-semibold text-slate-950">{label}</p>
                <p className="mt-2 text-sm text-slate-600">Open dedicated workflow</p>
              </Link>
            ))}
          </div>
        </div>
      }
    />
  );
}
