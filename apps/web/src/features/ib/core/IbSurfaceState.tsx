import type { ReactNode } from "react";
import { EmptyState } from "@k12/ui";

export type IbSurfaceStatus = "ready" | "loading" | "empty" | "error" | "permission" | "offline";

interface IbSurfaceStateProps {
  status?: IbSurfaceStatus;
  ready: ReactNode;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  permissionTitle?: string;
  permissionDescription?: string;
  offlineTitle?: string;
  offlineDescription?: string;
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <section
      aria-label={label}
      className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm"
    >
      <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
      <div className="h-9 w-full animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-9 w-5/6 animate-pulse rounded-3xl bg-slate-100" />
      <div className="h-9 w-2/3 animate-pulse rounded-3xl bg-slate-100" />
    </section>
  );
}

export function IbSurfaceState({
  status = "ready",
  ready,
  loadingLabel = "Loading IB workspace",
  emptyTitle = "Nothing to show yet",
  emptyDescription = "This workspace will populate as teams start using it.",
  errorTitle = "This workspace could not load",
  errorDescription = "Retry once backend and connectivity are healthy.",
  permissionTitle = "You do not have access to this workspace",
  permissionDescription = "Ask an IB coordinator or administrator to adjust your role or school context.",
  offlineTitle = "You are offline",
  offlineDescription = "High-value quick actions stay available, but heavier data needs a connection.",
}: IbSurfaceStateProps) {
  if (status === "ready") {
    return <>{ready}</>;
  }

  if (status === "loading") {
    return <LoadingSkeleton label={loadingLabel} />;
  }

  if (status === "empty") {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  if (status === "permission") {
    return <EmptyState title={permissionTitle} description={permissionDescription} />;
  }

  if (status === "offline") {
    return <EmptyState title={offlineTitle} description={offlineDescription} />;
  }

  return <EmptyState title={errorTitle} description={errorDescription} />;
}

export function IbTonePill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "accent" | "warm" | "success" | "risk";
}) {
  const styles: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    accent: "bg-sky-100 text-sky-800",
    warm: "bg-amber-100 text-amber-900",
    success: "bg-emerald-100 text-emerald-900",
    risk: "bg-rose-100 text-rose-900",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>{label}</span>
  );
}
