import { PypUnitStudio } from "@/features/ib/pyp/PypUnitStudio";

export default async function PypUnitStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PypUnitStudio unitId={id} />;
}
