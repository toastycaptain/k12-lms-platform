import { EvidenceInbox } from "@/features/ib/evidence/EvidenceInbox";

export default async function IbEvidenceItemPage({
  params,
}: {
  params: Promise<{ evidenceItemId: string }>;
}) {
  const { evidenceItemId } = await params;
  return <EvidenceInbox initialActiveItemId={evidenceItemId} />;
}
