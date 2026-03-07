"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";
import { ResumeCard } from "@/features/ib/home/ResumeCard";

export function PinnedWorkPanel({
  items,
  fallbackItems,
}: {
  items: HomeLinkItem[];
  fallbackItems: HomeLinkItem[];
}) {
  const [saving, setSaving] = useState(false);

  async function pinFirstFallback() {
    const fallback = fallbackItems[0];
    if (!fallback) return;
    setSaving(true);
    try {
      await apiFetch("/api/v1/ib/workspace_preferences", {
        method: "POST",
        body: JSON.stringify({
          ib_user_workspace_preference: {
            surface: "teacher_home",
            context_key: "pins",
            preference_key: "teacher_home",
            value: { entity_refs: [fallback.entityRef].filter(Boolean) },
          },
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Pinned work</h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep the most important unit, queue, or milestone above the fold across sessions.
          </p>
        </div>
        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => void pinFirstFallback()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
            disabled={saving}
          >
            {saving ? "Pinning..." : "Pin latest"}
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        {(items.length > 0 ? items : fallbackItems.slice(0, 1)).map((item) => (
          <ResumeCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
