import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function GuardianMessagesPage() {
  return (
    <IbWorkspaceScaffold
      title="Guardian messages"
      description="Family communication stays supportive and infrequent enough to remain meaningful."
      main={
        <WorkspacePanel
          title="Message rhythm"
          description="This route is intentionally quiet and digest-oriented."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Weekly digest is scheduled for Friday afternoon.</li>
            <li>No urgent family-visible alerts are active today.</li>
            <li>
              Support prompts stay attached to published learning stories and calendar digest items.
            </li>
          </ul>
        </WorkspacePanel>
      }
    />
  );
}
