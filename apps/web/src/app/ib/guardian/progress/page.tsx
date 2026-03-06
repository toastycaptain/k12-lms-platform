import { ProgressSummary } from "@/features/ib/guardian/ProgressSummary";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function GuardianProgressPage() {
  return (
    <IbWorkspaceScaffold
      title="Guardian progress"
      description="Progress is translated into family-safe language with clear support prompts."
      main={
        <WorkspacePanel
          title="Progress summary"
          description="Families see growth and next support steps, not internal moderation terms."
        >
          <ProgressSummary />
        </WorkspacePanel>
      }
    />
  );
}
