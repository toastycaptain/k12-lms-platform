"use client";

import Link from "next/link";
import { useIbContext } from "@/features/ib/core/useIbContext";
import { IbWorkModeSwitch } from "@/features/ib/layout/IbWorkModeSwitch";

export function IbContextRail() {
  const {
    active,
    breadcrumbs,
    currentLabel,
    currentProgramme,
    currentSchoolLabel,
    currentWorkMode,
    recentItems,
  } = useIbContext();

  if (!active) {
    return null;
  }

  return (
    <section
      aria-label="IB context rail"
      className="rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-sm"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-2 text-slate-500">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                <Link
                  href={item.href}
                  className={`rounded-full px-2 py-1 ${
                    index === breadcrumbs.length - 1
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              </span>
            ))}
          </nav>

          <div className="mt-3 flex flex-wrap gap-2">
            {currentSchoolLabel ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {currentSchoolLabel}
              </span>
            ) : null}
            {currentProgramme ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                {currentProgramme}
              </span>
            ) : null}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {currentWorkMode}
            </span>
            {currentLabel ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                {currentLabel}
              </span>
            ) : null}
          </div>

          {recentItems.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Continue
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <IbWorkModeSwitch />
      </div>
    </section>
  );
}
