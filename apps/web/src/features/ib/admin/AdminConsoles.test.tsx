import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@k12/ui";
import { ProgrammeSettingsConsole } from "@/features/ib/admin/ProgrammeSettingsConsole";
import { RolloutConsole } from "@/features/ib/admin/RolloutConsole";
import { PilotReadinessConsole } from "@/features/ib/admin/PilotReadinessConsole";
import { validateIbPilotSetup } from "@/features/ib/admin/api";
import {
  saveIbProgrammeSetting,
  useIbPilotReadiness,
  useIbProgrammeSettings,
  useIbRolloutPayload,
} from "@/features/ib/data";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ib/settings",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/ib/data", () => ({
  useIbProgrammeSettings: vi.fn(),
  saveIbProgrammeSetting: vi.fn(async () => ({})),
  useIbRolloutPayload: vi.fn(),
  useIbPilotReadiness: vi.fn(),
}));

vi.mock("@/features/ib/admin/api", () => ({
  validateIbPilotSetup: vi.fn(async () => ({})),
}));

vi.mock("@/features/ib/admin/PilotSetupWizard", () => ({
  PilotSetupWizard: () => <div>Pilot Setup Wizard</div>,
}));

vi.mock("@/features/ib/admin/ImportOperationsConsole", () => ({
  ImportOperationsConsole: () => <div>Import Operations Console</div>,
}));

vi.mock("@/features/ib/admin/JobOperationsConsole", () => ({
  JobOperationsConsole: () => <div>Job Operations Console</div>,
}));

vi.mock("@/features/ib/admin/PilotAnalyticsConsole", () => ({
  PilotAnalyticsConsole: () => <div>Pilot Analytics Console</div>,
}));

vi.mock("@/features/ib/admin/OnboardingSupportPanel", () => ({
  OnboardingSupportPanel: () => <div>Onboarding Support Panel</div>,
}));

vi.mock("@/features/ib/phase9/Phase9Panels", () => ({
  PilotAdoptionPanel: () => <div>Pilot Adoption Panel</div>,
  MigrationConfidencePanel: () => <div>Migration Confidence Panel</div>,
  ReplacementReadinessPanel: () => <div>Replacement Readiness Panel</div>,
}));

describe("IB admin consoles", () => {
  function renderWithToast(ui: React.ReactNode) {
    return render(<ToastProvider>{ui}</ToastProvider>);
  }

  beforeEach(() => {
    vi.mocked(useIbProgrammeSettings).mockReturnValue({
      data: [
        {
          programme: "Mixed",
          inherited_from: "school",
          complete: true,
          effective: {
            cadence_mode: "weekly_digest",
            review_owner_role: "curriculum_lead",
            thresholds: {
              approval_sla_days: 5,
              review_backlog_limit: 12,
              publishing_hold_hours: 48,
              digest_batch_limit: 8,
            },
          },
        },
      ],
      mutate: vi.fn(async () => undefined),
    } as never);

    vi.mocked(useIbRolloutPayload).mockReturnValue({
      data: {
        activePack: {
          key: "ib_continuum_v1",
          version: "2026.2",
          expectedVersion: "2026.2",
          usingCurrentPack: true,
          deprecatedRecordCount: 2,
        },
        featureFlags: {
          required: [{ key: "curriculum_documents_v1", enabled: true }],
          healthy: true,
        },
        pilotBaseline: {
          packKey: "ib_continuum_v1",
          packVersion: "2026.2",
          releaseChannel: "ib-pilot",
          releaseFrozen: true,
          baselineApplied: true,
        },
        pilotSetup: {
          status: "in_progress",
          completedSteps: 5,
          totalSteps: 8,
          blockerCount: 2,
          warningCount: 1,
        },
        routeReadiness: {
          checkedCount: 10,
          canonicalCount: 9,
          fallbackCount: 1,
          healthy: false,
        },
        migrationDrift: {
          documentCount: 12,
          byPackVersion: { "2026.2": 11 },
          bySchemaKey: { "ib.pyp.unit@v2": 4 },
          missingSchemaKey: 1,
          missingRouteHintRecords: 2,
        },
        programmeSettings: {
          rows: [
            { programme: "PYP", inherited_from: "school", complete: true },
            { programme: "MYP", inherited_from: "tenant", complete: false },
          ],
          completeCount: 1,
          incompleteProgrammes: ["MYP"],
        },
        academicYear: {
          planningContextCount: 4,
          pinnedContextCount: 3,
          healthy: false,
        },
        legacyUsage: {
          legacyDocumentRoutes: 1,
          legacyOperationalRoutes: 1,
          demoRoutes: 0,
        },
      },
    } as never);

    vi.mocked(useIbPilotReadiness).mockReturnValue({
      data: {
        overallStatus: "yellow",
        sections: [
          {
            key: "programme_settings",
            title: "Programme settings",
            status: "yellow",
            summary: "One programme still needs follow-up.",
            issues: ["MYP settings incomplete"],
            rules: [
              {
                id: "settings.complete",
                severity: "warning",
                status: "fail",
                detail: "Programme settings should be explicit before pilot launch.",
                remediation: "Complete the missing programme settings in the coordinator console.",
                href: "/ib/settings",
              },
            ],
          },
          {
            key: "route_readiness",
            title: "Route readiness",
            status: "green",
            summary: "Canonical route coverage is healthy.",
            issues: [],
            rules: [],
          },
        ],
        generatedAt: new Date().toISOString(),
        staleAfterSeconds: 300,
      },
      mutate: vi.fn(async () => undefined),
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves programme settings from the coordinator console", async () => {
    renderWithToast(<ProgrammeSettingsConsole />);

    fireEvent.change(screen.getByLabelText("Approval SLA days"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save programme settings" }));

    await waitFor(() => {
      expect(saveIbProgrammeSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          programme: "Mixed",
          thresholds: expect.objectContaining({ approval_sla_days: 7 }),
        }),
      );
    });
  });

  it("renders rollout drift and legacy usage", () => {
    renderWithToast(<RolloutConsole />);

    expect(screen.getAllByText("Rollout console").length).toBeGreaterThan(0);
    expect(screen.getByText(/Deprecated pack records: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Legacy document routes: 1/)).toBeInTheDocument();
    expect(screen.getByText("Pilot Setup Wizard")).toBeInTheDocument();
    expect(screen.getByText("Import Operations Console")).toBeInTheDocument();
    expect(screen.getByText("Pilot Adoption Panel")).toBeInTheDocument();
    expect(screen.getByText("Replacement Readiness Panel")).toBeInTheDocument();
  });

  it("renders readiness issues with fix links", () => {
    renderWithToast(<PilotReadinessConsole />);

    expect(screen.getAllByText("Pilot readiness").length).toBeGreaterThan(0);
    expect(screen.getByText("MYP settings incomplete")).toBeInTheDocument();
    expect(screen.getAllByText("Open fix surface").length).toBeGreaterThan(0);
  });

  it("refreshes readiness from the operator console", async () => {
    renderWithToast(<PilotReadinessConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Refresh readiness" }));

    await waitFor(() => {
      expect(validateIbPilotSetup).toHaveBeenCalledWith("Mixed");
    });
  });
});
