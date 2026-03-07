export function EvidenceQualityBadge({ value }: { value: string }) {
  const tone =
    value === "strong"
      ? "bg-emerald-100 text-emerald-900"
      : value === "developing"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
