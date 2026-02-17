import { mutate } from "swr";
import { apiFetch } from "@/lib/api";

type RevalidateKey = string | string[] | undefined;

async function revalidateKeys(keys: RevalidateKey): Promise<void> {
  if (!keys) return;

  const targetKeys = Array.isArray(keys) ? keys : [keys];
  await Promise.all(targetKeys.map((key) => mutate(key)));
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

  await revalidateKeys(revalidate);
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

  await revalidateKeys(revalidate);
  return data;
}

export async function deleteAndRevalidate(url: string, revalidate?: RevalidateKey): Promise<void> {
  await apiFetch<void>(url, { method: "DELETE" });
  await revalidateKeys(revalidate);
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
