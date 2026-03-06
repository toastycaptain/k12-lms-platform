import { DpCasRecordWorkspace } from "@/features/ib/dp/DpWorkspaces";

export default async function DpCasRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <DpCasRecordWorkspace recordId={recordId} />;
}
