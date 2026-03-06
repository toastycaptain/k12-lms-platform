import { MypStudentProjectWorkspace } from "@/features/ib/myp/MypUnitStudio";

export default async function MypStudentProjectPage({
  params,
}: {
  params: Promise<{ studentId: string; projectId: string }>;
}) {
  const { studentId, projectId } = await params;
  return <MypStudentProjectWorkspace studentId={studentId} projectId={projectId} />;
}
