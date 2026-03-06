import { TokWorkspace } from "@/features/ib/dp/TokWorkspace";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function DpTokPage() {
  return (
    <IbWorkspaceScaffold
      title="TOK"
      description="Prompt planning, objects, and feedback trails stay visible in one workflow."
      main={
        <WorkspacePanel
          title="TOK workspace"
          description="A direct route into the next TOK support checkpoint."
        >
          <TokWorkspace />
        </WorkspacePanel>
      }
    />
  );
}
