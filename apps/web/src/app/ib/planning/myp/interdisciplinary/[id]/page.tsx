import { InterdisciplinaryUnitStudio } from "@/features/ib/myp/InterdisciplinaryUnitStudio";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default async function InterdisciplinaryPlanningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <IbWorkspaceScaffold
      title={`Interdisciplinary unit • ${id}`}
      description="A dedicated collaborative surface for subject-side comparison and shared inquiry."
      metrics={[
        { label: "Subject groups", value: "2", detail: "Design + Sciences", tone: "accent" },
        {
          label: "Co-planners",
          value: "3",
          detail: "Visible in the shared workspace",
          tone: "success",
        },
        {
          label: "Shared assessments",
          value: "2",
          detail: "Linked to the common inquiry",
          tone: "warm",
        },
        { label: "Open issues", value: "1", detail: "Concept/context alignment check" },
      ]}
      main={<InterdisciplinaryUnitStudio />}
      aside={
        <WorkspacePanel
          title="Why this matters"
          description="Interdisciplinary work should not require disconnected duplicate documents."
        >
          <p className="text-sm text-slate-600">
            The split view keeps subject-side detail intact while the shared middle space carries
            the common inquiry and assessment logic.
          </p>
        </WorkspacePanel>
      }
    />
  );
}
