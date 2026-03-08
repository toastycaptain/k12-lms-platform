"use client";

import { useEffect, useMemo, useState } from "react";
import {
  enqueueMutation,
  flushQueuedMutations,
  queuedMutationCount,
  type QueuedMutation,
} from "@/lib/offlineMutationQueue";
import {
  clearMobileConflict,
  listMobileConflicts,
  listMobileDrafts,
  mobileOfflineChangeEventName,
  removeMobileDraft,
} from "@/features/ib/mobile/mobileDraftStore";

export function useIbMutationQueue() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const refresh = () => setRevision((value) => value + 1);
    const eventName = mobileOfflineChangeEventName();
    window.addEventListener("online", refresh);
    window.addEventListener(eventName, refresh);

    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener(eventName, refresh);
    };
  }, []);

  return useMemo(
    () => ({
      queuedCount: queuedMutationCount(),
      draftCount: listMobileDrafts().length,
      conflictCount: listMobileConflicts().length,
      drafts: listMobileDrafts(),
      conflicts: listMobileConflicts(),
      enqueue: (mutation: Omit<QueuedMutation, "id" | "queuedAt">) => {
        const queued = enqueueMutation(mutation);
        setRevision((value) => value + 1);
        return queued;
      },
      flush: async () => {
        const result = await flushQueuedMutations();
        setRevision((value) => value + 1);
        return result;
      },
      clearConflict: (id: string) => {
        clearMobileConflict(id);
        setRevision((value) => value + 1);
      },
      discardDraft: (id: string) => {
        removeMobileDraft(id);
        setRevision((value) => value + 1);
      },
    }),
    [revision],
  );
}
