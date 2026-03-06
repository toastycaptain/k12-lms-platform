interface AutosaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
}

const STATUS_STYLES = {
  idle: "bg-slate-100 text-slate-500",
  saving: "bg-amber-100 text-amber-800",
  saved: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
} as const;

export function AutosaveIndicator({ status, message }: AutosaveIndicatorProps) {
  const label =
    message ??
    {
      idle: "Ready",
      saving: "Saving draft",
      saved: "Saved just now",
      error: "Save issue",
    }[status];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  );
}
