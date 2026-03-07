import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@k12/ui";
import { PilotSetupWizard } from "@/features/ib/admin/PilotSetupWizard";
import { saveIbPilotSetup, useIbPilotSetup, validateIbPilotSetup } from "@/features/ib/admin/api";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/ib/admin/analytics", () => ({
  reportIbAdminEvent: vi.fn(),
}));

vi.mock("@/features/ib/admin/api", () => ({
  useIbPilotSetup: vi.fn(),
  saveIbPilotSetup: vi.fn(async () => ({})),
  applyIbPilotBaseline: vi.fn(async () => ({})),
  validateIbPilotSetup: vi.fn(async () => ({})),
  activateIbPilotSetup: vi.fn(async () => ({})),
  pauseIbPilotSetup: vi.fn(async () => ({})),
  resumeIbPilotSetup: vi.fn(async () => ({})),
}));

describe("PilotSetupWizard", () => {
  beforeEach(() => {
    vi.mocked(useIbPilotSetup).mockReturnValue({
      data: {
        programme: "Mixed",
        status: "in_progress",
        computedStatus: "blocked",
        featureFlagBundle: {},
        ownerAssignments: {
          pilot_lead_email: "lead@school.test",
          coordinator_email: "coord@school.test",
        },
        statusDetails: {
          academic_year_name: "2025-2026",
          guardian_visibility_confirmed: false,
          setup_notes: "Needs guardian review.",
        },
        generatedAt: new Date().toISOString(),
        summaryMetrics: {
          completedSteps: 2,
          totalSteps: 8,
          blockerCount: 2,
          warningCount: 1,
        },
        steps: [
          {
            key: "pack_and_flags",
            title: "Pack and flags",
            owner: "support",
            status: "red",
            blockers: ["Feature flag bundle is not fully applied."],
            warnings: [],
            details: {},
            actionHref: "/ib/rollout",
            actionLabel: "Apply baseline",
          },
          {
            key: "programme_settings",
            title: "Programme settings",
            owner: "coordinator",
            status: "yellow",
            blockers: [],
            warnings: ["Programme settings still inherit tenant defaults."],
            details: {},
            actionHref: "/ib/settings",
            actionLabel: "Open settings",
          },
        ],
        nextActions: ["Apply the baseline bundle.", "Complete programme settings."],
      },
      isLoading: false,
      mutate: vi.fn(async () => undefined),
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads saved draft data and persists operator updates", async () => {
    render(
      <ToastProvider>
        <PilotSetupWizard />
      </ToastProvider>,
    );

    expect(screen.getByDisplayValue("lead@school.test")).toBeInTheDocument();
    expect(screen.getAllByText("Feature flag bundle is not fully applied.")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Pilot lead email"), {
      target: { value: "new-lead@school.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => {
      expect(saveIbPilotSetup).toHaveBeenCalledWith(
        "Mixed",
        expect.objectContaining({
          owner_assignments: expect.objectContaining({
            pilot_lead_email: "new-lead@school.test",
          }),
        }),
      );
    });
  });

  it("revalidates setup from the wizard", async () => {
    render(
      <ToastProvider>
        <PilotSetupWizard />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Validate" }));

    await waitFor(() => {
      expect(validateIbPilotSetup).toHaveBeenCalledWith("Mixed");
    });
  });
});
