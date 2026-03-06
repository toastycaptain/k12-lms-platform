import { PublishingQueue } from "@/features/ib/families/PublishingQueue";

export default async function IbFamilyStoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  return <PublishingQueue initialStoryId={storyId} />;
}
