import { CasWorkspace } from "@/features/ib/dp/CasWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function DpCasPage() {
  return (
    <IbWorkspaceScaffold
      title="CAS"
      description="CAS experiences, projects, reflections, and advisor review stay on a single route family."
      main={
        <WorkspacePanel
          title="CAS operations"
          description="Student, advisor, and coordinator action stays visible in one queue."
        >
          <CasWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
