import AppShell from "@/components/AppShell";
import PlanContextDetailModule from "@/curriculum/modules/PlanContextDetailModule";

export default async function PlanContextDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <PlanContextDetailModule contextId={Number(id)} />
    </AppShell>
  );
}
