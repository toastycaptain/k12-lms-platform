import { IbPlannerCreatePage } from "@/features/ib/planning/IbPlannerCreatePage";

export default function NewPypUnitPage() {
  return (
    <IbPlannerCreatePage
      title="Create PYP unit"
      description="Start directly in the live PYP unit studio with the PYP schema and route binding already selected."
      routeTemplate="/ib/pyp/units/:id"
      preferredDocumentType="ib_pyp_unit"
      fallbackDocumentType="unit_plan"
      preferredSchemaKey="ib.pyp.unit@v2"
      fallbackSchemaKey="ib.pyp.unit@v1"
    />
  );
}
