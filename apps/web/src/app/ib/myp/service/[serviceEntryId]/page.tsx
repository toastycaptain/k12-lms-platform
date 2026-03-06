import { MypServiceWorkspace } from "@/features/ib/myp/MypUnitStudio";

export default async function MypServiceEntryPage({
  params,
}: {
  params: Promise<{ serviceEntryId: string }>;
}) {
  const { serviceEntryId } = await params;
  return <MypServiceWorkspace serviceEntryId={serviceEntryId} />;
}
