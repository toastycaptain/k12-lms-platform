export function SaveStatePill({
  state,
}: {
  state: "idle" | "saving" | "saved" | "offline" | "conflict" | "error";
}) {
  const styles: Record<typeof state, string> = {
    idle: "bg-slate-100 text-slate-700",
    saving: "bg-amber-100 text-amber-900",
    saved: "bg-emerald-100 text-emerald-900",
    offline: "bg-sky-100 text-sky-900",
    conflict: "bg-rose-100 text-rose-900",
    error: "bg-rose-100 text-rose-900",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[state]}`}>
      {state === "idle" ? "Ready" : state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  );
}
