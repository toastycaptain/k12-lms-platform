import { CriteriaPlannerPanel } from "@/features/ib/myp/CriteriaPlannerPanel";
import { DpAssessmentDashboard } from "@/features/ib/dp/DpAssessmentDashboard";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function IbAssessmentPage() {
  return (
    <IbWorkspaceScaffold
      title="Assessment workspace"
      description="Criteria, readiness, internal assessments, and evidence checkpoints in one serious operations surface."
      metrics={[
        {
          label: "Criteria mapped",
          value: "12",
          detail: "Across current MYP and DP plans",
          tone: "accent",
        },
        { label: "IA follow-ups", value: "3", detail: "Needs action next", tone: "warm" },
        {
          label: "Readiness cards",
          value: "8",
          detail: "Subject-specific status visible",
          tone: "success",
        },
        { label: "Evidence checkpoints", value: "14", detail: "Inline with unit plans" },
      ]}
      main={
        <div className="space-y-5">
          <WorkspacePanel
            title="Criteria planning"
            description="Show coverage balance and evidence opportunity before grading week arrives."
          >
            <CriteriaPlannerPanel />
          </WorkspacePanel>
          <WorkspacePanel
            title="DP assessment dashboard"
            description="A readiness view without spreadsheet sprawl."
          >
            <DpAssessmentDashboard />
          </WorkspacePanel>
        </div>
      }
    />
  );
}
