import { PypUnitStudio } from "@/features/ib/pyp/PypUnitStudio";

export default async function PypUnitPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  return <PypUnitStudio unitId={unitId} />;
}
