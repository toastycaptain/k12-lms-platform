import { EeSupervisionWorkspace } from "@/features/ib/dp/EeSupervisionWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function EePage() {
  return (
    <IbWorkspaceScaffold
      title="Extended Essay supervision"
      description="Reduce advisor spreadsheet load with a centralized supervision workspace."
      main={
        <WorkspacePanel
          title="Supervisor workflow"
          description="Student status, meeting logs, and draft comparison stay together."
        >
          <EeSupervisionWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
