import { MypUnitStudio } from "@/features/ib/myp/MypUnitStudio";

export default async function MypUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  return <MypUnitStudio unitId={unitId} />;
}
