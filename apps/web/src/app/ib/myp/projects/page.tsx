import { ProjectsHub } from "@/features/ib/myp/ProjectsHub";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function MypProjectsPage() {
  return (
    <IbWorkspaceScaffold
      title="MYP projects"
      description="Personal Project, Community Project, and Service as Action stay route-linked and operational."
      main={
        <WorkspacePanel
          title="Projects hub"
          description="Project milestones, mentor follow-up, and service evidence stay in one place."
        >
          <ProjectsHub />
        </WorkspacePanel>
      }
    />
  );
}
