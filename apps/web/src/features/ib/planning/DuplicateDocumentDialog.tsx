"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

export function DuplicateDocumentDialog({
  open,
  onClose,
  sourceId,
  sourceType,
}: {
  open: boolean;
  onClose: () => void;
  sourceId: number | null;
  sourceType: "curriculum_document" | "ib_operational_record";
}) {
  const [carryForward, setCarryForward] = useState(false);
  const [title, setTitle] = useState("");
  const [resultHref, setResultHref] = useState<string | null>(null);

  if (!open || !sourceId) return null;

  async function handleDuplicate() {
    const response = await apiFetch<{ href: string }>("/api/v1/ib/document_duplications", {
      method: "POST",
      body: JSON.stringify({
        source_id: sourceId,
        source_type: sourceType,
        carry_forward: carryForward,
        title: title || undefined,
      }),
    });
    setResultHref(response.href);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-950">Duplicate or carry forward</h2>
        <p className="mt-2 text-sm text-slate-600">
          Copy the current document quickly, or carry forward its structure while resetting
          operational state.
        </p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional new title"
          className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />
        <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={carryForward}
            onChange={(event) => setCarryForward(event.target.checked)}
          />
          Reset operational state for the new copy
        </label>
        {resultHref ? (
          <a
            href={resultHref}
            className="mt-4 block rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900"
          >
            Open duplicated record
          </a>
        ) : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void handleDuplicate()}
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
