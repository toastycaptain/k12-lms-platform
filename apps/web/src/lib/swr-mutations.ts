import { mutate } from "swr";
import { apiFetch } from "@/lib/api";
import { enqueueMutation } from "@/lib/offlineMutationQueue";

type RevalidateKey = string | string[] | undefined;
type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";

async function triggerRevalidation(keys: RevalidateKey): Promise<void> {
  if (!keys) return;

  const targetKeys = Array.isArray(keys) ? keys : [keys];
  await Promise.all(targetKeys.map((key) => mutate(key)));
}

function normalizeRevalidateKeys(keys: RevalidateKey): string[] {
  if (!keys) {
    return [];
  }

  const targetKeys = Array.isArray(keys) ? keys : [keys];
  return targetKeys.filter((key): key is string => typeof key === "string" && key.length > 0);
}

function isNetworkFailure(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("offline")
  );
}

export interface QueueMutationOptions {
  revalidate?: RevalidateKey;
  queueIfOffline?: boolean;
}

export interface QueueMutationResult<T> {
  data?: T;
  queued: boolean;
}

export async function mutateWithOfflineQueue<T>(
  url: string,
  method: MutationMethod,
  body: Record<string, unknown> | undefined,
  options: QueueMutationOptions = {},
): Promise<QueueMutationResult<T>> {
  const serializedBody = body ? JSON.stringify(body) : undefined;
  const keysToRevalidate = normalizeRevalidateKeys(options.revalidate);

  if (options.queueIfOffline && typeof navigator !== "undefined" && navigator.onLine === false) {
    enqueueMutation({
      url,
      method,
      body: serializedBody,
      revalidateKeys: keysToRevalidate,
    });
    return { queued: true };
  }

  try {
    const data = await apiFetch<T>(url, {
      method,
      body: serializedBody,
    });

    await triggerRevalidation(options.revalidate);
    return { data, queued: false };
  } catch (error) {
    if (options.queueIfOffline && isNetworkFailure(error)) {
      enqueueMutation({
        url,
        method,
        body: serializedBody,
        revalidateKeys: keysToRevalidate,
      });
      return { queued: true };
    }

    throw error;
  }
}

export async function createAndRevalidate<T>(
  url: string,
  body: Record<string, unknown>,
  revalidate?: RevalidateKey,
): Promise<T> {
  const data = await apiFetch<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  await triggerRevalidation(revalidate);
  return data;
}

export async function updateAndRevalidate<T>(
  url: string,
  body: Record<string, unknown>,
  revalidate?: RevalidateKey,
): Promise<T> {
  const data = await apiFetch<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  await triggerRevalidation(revalidate);
  return data;
}

export async function deleteAndRevalidate(url: string, revalidate?: RevalidateKey): Promise<void> {
  await apiFetch<void>(url, { method: "DELETE" });
  await triggerRevalidation(revalidate);
}

export async function optimisticListMutation<T>(
  key: string,
  updater: (current: T[] | undefined) => T[],
): Promise<void> {
  await mutate(
    key,
    (current: T[] | undefined) => {
      return updater(current);
    },
    { revalidate: false },
  );
}
