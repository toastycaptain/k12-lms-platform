import { EeSupervisionWorkspace } from "@/features/ib/dp/EeSupervisionWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function DpEePage() {
  return (
    <IbWorkspaceScaffold
      title="Extended Essay"
      description="Supervisor workflow, draft comparison, and support summaries remain together."
      main={
        <WorkspacePanel
          title="EE supervision"
          description="A dedicated route for the next advisor follow-up."
        >
          <EeSupervisionWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
