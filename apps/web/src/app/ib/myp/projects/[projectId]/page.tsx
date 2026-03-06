import { MypProjectWorkspace } from "@/features/ib/myp/MypUnitStudio";

export default async function MypProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <MypProjectWorkspace projectId={projectId} />;
}
