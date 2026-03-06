import { StandardsPacketDetail } from "@/features/ib/standards/StandardsPacketDetail";

export default async function IbStandardsPacketPage({
  params,
}: {
  params: Promise<{ packetId: string }>;
}) {
  const { packetId } = await params;
  return <StandardsPacketDetail packetId={packetId} />;
}
