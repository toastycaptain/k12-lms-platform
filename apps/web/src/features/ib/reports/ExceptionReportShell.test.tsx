import { fireEvent, render, screen } from "@testing-library/react";
import { ExceptionReportShell } from "@/features/ib/reports/ExceptionReportShell";

vi.mock("@/features/ib/data", () => ({
  useIbOperationsPayload: () => ({
    data: {
      summaryMetrics: [],
      priorityExceptions: [
        {
          id: "dp-1",
          label: "Biology SL",
          detail: "IA milestone risk needs follow-up.",
          href: "/ib/dp/assessment/ia-risk",
          programme: "DP",
        },
      ],
      queues: {},
      programmeTabs: ["DP"],
      drilldowns: [],
      thresholdsApplied: {},
      generatedAt: "2026-03-01T12:00:00Z",
    },
  }),
}));

describe("ExceptionReportShell", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("switches report focus and keeps drilldown links visible", () => {
    render(<ExceptionReportShell />);

    fireEvent.click(screen.getByRole("button", { name: "DP risk" }));

    expect(screen.getByText("IA milestone risk needs follow-up.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open route" })).toHaveAttribute(
      "href",
      "/ib/dp/assessment/ia-risk",
    );
  });
});
