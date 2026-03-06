import { DpAssessmentDashboard, InternalAssessmentTracker } from "@/features/ib/dp/DpWorkspaces";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function DpIaRiskPage() {
  return (
    <IbWorkspaceScaffold
      title="DP IA risk"
      description="Internal assessment readiness stays visible as a live risk workflow, not a separate spreadsheet."
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Readiness by subject"
            description="Spot pressure and support needs before milestones slip."
          >
            <DpAssessmentDashboard />
          </WorkspacePanel>
          <WorkspacePanel
            title="Student milestone tracker"
            description="Supervisor follow-up is explicit and route-linked."
          >
            <InternalAssessmentTracker />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
