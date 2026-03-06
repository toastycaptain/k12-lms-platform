import AppShell from "@/components/AppShell";
import { ModuleRouter } from "@/curriculum/modules/moduleRouter";

export default async function PlanCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const moduleId = `plan.${slug.join(".")}`;

  return (
    <AppShell>
      <ModuleRouter moduleId={moduleId} />
    </AppShell>
  );
}
