"use client";

import { useState } from "react";
import { QuickFeedbackChips } from "@/features/ib/specialist/QuickFeedbackChips";

export function SpecialistMobileCapture() {
  const [note, setNote] = useState("");
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Mobile capture</h2>
      <p className="mt-1 text-sm text-slate-600">
        Capture evidence or feedback between classes without opening the full teacher studio.
      </p>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        placeholder="Quick evidence or feedback note"
      />
      <div className="mt-3">
        <QuickFeedbackChips
          onSelect={(value) => setNote((current) => (current ? `${current} ${value}` : value))}
        />
      </div>
    </div>
  );
}
