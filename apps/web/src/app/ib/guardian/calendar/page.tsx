import { CalendarDigest } from "@/features/ib/guardian/CalendarDigest";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function GuardianCalendarPage() {
  return (
    <IbWorkspaceScaffold
      title="Guardian calendar"
      description="Only the dates families need for support, preparation, or celebration are shown here."
      main={
        <WorkspacePanel
          title="Calendar digest"
          description="A calm digest beats a noisy activity stream."
        >
          <CalendarDigest />
        </WorkspacePanel>
      }
    />
  );
}
