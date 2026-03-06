"use client";

import { useEffect, useState } from "react";
import { AutosaveIndicator, RichTextComposer } from "@k12/ui";

interface ReflectionComposerProps {
  initialValue: string;
  onCommit: (value: string) => void;
}

export function ReflectionComposer({ initialValue, onCommit }: ReflectionComposerProps) {
  const [draft, setDraft] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    setDraft(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (draft === initialValue) return undefined;

    setStatus("saving");
    const timer = window.setTimeout(() => {
      onCommit(draft);
      setStatus("saved");
    }, 400);

    return () => window.clearTimeout(timer);
  }, [draft, initialValue, onCommit]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Reflection</p>
          <p className="text-sm text-slate-600">
            Keep reflection close to evidence so feedback and next steps stay visible.
          </p>
        </div>
        <AutosaveIndicator status={status} />
      </div>
      <RichTextComposer
        label="Student reflection"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Describe what changed, what evidence matters most, and what to improve next."
      />
    </div>
  );
}
