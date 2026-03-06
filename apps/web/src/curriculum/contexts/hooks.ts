import { type SWRConfiguration } from "swr";
import { buildQueryString } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";
import type { PlanningContext, UsePlanningContextsParams } from "@/curriculum/contexts/types";

export function usePlanningContexts(
  params: UsePlanningContextsParams = {},
  config?: SWRConfiguration<PlanningContext[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<PlanningContext[]>(`/api/v1/planning_contexts${query}`, config);
}

export function usePlanningContext(
  id: number | string | null | undefined,
  config?: SWRConfiguration<PlanningContext>,
) {
  return useSchoolSWR<PlanningContext>(id ? `/api/v1/planning_contexts/${id}` : null, config);
}
