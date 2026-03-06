import { useMemo } from "react";
import { buildQueryString, useAppSWR } from "@/lib/swr";
import { normalizePackSubset } from "@/curriculum/runtime/normalizePackSubset";

export function useCurriculumRuntimeDetails() {
  const result = useAppSWR<Record<string, unknown>>("/api/v1/curriculum_profiles?runtime=true");
  const runtime = useMemo(
    () => (result.data ? normalizePackSubset(result.data) : null),
    [result.data],
  );

  return {
    ...result,
    runtime,
  };
}

export function useCurriculumPack(key: string | null | undefined, version?: string | null) {
  const query = buildQueryString({ key, version });
  const result = useAppSWR<Array<Record<string, unknown>>>(
    key ? `/api/v1/curriculum_profiles${query}` : null,
  );

  const pack = useMemo(() => {
    if (!result.data || result.data.length === 0) {
      return null;
    }

    return normalizePackSubset(result.data[0]);
  }, [result.data]);

  return {
    ...result,
    pack,
  };
}
