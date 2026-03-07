export function HandoffStatePill({ state }: { state: string }) {
  const tone =
    state === "blocked"
      ? "bg-rose-100 text-rose-900"
      : state === "awaiting_response"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-900";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone}`}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}
