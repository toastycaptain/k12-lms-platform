"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { readOfflineStore, writeOfflineStore } from "@/features/ib/offline/offlineStore";
import { useIbMutationQueue } from "@/features/ib/offline/useIbMutationQueue";

export function useSectionAutosave({
  documentId,
  title,
  content,
  baseVersionId,
  enabled = true,
}: {
  documentId: number | null;
  title: string;
  content: Record<string, unknown>;
  baseVersionId: number | null;
  enabled?: boolean;
}) {
  const key = useMemo(() => (documentId ? `autosave.${documentId}` : null), [documentId]);
  const [state, setState] = useState<
    "idle" | "saving" | "saved" | "offline" | "conflict" | "error"
  >("idle");
  const queue = useIbMutationQueue();
  const didHydrate = useRef(false);
  const restoredDraft = useMemo(
    () => (key ? readOfflineStore<Record<string, unknown> | null>(key, null) : null),
    [key],
  );

  useEffect(() => {
    didHydrate.current = false;
    const handle = window.setTimeout(() => setState("idle"), 0);

    return () => window.clearTimeout(handle);
  }, [key]);

  useEffect(() => {
    if (!documentId || !enabled) {
      return;
    }

    if (!didHydrate.current) {
      didHydrate.current = true;
      return;
    }

    const handle = window.setTimeout(async () => {
      setState("saving");
      const body = JSON.stringify({
        section_autosave: {
          title,
          base_version_id: baseVersionId,
          content,
        },
      });
      try {
        await apiFetch(`/api/v1/ib/section_autosaves?curriculum_document_id=${documentId}`, {
          method: "POST",
          body,
        });
        if (key) writeOfflineStore(key, content);
        setState("saved");
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("conflict")) {
          setState("conflict");
          return;
        }
        queue.enqueue({
          url: `/api/v1/ib/section_autosaves?curriculum_document_id=${documentId}`,
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
        });
        setState("offline");
      }
    }, 700);

    return () => window.clearTimeout(handle);
  }, [baseVersionId, content, documentId, enabled, key, queue, title]);

  return {
    state: !documentId || !enabled ? "idle" : state,
    restoredDraft,
    queuedCount: queue.queuedCount,
    flushQueue: queue.flush,
    clearConflict: () => setState("idle"),
  };
}
