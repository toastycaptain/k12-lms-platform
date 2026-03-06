"use client";

import { PublishingQueue } from "@/features/ib/families/PublishingQueue";
import { useIbPublishingQueue } from "@/features/ib/data";
import { IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { IbPageNotFound } from "@/features/ib/layout/IbPageStates";

export function PublishingQueueItemPage({ queueItemId }: { queueItemId: string }) {
  const { data } = useIbPublishingQueue();

  if (!data) {
    return <IbPageLoading title="Loading publishing queue item..." />;
  }

  const queueItem = data.find((item) => String(item.id) === queueItemId);
  if (!queueItem) {
    return (
      <IbPageNotFound description="The requested publishing queue item is not available in the current school scope." />
    );
  }

  return <PublishingQueue initialStoryId={queueItem.story.id} />;
}
