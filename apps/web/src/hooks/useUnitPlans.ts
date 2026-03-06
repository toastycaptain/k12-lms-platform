import { type SWRConfiguration } from "swr";
import { buildQueryString } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";

export interface UnitPlan {
  id: number;
  title: string;
  status: string;
  course_id: number;
  current_version_id: number | null;
  created_at?: string;
}

export interface UnitVersion {
  id: number;
  version_number: number;
  title?: string;
  description?: string | null;
}

export interface UseUnitPlansParams {
  page?: number;
  per_page?: number;
  status?: string;
  course_id?: number;
  q?: string;
}

export function useUnitPlans(
  params: UseUnitPlansParams = {},
  config?: SWRConfiguration<UnitPlan[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<UnitPlan[]>(`/api/v1/unit_plans${query}`, config);
}

export function useUnitPlan(
  unitPlanId: string | number | null | undefined,
  config?: SWRConfiguration<UnitPlan>,
) {
  return useSchoolSWR<UnitPlan>(unitPlanId ? `/api/v1/unit_plans/${unitPlanId}` : null, config);
}

export function useUnitPlanVersions(
  unitPlanId: string | number | null | undefined,
  config?: SWRConfiguration<UnitVersion[]>,
) {
  return useSchoolSWR<UnitVersion[]>(
    unitPlanId ? `/api/v1/unit_plans/${unitPlanId}/versions` : null,
    config,
  );
}
