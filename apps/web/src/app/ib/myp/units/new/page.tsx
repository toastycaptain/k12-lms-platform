import { IbPlannerCreatePage } from "@/features/ib/planning/IbPlannerCreatePage";

export default function NewMypUnitPage() {
  return (
    <IbPlannerCreatePage
      title="Create MYP unit"
      description="Open a live MYP planning record without dropping into the generic plan workflow."
      routeBuilder={(documentId) => `/ib/myp/units/${documentId}`}
      preferredDocumentType="ib_myp_unit"
      fallbackDocumentType="unit_plan"
      preferredSchemaKey="ib.myp.unit@v2"
      fallbackSchemaKey="ib.myp.unit@v1"
    />
  );
}
