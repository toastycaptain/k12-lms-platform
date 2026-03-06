import { DpInternalAssessmentWorkspace } from "@/features/ib/dp/DpWorkspaces";

export default async function DpInternalAssessmentPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <DpInternalAssessmentWorkspace recordId={recordId} />;
}
