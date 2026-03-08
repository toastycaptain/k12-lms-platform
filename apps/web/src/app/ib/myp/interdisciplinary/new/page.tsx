import { IbPlannerCreatePage } from "@/features/ib/planning/IbPlannerCreatePage";

export default function NewMypInterdisciplinaryPage() {
  return (
    <IbPlannerCreatePage
      title="Create MYP interdisciplinary record"
      description="Launch a live interdisciplinary planning record with the shared MYP workflow and schema."
      routeTemplate="/ib/myp/interdisciplinary/:id"
      preferredDocumentType="ib_myp_interdisciplinary_unit"
      fallbackDocumentType="unit_plan"
      preferredSchemaKey="ib.myp.interdisciplinary@v2"
      fallbackSchemaKey="ib.myp.unit@v1"
    />
  );
}
