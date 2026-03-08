import { IbPlannerCreatePage } from "@/features/ib/planning/IbPlannerCreatePage";

export default function NewDpCoursePage() {
  return (
    <IbPlannerCreatePage
      title="Create DP course map"
      description="Start a live DP course map with document-backed sequencing and risk-traceable checkpoints."
      routeTemplate="/ib/dp/course-maps/:id"
      preferredDocumentType="ib_dp_course_map"
      fallbackDocumentType="unit_plan"
      preferredSchemaKey="ib.dp.course_map@v2"
      fallbackSchemaKey="ib.myp.unit@v1"
    />
  );
}
