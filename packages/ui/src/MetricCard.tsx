interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "accent" | "warm" | "success" | "risk";
}

const METRIC_TONES = {
  default: "from-white to-slate-50",
  accent: "from-sky-50 to-white",
  warm: "from-amber-50 to-white",
  success: "from-emerald-50 to-white",
  risk: "from-rose-50 to-white",
} as const;

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: MetricCardProps) {
  return (
    <article className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${METRIC_TONES[tone]} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </article>
  );
}
