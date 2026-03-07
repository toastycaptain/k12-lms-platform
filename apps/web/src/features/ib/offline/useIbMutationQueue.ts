"use client";

import { useMemo } from "react";
import {
  enqueueMutation,
  flushQueuedMutations,
  queuedMutationCount,
  type QueuedMutation,
} from "@/lib/offlineMutationQueue";

export function useIbMutationQueue() {
  return useMemo(
    () => ({
      queuedCount: queuedMutationCount(),
      enqueue: (mutation: Omit<QueuedMutation, "id" | "queuedAt">) => enqueueMutation(mutation),
      flush: () => flushQueuedMutations(),
    }),
    [],
  );
}
