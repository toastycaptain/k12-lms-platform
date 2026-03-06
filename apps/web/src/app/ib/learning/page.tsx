import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";
import { PypWeeklyFlow } from "@/features/ib/pyp/PypWeeklyFlow";
import { StudentLearningStream } from "@/features/ib/student/StudentLearningStream";

export default function IbLearningPage() {
  return (
    <IbWorkspaceScaffold
      title="Learning workspace"
      description="Daily teaching and learning flow stays tied to units, evidence, and upcoming reflection moments."
      metrics={[
        { label: "Live sequences", value: "5", detail: "Across current units", tone: "accent" },
        { label: "Evidence prompts", value: "7", detail: "Visible in learning flow", tone: "warm" },
        { label: "Reflection cues", value: "4", detail: "Ready for students", tone: "success" },
        { label: "Family-visible moments", value: "2", detail: "Embedded in the weekly flow" },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Weekly flow"
            description="A visual unpacking of current learning experiences and checkpoints."
          >
            <PypWeeklyFlow />
          </WorkspacePanel>
          <WorkspacePanel
            title="Student learning stream preview"
            description="Teachers can see how the day-to-day stream looks from the learner side."
          >
            <StudentLearningStream />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
