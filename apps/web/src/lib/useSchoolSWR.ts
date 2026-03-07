import { type SWRConfiguration, type SWRResponse } from "swr";
import { useSchool } from "@/lib/school-context";
import { useAppSWR } from "@/lib/swr";

export function useSchoolSWR<Data = unknown, ErrorType = Error>(
  url: string | null,
  config?: SWRConfiguration<Data, ErrorType>,
): SWRResponse<Data, ErrorType> {
  const { schoolId, loading } = useSchool();
  const key = url ? (loading ? null : schoolId ? [url, schoolId] : url) : null;
  return useAppSWR<Data, ErrorType>(key, config);
}
