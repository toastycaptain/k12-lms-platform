import { DpTokRecordWorkspace } from "@/features/ib/dp/DpWorkspaces";

export default async function DpTokRecordPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  return <DpTokRecordWorkspace recordId={recordId} />;
}
