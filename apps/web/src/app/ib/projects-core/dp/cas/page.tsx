import { CasWorkspace } from "@/features/ib/dp/CasWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function CasPage() {
  return (
    <IbWorkspaceScaffold
      title="CAS workspace"
      description="An active progress workspace for experiences, projects, reflections, and advisor follow-up."
      main={
        <WorkspacePanel title="CAS flow" description="Useful, trackable, and less bureaucratic.">
          <CasWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
