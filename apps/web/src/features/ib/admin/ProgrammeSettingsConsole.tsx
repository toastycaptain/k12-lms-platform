"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@k12/ui";
import { useIbProgrammeSettings, saveIbProgrammeSetting } from "@/features/ib/data";
import { IbSurfaceState } from "@/features/ib/core/IbSurfaceState";
import { IbCoordinatorPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const PROGRAMMES = ["Mixed", "PYP", "MYP", "DP"] as const;

function buildFormState(
  row: NonNullable<ReturnType<typeof useIbProgrammeSettings>["data"]>[number],
) {
  return {
    cadence_mode: row.effective.cadence_mode,
    review_owner_role: row.effective.review_owner_role,
    approval_sla_days: String(row.effective.thresholds.approval_sla_days ?? 5),
    review_backlog_limit: String(row.effective.thresholds.review_backlog_limit ?? 12),
    publishing_hold_hours: String(row.effective.thresholds.publishing_hold_hours ?? 48),
    digest_batch_limit: String(row.effective.thresholds.digest_batch_limit ?? 8),
  };
}

function ProgrammeSettingsForm({
  activeProgramme,
  activeRow,
  mutate,
}: {
  activeProgramme: (typeof PROGRAMMES)[number];
  activeRow: NonNullable<ReturnType<typeof useIbProgrammeSettings>["data"]>[number];
  mutate: () => Promise<unknown>;
}) {
  const [formState, setFormState] = useState(() => buildFormState(activeRow));

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        void (async () => {
          await saveIbProgrammeSetting({
            programme: activeProgramme,
            cadence_mode: formState.cadence_mode,
            review_owner_role: formState.review_owner_role,
            thresholds: {
              approval_sla_days: Number(formState.approval_sla_days),
              review_backlog_limit: Number(formState.review_backlog_limit),
              publishing_hold_hours: Number(formState.publishing_hold_hours),
              digest_batch_limit: Number(formState.digest_batch_limit),
            },
            metadata: {
              digest_default: formState.cadence_mode,
            },
          });
          await mutate();
        })();
      }}
    >
      <label className="text-sm font-medium text-slate-700">
        Cadence mode
        <select
          className="mt-2 block w-full rounded-2xl border border-slate-200 px-3 py-2"
          value={formState.cadence_mode}
          onChange={(event) =>
            setFormState((current) => ({ ...current, cadence_mode: event.target.value }))
          }
        >
          {["weekly_digest", "twice_weekly", "fortnightly", "monthly", "immediate"].map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Review owner
        <select
          className="mt-2 block w-full rounded-2xl border border-slate-200 px-3 py-2"
          value={formState.review_owner_role}
          onChange={(event) =>
            setFormState((current) => ({ ...current, review_owner_role: event.target.value }))
          }
        >
          {["curriculum_lead", "coordinator", "teacher", "advisor"].map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      {[
        ["approval_sla_days", "Approval SLA days"],
        ["review_backlog_limit", "Review backlog limit"],
        ["publishing_hold_hours", "Publishing hold hours"],
        ["digest_batch_limit", "Digest batch limit"],
      ].map(([key, label]) => (
        <label key={key} className="text-sm font-medium text-slate-700">
          {label}
          <input
            className="mt-2 block w-full rounded-2xl border border-slate-200 px-3 py-2"
            value={formState[key as keyof typeof formState]}
            onChange={(event) =>
              setFormState((current) => ({ ...current, [key]: event.target.value }))
            }
          />
        </label>
      ))}
      <div className="md:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Save programme settings
        </button>
      </div>
    </form>
  );
}

export function ProgrammeSettingsConsole() {
  const { data, mutate } = useIbProgrammeSettings();
  const [activeProgramme, setActiveProgramme] = useState<(typeof PROGRAMMES)[number]>("Mixed");
  const activeRow = useMemo(
    () => data?.find((row) => row.programme === activeProgramme),
    [activeProgramme, data],
  );

  if (!data) {
    return <IbPageLoading title="Loading programme settings..." />;
  }

  return (
    <IbCoordinatorPageShell
      title="Programme settings"
      description="Cadence, ownership, and thresholds stay visible and editable for the current school instead of hiding in seed files."
      filters={
        <SegmentedControl
          label="Programme"
          value={activeProgramme}
          onChange={(value) => setActiveProgramme(value as (typeof PROGRAMMES)[number])}
          options={PROGRAMMES.map((programme) => ({ value: programme, label: programme }))}
        />
      }
      metrics={[
        {
          label: "Programmes configured",
          value: String(data.filter((row) => row.complete).length),
          detail: "Ready for daily operation",
          tone: "success",
        },
        {
          label: "Inherited",
          value: String(data.filter((row) => row.inherited_from !== "school").length),
          detail: "Still using tenant or default values",
          tone: "warm",
        },
        {
          label: "School overrides",
          value: String(data.filter((row) => row.inherited_from === "school").length),
          detail: "Explicitly tuned here",
          tone: "accent",
        },
        { label: "Current view", value: activeProgramme, detail: "Scoped to selected programme" },
      ]}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <WorkspacePanel
          title={`${activeProgramme} controls`}
          description="Update settings with school-aware overrides and explicit thresholds."
        >
          {activeRow ? (
            <ProgrammeSettingsForm
              key={activeProgramme}
              activeProgramme={activeProgramme}
              activeRow={activeRow}
              mutate={mutate}
            />
          ) : (
            <IbSurfaceState
              status="empty"
              ready={null}
              emptyTitle="No settings found"
              emptyDescription="Create the first settings layer for this programme."
            />
          )}
        </WorkspacePanel>

        <div className="space-y-5">
          <WorkspacePanel
            title="Inheritance"
            description="See whether this programme is using a school override, a tenant default, or platform defaults."
          >
            <dl className="space-y-3 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-slate-900">Source</dt>
                <dd>{activeRow?.inherited_from || "defaults"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Effective cadence</dt>
                <dd>{activeRow?.effective.cadence_mode.replace(/_/g, " ") || "weekly digest"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Review owner</dt>
                <dd>
                  {activeRow?.effective.review_owner_role.replace(/_/g, " ") || "curriculum lead"}
                </dd>
              </div>
            </dl>
          </WorkspacePanel>
          <WorkspacePanel
            title="Operational note"
            description="Keep overrides limited to real school differences so rollout drift stays easy to inspect."
          >
            <p className="text-sm text-slate-600">
              Thresholds here feed coordinator review governance, publishing hold logic, and pilot
              readiness calculations.
            </p>
          </WorkspacePanel>
        </div>
      </div>
    </IbCoordinatorPageShell>
  );
}
