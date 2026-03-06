import { StandardsCycleDetail } from "@/features/ib/standards/StandardsCycleDetail";

export default async function IbStandardsCyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  return <StandardsCycleDetail cycleId={cycleId} />;
}
