import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProgrammeSettingsConsole } from "@/features/ib/admin/ProgrammeSettingsConsole";
import { RolloutConsole } from "@/features/ib/admin/RolloutConsole";
import { PilotReadinessConsole } from "@/features/ib/admin/PilotReadinessConsole";
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

describe("IB admin consoles", () => {
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
          },
          {
            key: "route_readiness",
            title: "Route readiness",
            status: "green",
            summary: "Canonical route coverage is healthy.",
            issues: [],
          },
        ],
      },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves programme settings from the coordinator console", async () => {
    render(<ProgrammeSettingsConsole />);

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
    render(<RolloutConsole />);

    expect(screen.getByText("Rollout console")).toBeInTheDocument();
    expect(screen.getByText(/Deprecated pack records: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Legacy document routes: 1/)).toBeInTheDocument();
  });

  it("renders readiness issues with fix links", () => {
    render(<PilotReadinessConsole />);

    expect(screen.getByText("Pilot readiness")).toBeInTheDocument();
    expect(screen.getByText("MYP settings incomplete")).toBeInTheDocument();
    expect(screen.getAllByText("Open fix surface").length).toBeGreaterThan(0);
  });
});
