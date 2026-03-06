import { PypWeeklyFlow } from "@/features/ib/pyp/PypWeeklyFlow";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default async function PypWeeklyFlowPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;

  return (
    <IbWorkspaceScaffold
      title="PYP weekly flow"
      description="Weekly flow now resolves as a real route in the PYP tree instead of a hover-only or dead-end transition."
      main={
        <WorkspacePanel
          title={`Unit ${unitId}`}
          description="Weekly flow records and operational checkpoints linked to this unit."
        >
          <PypWeeklyFlow documentId={unitId} />
        </WorkspacePanel>
      }
    />
  );
}
