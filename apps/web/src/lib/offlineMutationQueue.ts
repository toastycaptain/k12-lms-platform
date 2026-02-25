"use client";

import { mutate } from "swr";
import { ApiError, apiFetch } from "@/lib/api";

const STORAGE_KEY = "k12.offline_mutation_queue";

type MutationMethod = "POST" | "PATCH" | "PUT" | "DELETE";

export interface QueuedMutation {
  id: string;
  url: string;
  method: MutationMethod;
  body?: string;
  headers?: Record<string, string>;
  revalidateKeys?: string[];
  queuedAt: string;
}

function readQueue(): QueuedMutation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is QueuedMutation =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as QueuedMutation).id === "string" &&
        typeof (entry as QueuedMutation).url === "string" &&
        typeof (entry as QueuedMutation).method === "string",
    );
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]): void {
  if (typeof window === "undefined") {
    return;
  }

  if (queue.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

function normalizeRevalidateKeys(keys: string[] | undefined): string[] {
  if (!keys) {
    return [];
  }

  return keys.filter((key) => typeof key === "string" && key.length > 0);
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

function nextQueueId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function enqueueMutation(mutation: Omit<QueuedMutation, "id" | "queuedAt">): QueuedMutation {
  const next = {
    id: nextQueueId(),
    queuedAt: new Date().toISOString(),
    ...mutation,
    revalidateKeys: normalizeRevalidateKeys(mutation.revalidateKeys),
  };

  const queue = readQueue();
  queue.push(next);
  writeQueue(queue);
  return next;
}

export function queuedMutationCount(): number {
  return readQueue().length;
}

export async function flushQueuedMutations(): Promise<number> {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.onLine) {
    return 0;
  }

  const queue = readQueue();
  if (queue.length === 0) {
    return 0;
  }

  const remaining: QueuedMutation[] = [];
  let completed = 0;

  for (let index = 0; index < queue.length; index += 1) {
    const mutationItem = queue[index];

    try {
      await apiFetch<unknown>(mutationItem.url, {
        method: mutationItem.method,
        body: mutationItem.body,
        headers: mutationItem.headers,
      });

      if (mutationItem.revalidateKeys && mutationItem.revalidateKeys.length > 0) {
        await Promise.all(mutationItem.revalidateKeys.map((key) => mutate(key)));
      }

      completed += 1;
    } catch (error) {
      // Drop non-retryable client errors from the queue.
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        completed += 1;
        continue;
      }

      remaining.push(mutationItem);

      if (isNetworkFailure(error)) {
        writeQueue(queue.slice(index));
        return completed;
      }
    }
  }

  writeQueue(remaining);
  return completed;
}
