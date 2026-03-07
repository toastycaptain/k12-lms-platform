"use client";

import Link from "next/link";

export interface OperationalChecklistRule {
  id: string;
  severity: "info" | "warning" | "blocker";
  status: "pass" | "fail";
  detail: string;
  remediation: string;
  href: string;
}

export interface OperationalChecklistPanelProps {
  title: string;
  summary: string;
  owner: string;
  status: "green" | "yellow" | "red";
  issues: string[];
  rules: OperationalChecklistRule[];
  severityFilter?: "all" | "blocker" | "warning" | "info";
  fixHref: string;
}

export function OperationalChecklistPanel({
  title,
  summary,
  owner,
  status,
  issues,
  rules,
  severityFilter = "all",
  fixHref,
}: OperationalChecklistPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{summary}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "green"
              ? "bg-emerald-100 text-emerald-900"
              : status === "yellow"
                ? "bg-amber-100 text-amber-900"
                : "bg-rose-100 text-rose-900"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Owner: {owner.replace(/_/g, " ")}
        </p>
        <Link
          href={fixHref}
          className="text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
        >
          Open fix surface
        </Link>
      </div>

      {issues.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          {issues.map((issue) => (
            <li key={issue} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {issue}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          No blocking issues are currently surfacing for this section.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {rules
          .filter((rule) => severityFilter === "all" || rule.severity === severityFilter)
          .map((rule) => (
            <div
              key={rule.id}
              className="rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{rule.id}</p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    rule.status === "pass"
                      ? "bg-emerald-100 text-emerald-900"
                      : rule.severity === "blocker"
                        ? "bg-rose-100 text-rose-900"
                        : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{rule.detail}</p>
              <p className="mt-2 text-sm text-slate-700">{rule.remediation}</p>
              <Link
                href={rule.href}
                className="mt-3 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open remediation
              </Link>
            </div>
          ))}
      </div>
    </section>
  );
}
