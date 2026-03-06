import { useMemo } from "react";
import { type SWRConfiguration } from "swr";
import { buildQueryString } from "@/lib/swr";
import { useSchoolSWR } from "@/lib/useSchoolSWR";
import type {
  Framework,
  FrameworkNode,
  FrameworkNodeTree,
  UseFrameworkNodeSearchParams,
  UseFrameworkParams,
} from "@/curriculum/frameworks/types";

export function useFrameworks(
  params: UseFrameworkParams = {},
  config?: SWRConfiguration<Framework[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<Framework[]>(`/api/v1/standard_frameworks${query}`, config);
}

export function useFrameworkTree(
  frameworkId: number | string | null | undefined,
  params: Pick<UseFrameworkNodeSearchParams, "kind"> = {},
  config?: SWRConfiguration<FrameworkNodeTree[]>,
) {
  const query = buildQueryString(params);
  return useSchoolSWR<FrameworkNodeTree[]>(
    frameworkId ? `/api/v1/standard_frameworks/${frameworkId}/tree${query}` : null,
    config,
  );
}

export function useFrameworkNodeSearch(
  params: UseFrameworkNodeSearchParams,
  config?: SWRConfiguration<FrameworkNode[]>,
) {
  const query = buildQueryString(params);
  const result = useSchoolSWR<FrameworkNode[] | { standards: FrameworkNode[] }>(
    params.q && params.q.trim().length >= 2 ? `/api/v1/standards${query}` : null,
    config as SWRConfiguration<FrameworkNode[] | { standards: FrameworkNode[] }>,
  );

  const nodes = useMemo(() => {
    if (!result.data) {
      return [];
    }

    return Array.isArray(result.data) ? result.data : result.data.standards || [];
  }, [result.data]);

  return {
    ...result,
    data: nodes,
  };
}
