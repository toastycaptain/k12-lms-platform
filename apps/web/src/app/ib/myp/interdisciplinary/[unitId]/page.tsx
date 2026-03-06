import { InterdisciplinaryUnitStudio } from "@/features/ib/myp/InterdisciplinaryUnitStudio";

export default async function MypInterdisciplinaryPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  return <InterdisciplinaryUnitStudio unitId={unitId} />;
}
