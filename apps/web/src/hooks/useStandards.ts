import { type SWRConfiguration } from "swr";
import { buildQueryString } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";

export interface Standard {
  id: number;
  code: string;
  description: string;
  grade_band?: string | null;
  standard_framework_id?: number;
}

export interface StandardFramework {
  id: number;
  name: string;
  subject: string | null;
  jurisdiction: string | null;
  version: string | null;
}

export interface StandardTree {
  id: number;
  code: string;
  description: string;
  grade_band: string | null;
  children: StandardTree[];
}

export interface UseStandardsParams {
  page?: number;
  per_page?: number;
  standard_framework_id?: number;
  q?: string;
}

export function useStandards(
  params: UseStandardsParams = {},
  config?: SWRConfiguration<Standard[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<Standard[]>(`/api/v1/standards${query}`, config);
}

export function useStandardFrameworks(config?: SWRConfiguration<StandardFramework[]>) {
  return useSchoolSWR<StandardFramework[]>("/api/v1/standard_frameworks", config);
}

export function useStandardTree(
  frameworkId: string | number | null | undefined,
  config?: SWRConfiguration<StandardTree[]>,
) {
  return useSchoolSWR<StandardTree[]>(
    frameworkId ? `/api/v1/standard_frameworks/${frameworkId}/tree` : null,
    config,
  );
}
