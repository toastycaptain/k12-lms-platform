"use client";

import Link from "next/link";
import { VirtualDataGrid } from "@k12/ui";
import { ImportOperationsConsole } from "@/features/ib/admin/ImportOperationsConsole";
import { JobOperationsConsole } from "@/features/ib/admin/JobOperationsConsole";
import { OnboardingSupportPanel } from "@/features/ib/admin/OnboardingSupportPanel";
import { PilotAnalyticsConsole } from "@/features/ib/admin/PilotAnalyticsConsole";
import { PilotSetupWizard } from "@/features/ib/admin/PilotSetupWizard";
import { useIbRolloutPayload } from "@/features/ib/data";
import { MobileTriageTray } from "@/features/ib/mobile/MobileTriageTray";
import { IB_CANONICAL_ROUTES } from "@/features/ib/routes/registry";
import { IbCoordinatorPageShell, IbPageLoading } from "@/features/ib/layout/IbPageShell";
import { WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export function RolloutConsole() {
  const { data } = useIbRolloutPayload();

  if (!data) {
    return <IbPageLoading title="Loading rollout console..." />;
  }

  return (
    <IbCoordinatorPageShell
      title="Rollout console"
      description="Inspect pack version, route readiness, legacy usage, and settings completeness before pilot traffic increases."
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
          detail: "Required Phase 6 flags",
          tone: data.featureFlags.healthy ? "success" : "warm",
        },
        {
          label: "Baseline",
          value: data.pilotBaseline?.releaseFrozen ? "Frozen" : "Open",
          detail: data.pilotBaseline
            ? `${data.pilotBaseline.packKey}@${data.pilotBaseline.packVersion}`
            : "Baseline not applied",
          tone: data.pilotBaseline?.releaseFrozen ? "success" : "warm",
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
        description="On mobile, keep the frozen baseline, setup blockers, and import pipeline visible."
        items={[
          {
            id: "pilot-setup",
            label: "Pilot setup wizard",
            detail: `${data.pilotSetup?.blockerCount || 0} blockers and ${data.pilotSetup?.warningCount || 0} warnings`,
            href: IB_CANONICAL_ROUTES.rollout,
            status: (data.pilotSetup?.blockerCount || 0) > 0 ? "retry" : "saved",
          },
          {
            id: "readiness",
            label: "Pilot readiness",
            detail: `${data.routeReadiness.fallbackCount} fallback routes still need cleanup`,
            href: IB_CANONICAL_ROUTES.readiness,
            status: data.routeReadiness.healthy ? "saved" : "pending",
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
          title="Required flags"
          description="Phase 5 surfaces stay explicit about what is enabled for this tenant."
        >
          <VirtualDataGrid
            columns={[
              { key: "flag", header: "Flag" },
              { key: "state", header: "State" },
            ]}
            rows={data.featureFlags.required.map((flag) => ({
              flag: flag.key,
              state: flag.enabled ? "Enabled" : "Disabled",
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
