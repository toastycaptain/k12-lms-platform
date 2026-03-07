"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, useToast } from "@k12/ui";
import {
  activateIbPilotSetup,
  applyIbPilotBaseline,
  pauseIbPilotSetup,
  resumeIbPilotSetup,
  saveIbPilotSetup,
  useIbPilotSetup,
  validateIbPilotSetup,
  type PilotSetupStep,
} from "@/features/ib/admin/api";
import { reportIbAdminEvent } from "@/features/ib/admin/analytics";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

const STATUS_STYLES: Record<PilotSetupStep["status"], string> = {
  green: "bg-emerald-100 text-emerald-900",
  yellow: "bg-amber-100 text-amber-900",
  red: "bg-rose-100 text-rose-900",
};

const PROGRAMMES = ["Mixed", "PYP", "MYP", "DP"] as const;

interface DraftState {
  pilotLeadEmail: string;
  coordinatorEmail: string;
  academicYearName: string;
  notificationOwner: string;
  exportOwner: string;
  guardianVisibilityConfirmed: boolean;
  setupNotes: string;
}

function draftFromPayload(
  payload: Record<string, unknown>,
  owners: Record<string, unknown>,
): DraftState {
  return {
    pilotLeadEmail: String(owners.pilot_lead_email || ""),
    coordinatorEmail: String(owners.coordinator_email || ""),
    academicYearName: String(payload.academic_year_name || ""),
    notificationOwner: String(owners.notification_owner || ""),
    exportOwner: String(owners.export_owner || ""),
    guardianVisibilityConfirmed: Boolean(payload.guardian_visibility_confirmed),
    setupNotes: String(payload.setup_notes || ""),
  };
}

export function PilotSetupWizard() {
  const { addToast } = useToast();
  const [programme, setProgramme] = useState<(typeof PROGRAMMES)[number]>("Mixed");
  const { data, mutate, isLoading } = useIbPilotSetup(programme);
  const [draft, setDraft] = useState<DraftState>({
    pilotLeadEmail: "",
    coordinatorEmail: "",
    academicYearName: "",
    notificationOwner: "",
    exportOwner: "",
    guardianVisibilityConfirmed: false,
    setupNotes: "",
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [selectedStepKey, setSelectedStepKey] = useState<string | null>(null);

  useEffect(() => {
    if (!data || dirty) return;
    setDraft(draftFromPayload(data.statusDetails, data.ownerAssignments));
    setSelectedStepKey(
      (current) =>
        current ||
        data.steps.find((step) => step.status !== "green")?.key ||
        data.steps[0]?.key ||
        null,
    );
  }, [data, dirty]);

  const selectedStep =
    data?.steps.find((step) => step.key === selectedStepKey) ||
    data?.steps.find((step) => step.status !== "green") ||
    data?.steps[0] ||
    null;

  const progressPercent = useMemo(() => {
    if (!data || data.summaryMetrics.totalSteps === 0) return 0;
    return Math.round((data.summaryMetrics.completedSteps / data.summaryMetrics.totalSteps) * 100);
  }, [data]);

  async function persistDraft() {
    setSaving(true);
    try {
      await saveIbPilotSetup(programme, {
        owner_assignments: {
          pilot_lead_email: draft.pilotLeadEmail,
          coordinator_email: draft.coordinatorEmail,
          notification_owner: draft.notificationOwner,
          export_owner: draft.exportOwner,
        },
        status_details: {
          academic_year_name: draft.academicYearName,
          guardian_visibility_confirmed: draft.guardianVisibilityConfirmed,
          setup_notes: draft.setupNotes,
        },
      });
      reportIbAdminEvent("ib_pilot_setup_saved", { programme });
      addToast("success", "Pilot setup draft saved.");
      setDirty(false);
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Unable to save pilot setup.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(key: string, action: () => Promise<unknown>, successMessage: string) {
    setActionKey(key);
    try {
      await action();
      reportIbAdminEvent(key, { programme });
      addToast("success", successMessage);
      setDirty(false);
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : "Pilot setup action failed.");
    } finally {
      setActionKey(null);
    }
  }

  if (isLoading && !data) {
    return (
      <WorkspacePanel
        title="Pilot setup wizard"
        description="Loading the governed pilot setup workflow."
      >
        <p className="text-sm text-slate-600">Loading setup state…</p>
      </WorkspacePanel>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <WorkspacePanel
      title="Pilot setup wizard"
      description="Move a school from empty pilot setup to validated launch readiness without shell access."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <label
              htmlFor="pilot-setup-programme-scope"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Programme scope
            </label>
            <select
              id="pilot-setup-programme-scope"
              aria-label="Programme scope"
              value={programme}
              onChange={(event) => {
                setProgramme(event.target.value as (typeof PROGRAMMES)[number]);
                setDirty(false);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900"
            >
              {PROGRAMMES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[16rem] flex-1 rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Progress</span>
              <span className="font-semibold text-slate-950">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-slate-900 transition-[width]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {data.summaryMetrics.completedSteps} of {data.summaryMetrics.totalSteps} setup steps
              are currently green.
            </p>
          </div>
        </div>

        {dirty ? (
          <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Draft changes are unsaved. Save the setup draft before leaving this surface if you want
            resume state preserved for the next operator.
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.9fr)]">
          <div className="space-y-3">
            {data.steps.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => {
                  setSelectedStepKey(step.key);
                  reportIbAdminEvent("ib_pilot_setup_step_opened", { programme, step: step.key });
                }}
                className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition ${
                  selectedStep?.key === step.key
                    ? "border-slate-900 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-950 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p
                      className={`mt-1 text-xs ${selectedStep?.key === step.key ? "text-slate-300" : "text-slate-500"}`}
                    >
                      Owner: {step.owner.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      selectedStep?.key === step.key
                        ? "bg-white/15 text-white"
                        : STATUS_STYLES[step.status]
                    }`}
                  >
                    {step.status}
                  </span>
                </div>
                {step.blockers.length > 0 ? (
                  <p
                    className={`mt-3 text-sm ${selectedStep?.key === step.key ? "text-rose-100" : "text-rose-700"}`}
                  >
                    {step.blockers[0]}
                  </p>
                ) : step.warnings.length > 0 ? (
                  <p
                    className={`mt-3 text-sm ${selectedStep?.key === step.key ? "text-amber-100" : "text-amber-700"}`}
                  >
                    {step.warnings[0]}
                  </p>
                ) : (
                  <p
                    className={`mt-3 text-sm ${selectedStep?.key === step.key ? "text-slate-300" : "text-slate-500"}`}
                  >
                    No blockers are currently attached to this step.
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950">
                  {selectedStep?.title || "Setup detail"}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${selectedStep ? STATUS_STYLES[selectedStep.status] : STATUS_STYLES.yellow}`}
                >
                  {data.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Edit the operational fields below, then validate to recompute live blockers from the
                backend rules engine.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Pilot lead email</span>
                <input
                  value={draft.pilotLeadEmail}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, pilotLeadEmail: event.target.value }));
                    setDirty(true);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Coordinator email</span>
                <input
                  value={draft.coordinatorEmail}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, coordinatorEmail: event.target.value }));
                    setDirty(true);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Academic year label</span>
                <input
                  value={draft.academicYearName}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, academicYearName: event.target.value }));
                    setDirty(true);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span className="font-medium">Notification owner</span>
                <input
                  value={draft.notificationOwner}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, notificationOwner: event.target.value }));
                    setDirty(true);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Export / job owner</span>
                <input
                  value={draft.exportOwner}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, exportOwner: event.target.value }));
                    setDirty(true);
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.guardianVisibilityConfirmed}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      guardianVisibilityConfirmed: event.target.checked,
                    }));
                    setDirty(true);
                  }}
                />
                Guardian visibility has been explicitly reviewed for this pilot.
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                <span className="font-medium">Operator notes</span>
                <textarea
                  value={draft.setupNotes}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, setupNotes: event.target.value }));
                    setDirty(true);
                  }}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
              </label>
            </div>

            {selectedStep?.blockers.length || selectedStep?.warnings.length ? (
              <div className="space-y-2">
                {[...selectedStep.blockers, ...selectedStep.warnings].map((issue) => (
                  <p
                    key={issue}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                  >
                    {issue}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                Previewed effect of the next validation
              </p>
              <ul className="mt-2 space-y-1">
                <li>Owner fields feed the roles-and-owners and exports-and-jobs checks.</li>
                <li>
                  Academic year and guardian confirmations feed setup evidence visible to support
                  staff.
                </li>
                <li>
                  Applying the baseline reasserts the frozen pack and required Phase 6 flags for
                  this tenant.
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void persistDraft()} disabled={saving}>
                {saving ? "Saving..." : "Save draft"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "ib_pilot_setup_baseline",
                    () => applyIbPilotBaseline(programme),
                    "Pilot baseline applied.",
                  )
                }
                disabled={actionKey !== null}
              >
                {actionKey === "ib_pilot_setup_baseline" ? "Applying..." : "Apply baseline"}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "ib_pilot_setup_validate",
                    () => validateIbPilotSetup(programme),
                    "Pilot setup validated.",
                  )
                }
                disabled={actionKey !== null}
              >
                {actionKey === "ib_pilot_setup_validate" ? "Validating..." : "Validate"}
              </Button>
              {data.status === "paused" ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "ib_pilot_setup_resume",
                      () => resumeIbPilotSetup(programme),
                      "Pilot setup resumed.",
                    )
                  }
                  disabled={actionKey !== null}
                >
                  {actionKey === "ib_pilot_setup_resume" ? "Resuming..." : "Resume"}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() =>
                    void runAction(
                      "ib_pilot_setup_pause",
                      () =>
                        pauseIbPilotSetup(
                          programme,
                          "Paused from rollout console for operator follow-up.",
                        ),
                      "Pilot setup paused.",
                    )
                  }
                  disabled={actionKey !== null}
                >
                  {actionKey === "ib_pilot_setup_pause" ? "Pausing..." : "Pause"}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() =>
                  void runAction(
                    "ib_pilot_setup_activate",
                    () => activateIbPilotSetup(programme),
                    "Pilot setup activated.",
                  )
                }
                disabled={actionKey !== null}
              >
                {actionKey === "ib_pilot_setup_activate" ? "Activating..." : "Activate"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/ib/readiness"
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open readiness checklist
              </Link>
              <Link
                href="/ib/settings"
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open programme settings
              </Link>
              <Link
                href="/ib/operations"
                className="font-semibold text-slate-900 underline-offset-4 hover:underline"
              >
                Open operations follow-up
              </Link>
            </div>
          </div>
        </div>

        {data.nextActions.length > 0 ? (
          <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4">
            <h4 className="text-sm font-semibold text-slate-950">Immediate next actions</h4>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {data.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WorkspacePanel>
  );
}
