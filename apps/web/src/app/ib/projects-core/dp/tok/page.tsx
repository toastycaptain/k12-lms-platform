import { TokWorkspace } from "@/features/ib/dp/TokWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function TokPage() {
  return (
    <IbWorkspaceScaffold
      title="TOK workspace"
      description="Prompt planning, object selection, evidence links, and feedback trail in one place."
      main={
        <WorkspacePanel
          title="TOK planning and review"
          description="A dedicated TOK surface rather than a generic assignment page."
        >
          <TokWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
