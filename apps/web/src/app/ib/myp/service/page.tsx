import { ProjectsHub } from "@/features/ib/myp/ProjectsHub";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function MypServicePage() {
  return (
    <IbWorkspaceScaffold
      title="Service as action"
      description="Service capture, reflection, and validation stay lightweight for students while remaining reviewable for teachers and coordinators."
      main={
        <WorkspacePanel
          title="Service queue"
          description="Service entries live beside projects so the MYP slice stays coherent."
        >
          <ProjectsHub families={["myp_service"]} />
        </WorkspacePanel>
      }
    />
  );
}
