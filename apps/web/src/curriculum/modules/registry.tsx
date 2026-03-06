import dynamic from "next/dynamic";

export const MODULE_REGISTRY = {
  "plan.documents": dynamic(() => import("@/curriculum/modules/PlanDocumentsModule")),
  "plan.contexts": dynamic(() => import("@/curriculum/modules/PlanContextsModule")),
};
