import { PublishingQueueItemPage } from "@/features/ib/families/PublishingQueueItemPage";

export default async function IbPublishingQueueItemPage({
  params,
}: {
  params: Promise<{ queueItemId: string }>;
}) {
  const { queueItemId } = await params;
  return <PublishingQueueItemPage queueItemId={queueItemId} />;
}
