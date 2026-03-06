import { DpCourseMap } from "@/features/ib/dp/DpCourseMap";

export default async function DpCourseMapPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <DpCourseMap courseId={courseId} />;
}
