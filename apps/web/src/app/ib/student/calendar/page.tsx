import { CalendarTimeline } from "@k12/ui";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function StudentCalendarPage() {
  return (
    <IbWorkspaceScaffold
      title="Student calendar"
      description="Upcoming checkpoints and deadlines stay visible without exposing coordinator workflow detail."
      main={
        <WorkspacePanel
          title="Upcoming"
          description="The next student-facing milestones are grouped by readiness and support needs."
        >
          <CalendarTimeline
            items={[
              {
                id: "student-calendar-1",
                date: "Tomorrow",
                title: "Design storyboard revision",
                detail: "Bring Criterion B evidence and one reflection note.",
              },
              {
                id: "student-calendar-2",
                date: "Friday",
                title: "EE supervision meeting",
                detail: "Prepare one stronger counterargument source.",
              },
            ]}
          />
        </WorkspacePanel>
      }
    />
  );
}
