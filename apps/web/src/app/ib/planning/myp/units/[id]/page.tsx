import { MypUnitStudio } from "@/features/ib/myp/MypUnitStudio";

export default async function MypUnitStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MypUnitStudio unitId={id} />;
}
