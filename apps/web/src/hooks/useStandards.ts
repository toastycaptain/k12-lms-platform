import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

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
  return useAppSWR<Standard[]>(`/api/v1/standards${query}`, config);
}

export function useStandardFrameworks(config?: SWRConfiguration<StandardFramework[]>) {
  return useAppSWR<StandardFramework[]>("/api/v1/standard_frameworks", config);
}

export function useStandardTree(
  frameworkId: string | number | null | undefined,
  config?: SWRConfiguration<StandardTree[]>,
) {
  return useAppSWR<StandardTree[]>(
    frameworkId ? `/api/v1/standard_frameworks/${frameworkId}/tree` : null,
    config,
  );
}
