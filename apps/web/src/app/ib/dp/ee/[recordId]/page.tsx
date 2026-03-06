import { DpEeRecordWorkspace } from "@/features/ib/dp/DpWorkspaces";

export default async function DpEeRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <DpEeRecordWorkspace recordId={recordId} />;
}
