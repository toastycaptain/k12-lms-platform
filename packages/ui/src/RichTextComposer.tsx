import type { TextareaHTMLAttributes } from "react";

interface RichTextComposerProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function RichTextComposer({
  label = "Composer",
  className = "",
  ...props
}: RichTextComposerProps) {
  return (
    <label className="block rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <div className="mt-3 flex gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1">Bold</span>
        <span className="rounded-full bg-slate-100 px-2 py-1">List</span>
        <span className="rounded-full bg-slate-100 px-2 py-1">Reflection</span>
      </div>
      <textarea
        {...props}
        className={`mt-3 min-h-[9rem] w-full resize-y border-none bg-transparent text-sm text-slate-700 outline-none ${className}`}
      />
    </label>
  );
}
