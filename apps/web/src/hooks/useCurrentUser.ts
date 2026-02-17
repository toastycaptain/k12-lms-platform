import useSWR, { type SWRConfiguration } from "swr";
import { fetchCurrentUser, type CurrentUser } from "@/lib/api";
import { swrConfig } from "@/lib/swr";

export const CURRENT_USER_KEY = "/api/v1/me";

export function useCurrentUser(config?: SWRConfiguration<CurrentUser, Error>) {
  return useSWR<CurrentUser, Error>(CURRENT_USER_KEY, () => fetchCurrentUser(), {
    ...swrConfig,
    ...config,
  });
}
