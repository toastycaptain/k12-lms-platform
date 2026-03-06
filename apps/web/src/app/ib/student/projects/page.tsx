import { DpCoreOverview } from "@/features/ib/dp/DpCoreOverview";
import { ProjectsHub } from "@/features/ib/myp/ProjectsHub";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function StudentProjectsPage() {
  return (
    <IbWorkspaceScaffold
      title="Student projects and core"
      description="Project milestones, core expectations, and next support moments stay visible in one learner-facing route."
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Projects hub"
            description="Community Project, Personal Project, and service signals stay simple and actionable."
          >
            <ProjectsHub />
          </WorkspacePanel>
          <WorkspacePanel
            title="DP core follow-up"
            description="CAS, EE, and TOK checkpoints remain visible for students who need them."
          >
            <DpCoreOverview />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
