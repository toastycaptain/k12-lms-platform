"use client";

import { reportIbAdminEvent } from "@/features/ib/admin/analytics";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const SUPPORT_ITEMS = [
  {
    title: "Single-school pilot launch",
    href: "/ib/rollout",
    detail: "Use this when one school is moving from setup to its first real pilot cohort.",
  },
  {
    title: "Rollback and recovery",
    href: "/ib/readiness",
    detail:
      "Use this when exports, publishing, pack drift, or import execution need controlled recovery.",
  },
  {
    title: "Pilot baseline",
    href: "/ib/settings",
    detail:
      "Use this to verify the sanctioned flag bundle and frozen pack contract before go-live.",
  },
];

export function OnboardingSupportPanel() {
  return (
    <WorkspacePanel
      title="Onboarding and support"
      description="Guided setup copy, operator runbooks, and training prompts live next to the rollout controls instead of in tribal knowledge."
    >
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-lg font-semibold text-slate-950">Guided first-run checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Apply the pilot baseline before checking any readiness blocker.</li>
            <li>Confirm coordinator ownership and academic year pinning before staging imports.</li>
            <li>Dry-run imports before enabling pilot traffic or family publishing.</li>
            <li>
              Use the analytics panel during launch week to separate friction from one-off setup
              noise.
            </li>
          </ul>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {SUPPORT_ITEMS.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
            </a>
          ))}
        </div>

        <div className="space-y-3">
          <details
            className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                reportIbAdminEvent("ib_help_opened", { topic: "setup_wizard" });
              }
            }}
          >
            <summary className="cursor-pointer text-sm font-semibold text-slate-950">
              Why does the wizard ask for owner emails instead of IDs?
            </summary>
            <p className="mt-3 text-sm text-slate-600">
              Pilot operators should be able to resolve owners from real-school language. The
              backend keeps internal IDs hidden until resolution is safe and explicit.
            </p>
          </details>
          <details
            className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3"
            onToggle={(event) => {
              if ((event.currentTarget as HTMLDetailsElement).open) {
                reportIbAdminEvent("ib_help_opened", { topic: "imports" });
              }
            }}
          >
            <summary className="cursor-pointer text-sm font-semibold text-slate-950">
              When should an import be rolled back?
            </summary>
            <p className="mt-3 text-sm text-slate-600">
              Roll back draft-only creations when dry-run assumptions were wrong, mapping crossed
              school/programme boundaries, or the imported data needs correction before teachers
              start editing it.
            </p>
          </details>
        </div>
      </div>
    </WorkspacePanel>
  );
}
