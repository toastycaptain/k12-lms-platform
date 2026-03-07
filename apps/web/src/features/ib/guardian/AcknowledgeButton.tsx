"use client";

import { apiFetch } from "@/lib/api";

export function AcknowledgeButton({ entityRef }: { entityRef: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        void apiFetch("/api/v1/ib/activity_events", {
          method: "POST",
          body: JSON.stringify({
            ib_activity_event: {
              event_name: "ib.guardian.story.acknowledged",
              event_family: "family_experience",
              surface: "family_home",
              entity_ref: entityRef,
              metadata: { title: entityRef, detail: "Acknowledged" },
            },
          }),
        })
      }
      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
    >
      Acknowledge
    </button>
  );
}
