import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { JobOperationsConsole } from "@/features/ib/admin/JobOperationsConsole";

const mocks = vi.hoisted(() => ({
  addToast: vi.fn(),
  replayIbJobOperation: vi.fn(),
  cancelIbJobOperation: vi.fn(),
  backfillIbJobOperations: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    useToast: () => ({ addToast: mocks.addToast }),
  };
});

vi.mock("@/features/ib/admin/api", () => ({
  useIbJobOperations: () => ({
    data: {
      inventory: [
        {
          key: "import_execute",
          queue: "ib_imports",
          retry: "manual_or_auto",
          idempotencyRule: "batch checksum + resume cursor",
          replaySupported: true,
          cancelSupported: true,
          timeoutSeconds: 600,
          runbookUrl: "/admin/ib/runbooks#migration-pipeline",
        },
      ],
      queueHealth: [
        {
          queue: "ib_imports",
          depth: 3,
          latencySeconds: 12,
          operations: ["import_execute"],
          status: "healthy",
        },
      ],
      attentionSummary: {
        queued: 1,
        running: 0,
        failed: 1,
        deadLetter: 0,
        recovered: 2,
      },
      failures: [
        {
          id: 9,
          operationType: "import_execute",
          title: "Import batch blocked or failed",
          detail: "Import lost connection.",
          happenedAt: new Date("2026-03-07T10:00:00Z").toISOString(),
          queue: "ib_imports",
          correlationId: "corr-123",
          runbookUrl: "/admin/ib/runbooks#migration-pipeline",
        },
      ],
      recentEvents: [
        {
          id: 1,
          jobId: 9,
          eventType: "dead_lettered",
          message: "Import exhausted retries.",
          occurredAt: new Date("2026-03-07T10:01:00Z").toISOString(),
          payload: {},
        },
      ],
      generatedAt: new Date("2026-03-07T10:02:00Z").toISOString(),
    },
    mutate: mocks.mutate,
  }),
  useIbOperationalReliability: () => ({
    data: {
      generatedAt: new Date("2026-03-07T10:03:00Z").toISOString(),
      failureDomains: [],
      queueHealth: [],
      recoverySummary: { queued: 0, running: 0, failed: 1, deadLetter: 0, recentFailures: [] },
      sloSummary: [
        {
          key: "async_success_rate",
          label: "Operational job success rate",
          objective: ">= 98%",
          currentValue: "97.5%",
          status: "risk",
        },
      ],
      traceSummary: { enabled: true, strategy: "w3c_traceparent_plus_structured_logs" },
      sentrySummary: {
        configured: true,
        tracesSampleRate: 0.1,
        errorBudget: { dailyFailureThreshold: 10, queueDeadLetterThreshold: 3 },
      },
      queryObservability: { thresholds: {}, indexedSurfaces: [], capacityNotes: [] },
      loadRehearsals: [],
    },
  }),
  replayIbJobOperation: mocks.replayIbJobOperation,
  cancelIbJobOperation: mocks.cancelIbJobOperation,
  backfillIbJobOperations: mocks.backfillIbJobOperations,
}));

vi.mock("@/features/ib/admin/analytics", () => ({
  reportIbAdminEvent: vi.fn(),
}));

describe("JobOperationsConsole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.replayIbJobOperation.mockResolvedValue({});
    mocks.cancelIbJobOperation.mockResolvedValue({});
    mocks.backfillIbJobOperations.mockResolvedValue({});
    mocks.mutate.mockResolvedValue(undefined);
  });

  it("renders queue health, recovery actions, and runbook links", () => {
    render(<JobOperationsConsole />);

    expect(screen.getByText("Queue health")).toBeInTheDocument();
    expect(screen.getByText("ib_imports")).toBeInTheDocument();
    expect(screen.getByText("Import batch blocked or failed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Runbook" })).toHaveAttribute(
      "href",
      "/admin/ib/runbooks#migration-pipeline",
    );
    expect(screen.getByText("Operational job success rate")).toBeInTheDocument();
  });

  it("replays failures, cancels tracked jobs, and requests backfill", async () => {
    render(<JobOperationsConsole />);

    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Backfill analytics" }));

    await waitFor(() => {
      expect(mocks.replayIbJobOperation).toHaveBeenCalledWith("import_execute", 9);
      expect(mocks.cancelIbJobOperation).toHaveBeenCalledWith(9, "Cancelled from rollout console.");
      expect(mocks.backfillIbJobOperations).toHaveBeenCalledWith("analytics");
    });
    expect(mocks.addToast).toHaveBeenCalled();
  });
});
