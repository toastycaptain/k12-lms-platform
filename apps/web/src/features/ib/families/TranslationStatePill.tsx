export function TranslationStatePill({ state }: { state: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {state.replace(/_/g, " ")}
    </span>
  );
}
