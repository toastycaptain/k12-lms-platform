import type { ReactNode } from "react";

interface DockedInspectorProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function DockedInspector({ title, description, children }: DockedInspectorProps) {
  return (
    <aside className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </aside>
  );
}
