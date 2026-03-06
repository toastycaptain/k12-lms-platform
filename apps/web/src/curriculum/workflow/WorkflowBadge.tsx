export default function WorkflowBadge({ state }: { state: string }) {
  const normalized = state.toLowerCase();
  const colors: Record<string, string> = {
    draft: "bg-amber-100 text-amber-800",
    pending_approval: "bg-orange-100 text-orange-800",
    published: "bg-emerald-100 text-emerald-800",
    approved: "bg-emerald-100 text-emerald-800",
    archived: "bg-slate-100 text-slate-700",
    rejected: "bg-rose-100 text-rose-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[normalized] || "bg-slate-100 text-slate-700"}`}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
