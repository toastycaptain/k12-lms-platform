"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function FamilyResponseComposer({ entityRef }: { entityRef: string }) {
  const [value, setValue] = useState("");
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Family response</h2>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={3}
        className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        placeholder="Share a short, moderated response"
      />
      <button
        type="button"
        onClick={() =>
          void apiFetch("/api/v1/ib/activity_events", {
            method: "POST",
            body: JSON.stringify({
              ib_activity_event: {
                event_name: "ib.guardian.response.shared",
                event_family: "family_experience",
                surface: "family_home",
                entity_ref: entityRef,
                metadata: { title: entityRef, detail: value },
              },
            }),
          })
        }
        className="mt-3 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
      >
        Send response
      </button>
    </div>
  );
}
