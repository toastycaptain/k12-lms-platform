"use client";

import { useState } from "react";

export function ReflectionComposer({
  prompts,
}: {
  prompts: Array<{ key: string; title: string; prompt: string }>;
}) {
  const [value, setValue] = useState("");
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Reflection composer</h2>
      <p className="mt-1 text-sm text-slate-600">
        Structured prompts keep reflection focused and age-appropriate.
      </p>
      <div className="mt-4 space-y-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.key}
            type="button"
            onClick={() => setValue(prompt.prompt)}
            className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <span className="font-semibold text-slate-950">{prompt.title}</span>
            <span className="mt-1 block">{prompt.prompt}</span>
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        placeholder="Capture a reflection"
      />
    </div>
  );
}
