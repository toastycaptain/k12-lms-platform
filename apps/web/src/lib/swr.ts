import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import { apiFetch } from "@/lib/api";

export type QueryValue = string | number | boolean | null | undefined;

function statusCode(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") {
      return status;
    }
  }

  return null;
}

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  onErrorRetry: (error, _key, _config, revalidate, context) => {
    const status = statusCode(error);
    if (status !== null && status >= 400 && status < 500) {
      return;
    }

    if (context.retryCount >= 3) {
      return;
    }

    const delay = Math.min(1000 * 2 ** context.retryCount, 30_000);
    setTimeout(() => {
      void revalidate({ retryCount: context.retryCount + 1 });
    }, delay);
  },
};

export function buildQueryString(params: object = {}): string {
  const query = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      typeof value !== "string" &&
      typeof value !== "number" &&
      typeof value !== "boolean"
    ) {
      return;
    }

    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function defaultFetcher<T>(url: string): Promise<T> {
  return apiFetch<T>(url);
}

export function useAppSWR<Data = unknown, ErrorType = Error>(
  key: string | null,
  config?: SWRConfiguration<Data, ErrorType>,
): SWRResponse<Data, ErrorType> {
  return useSWR<Data, ErrorType>(key, defaultFetcher<Data>, {
    ...swrConfig,
    ...config,
  });
}
