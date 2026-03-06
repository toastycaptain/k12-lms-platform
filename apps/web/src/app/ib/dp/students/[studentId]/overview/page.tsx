import { DpStudentOverview } from "@/features/ib/dp/DpWorkspaces";

export default async function DpStudentOverviewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <DpStudentOverview studentId={studentId} />;
}
