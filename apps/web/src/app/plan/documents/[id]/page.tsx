import AppShell from "@/components/AppShell";
import PlanDocumentModule from "@/curriculum/modules/PlanDocumentModule";

export default async function PlanDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <PlanDocumentModule documentId={Number(id)} />
    </AppShell>
  );
}
