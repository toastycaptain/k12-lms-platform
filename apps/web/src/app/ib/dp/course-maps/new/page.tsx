import { IbPlannerCreatePage } from "@/features/ib/planning/IbPlannerCreatePage";

export default function NewDpCourseMapPage() {
  return (
    <IbPlannerCreatePage
      title="Create DP course map"
      description="Start a live DP course map with document-backed sequencing and risk-traceable checkpoints."
      routeBuilder={(documentId) => `/ib/dp/course-maps/${documentId}`}
      preferredDocumentType="ib_dp_course_map"
      fallbackDocumentType="unit_plan"
      preferredSchemaKey="ib.dp.course_map@v2"
      fallbackSchemaKey="ib.myp.unit@v1"
    />
  );
}
