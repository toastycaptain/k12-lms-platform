"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, VirtualDataGrid, useToast } from "@k12/ui";
import {
  certifyIbReleaseBaseline,
  rollbackIbReleaseBaseline,
  verifyIbReleaseBaseline,
} from "@/features/ib/admin/api";
import { ImportOperationsConsole } from "@/features/ib/admin/ImportOperationsConsole";
import { JobOperationsConsole } from "@/features/ib/admin/JobOperationsConsole";
import { OnboardingSupportPanel } from "@/features/ib/admin/OnboardingSupportPanel";
import { PilotAnalyticsConsole } from "@/features/ib/admin/PilotAnalyticsConsole";
import { PilotSetupWizard } from "@/features/ib/admin/PilotSetupWizard";
import { useIbRolloutPayload } from "@/features/ib/data";
import { IbCoordinatorPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function RolloutConsole() {
  const { addToast } = useToast();
  const { data, mutate } = useIbRolloutPayload();
  const [baselineAction, setBaselineAction] = useState<"verify" | "certify" | "rollback" | null>(
    null,
  );

  if (!data) {
    return <IbPageLoading title="Loading rollout console..." />;
  }

  async function runBaselineAction(action: "verify" | "certify" | "rollback") {
    setBaselineAction(action);
    try {
      if (action === "verify") {
        await verifyIbReleaseBaseline();
      } else if (action === "certify") {
        await certifyIbReleaseBaseline();
      } else {
        await rollbackIbReleaseBaseline();
      }
      addToast("success", `Release baseline ${action} completed.`);
      await mutate();
    } catch (error) {
      addToast("error", error instanceof Error ? error.message : `Unable to ${action} baseline.`);
    } finally {
      setBaselineAction(null);
    }
  }

  return (
    <IbCoordinatorPageShell
      title="Rollout console"
      description="Inspect pack version, bundle dependencies, migration readiness, and release certification before widening rollout."
      metrics={[
        {
          label: "Pack",
          value: `${data.activePack.key}@${data.activePack.version}`,
          detail: `Expected ${data.activePack.expectedVersion}`,
          tone: data.activePack.usingCurrentPack ? "success" : "warm",
        },
        {
          label: "Flags enabled",
          value: String(data.featureFlags.required.filter((flag) => flag.enabled).length),
          detail: "Required Phase 8 flags",
          tone: data.featureFlags.healthy ? "success" : "warm",
        },
        {
          label: "Baseline",
          value: data.releaseBaseline?.status?.toUpperCase() || "DRAFT",
          detail: data.releaseBaseline
            ? `${data.releaseBaseline.packKey}@${data.releaseBaseline.packVersion}`
            : "Baseline not generated",
          tone: data.releaseBaseline?.blockers?.length ? "risk" : "success",
        },
        {
          label: "Canonical routes",
          value: `${data.routeReadiness.canonicalCount}/${data.routeReadiness.checkedCount}`,
          detail: "Sampled route coverage",
          tone: data.routeReadiness.healthy ? "success" : "warm",
        },
        {
          label: "Setup blockers",
          value: String(data.pilotSetup?.blockerCount || 0),
          detail: `${data.pilotSetup?.completedSteps || 0}/${data.pilotSetup?.totalSteps || 0} steps green`,
          tone: (data.pilotSetup?.blockerCount || 0) > 0 ? "risk" : "success",
        },
      ]}
    >
      <MobileTriageTray
        title="Rollout quick actions"
        description="On mobile, keep baseline blockers, setup blockers, and import risk visible."
        items={[
          {
            id: "release-baseline",
            label: "GA baseline",
            detail: `${data.releaseBaseline?.blockers?.length || 0} blocker(s) currently visible`,
            href: IB_CANONICAL_ROUTES.rollout,
            status: (data.releaseBaseline?.blockers?.length || 0) > 0 ? "retry" : "saved",
          },
          {
            id: "pilot-setup",
            label: "Pilot setup wizard",
            detail: `${data.pilotSetup?.blockerCount || 0} blockers and ${data.pilotSetup?.warningCount || 0} warnings`,
            href: IB_CANONICAL_ROUTES.rollout,
            status: (data.pilotSetup?.blockerCount || 0) > 0 ? "retry" : "saved",
          },
          {
            id: "publishing",
            label: "Publishing queue",
            detail: "Open the family publishing queue for held or launch-day items.",
            href: IB_CANONICAL_ROUTES.familiesPublishing,
            status: "pending",
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <WorkspacePanel
          title="GA baseline"
          description="Certification stays explicit: pack, CI, migration, and readiness checks are visible together."
        >
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-[1.25rem] bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">
                Status: {data.releaseBaseline?.status?.replace(/_/g, " ") || "draft"}
              </p>
              <p className="mt-2">
                {data.releaseBaseline?.blockers?.length
                  ? `${data.releaseBaseline.blockers.length} blocker(s) remain before GA candidate sign-off.`
                  : "No current baseline blockers."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void runBaselineAction("verify")}
                disabled={baselineAction !== null}
              >
                {baselineAction === "verify" ? "Verifying..." : "Verify baseline"}
              </Button>
              <Button
                onClick={() => void runBaselineAction("certify")}
                disabled={
                  baselineAction !== null || Boolean(data.releaseBaseline?.blockers?.length)
                }
              >
                {baselineAction === "certify" ? "Certifying..." : "Certify GA candidate"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => void runBaselineAction("rollback")}
                disabled={baselineAction !== null}
              >
                {baselineAction === "rollback" ? "Rolling back..." : "Rollback baseline"}
              </Button>
            </div>
            <ul className="space-y-2">
              {data.releaseBaseline?.blockers?.length ? (
                data.releaseBaseline.blockers.map((blocker) => (
                  <li key={blocker.key} className="rounded-2xl bg-rose-50 px-3 py-2 text-rose-900">
                    <span className="font-semibold">{blocker.key}</span>: {blocker.detail}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-900">
                  Baseline verification is currently clear.
                </li>
              )}
            </ul>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          title="Required flags"
          description="Phase 8 adds bundle ownership, dependency health, and kill-switch visibility."
        >
          <VirtualDataGrid
            columns={[
              { key: "flag", header: "Flag" },
              { key: "bundle", header: "Bundle" },
              { key: "state", header: "State" },
              { key: "stage", header: "Stage" },
            ]}
            rows={(data.featureFlags.inventory || []).map((flag) => ({
              flag: flag.key,
              bundle: flag.bundle,
              state: flag.enabled ? "Enabled" : "Disabled",
              stage: flag.stage,
            }))}
          />
        </WorkspacePanel>

        <WorkspacePanel
          title="Migration drift"
          description="These counts expose older pack/schema records instead of hiding migration state."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Deprecated pack records: {data.activePack.deprecatedRecordCount}</li>
            <li>Missing schema keys: {data.migrationDrift.missingSchemaKey}</li>
            <li>Missing route hints: {data.migrationDrift.missingRouteHintRecords}</li>
            <li>
              Unpinned planning contexts:{" "}
              {Math.max(
                0,
                data.academicYear.planningContextCount - data.academicYear.pinnedContextCount,
              )}
            </li>
          </ul>
        </WorkspacePanel>

        <WorkspacePanel
          title="Settings completeness"
          description="Programme settings need to be complete before the governance console can be trusted."
        >
          <VirtualDataGrid
            columns={[
              { key: "programme", header: "Programme" },
              { key: "source", header: "Source" },
              { key: "complete", header: "Complete" },
            ]}
            rows={data.programmeSettings.rows.map((row) => ({
              programme: row.programme,
              source: row.inherited_from,
              complete: row.complete ? "Yes" : "Needs work",
            }))}
          />
          <Link
            href={IB_CANONICAL_ROUTES.settings}
            className="mt-4 inline-flex text-sm font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            Open programme settings
          </Link>
        </WorkspacePanel>

        <WorkspacePanel
          title="Legacy usage"
          description="This is the remaining cutover backlog from generic planning surfaces into the documents-only IB route family."
        >
          <ul className="space-y-3 text-sm text-slate-600">
            <li>Legacy document routes: {data.legacyUsage.legacyDocumentRoutes}</li>
            <li>Legacy operational routes: {data.legacyUsage.legacyOperationalRoutes}</li>
            <li>Demo routes: {data.legacyUsage.demoRoutes}</li>
          </ul>
        </WorkspacePanel>
      </div>

      <div className="mt-5 space-y-5">
        <PilotSetupWizard />
        <ImportOperationsConsole />
        <JobOperationsConsole />
        <PilotAnalyticsConsole />
        <OnboardingSupportPanel />
      </div>
    </IbCoordinatorPageShell>
  );
}
