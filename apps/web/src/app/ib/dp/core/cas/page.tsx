import { CasWorkspace } from "@/features/ib/dp/CasWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function DpCasPage() {
  return (
    <IbWorkspaceScaffold
      title="CAS"
      description="CAS experiences, advisor review, and celebration-ready evidence stay in one queue."
      main={
        <WorkspacePanel
          title="CAS workspace"
          description="High-signal advisor follow-up without spreadsheet drift."
        >
          <CasWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
