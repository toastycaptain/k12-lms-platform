"use client";

import Link from "next/link";
import { useIbPilotReadiness } from "@/features/ib/data";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbCoordinatorPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const STATUS_TONE = {
  green: "success",
  yellow: "warm",
  red: "risk",
} as const;

export function PilotReadinessConsole() {
  const { data } = useIbPilotReadiness();

  if (!data) {
    return <IbPageLoading title="Loading pilot readiness..." />;
  }

  return (
    <IbCoordinatorPageShell
      title="Pilot readiness"
      description="One place to decide whether the current school is ready for IB pilot traffic, and what still needs remediation."
      metrics={[
        {
          label: "Overall",
          value: data.overallStatus.toUpperCase(),
          detail: "Explainable readiness state",
          tone: STATUS_TONE[data.overallStatus],
        },
        {
          label: "Green sections",
          value: String(data.sections.filter((section) => section.status === "green").length),
          detail: "Ready without intervention",
          tone: "success",
        },
        {
          label: "Watch sections",
          value: String(data.sections.filter((section) => section.status === "yellow").length),
          detail: "Need follow-up before pilot grows",
          tone: "warm",
        },
        {
          label: "Blocked sections",
          value: String(data.sections.filter((section) => section.status === "red").length),
          detail: "Should stop launch",
          tone: "risk",
        },
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-2">
        {data.sections.map((section) => (
          <WorkspacePanel key={section.key} title={section.title} description={section.summary}>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  section.status === "green"
                    ? "bg-emerald-100 text-emerald-900"
                    : section.status === "yellow"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-rose-100 text-rose-900"
                }`}
              >
                {section.status}
              </span>
              <Link
                href={
                  section.key === "programme_settings"
                    ? IB_CANONICAL_ROUTES.settings
                    : section.key === "route_readiness"
                      ? IB_CANONICAL_ROUTES.rollout
                      : IB_CANONICAL_ROUTES.operations
                }
                className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open fix surface
              </Link>
            </div>
            {section.issues.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {section.issues.map((issue) => (
                  <li
                    key={issue}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    {issue}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                No blocking issues are currently surfacing for this section.
              </p>
            )}
          </WorkspacePanel>
        ))}
      </div>
    </IbCoordinatorPageShell>
  );
}
