import { fireEvent, render, screen } from "@testing-library/react";
import { ReviewQueue } from "@/features/ib/review/ReviewQueue";

vi.mock("@/features/ib/data", () => ({
  useIbReviewGovernance: () => ({
    data: {
      summaryMetrics: {
        approvals: 0,
        moderation: 1,
        returned: 1,
        orphaned: 0,
        sla_breaches: 0,
      },
      queues: {
        approvals: [],
        moderation: [
          {
            id: "moderation-1",
            title: "MYP criterion moderation",
            detail: "Criterion alignment needs coordinator review.",
            href: "/ib/review",
          },
        ],
        returned: [
          {
            id: "returned-1",
            title: "Returned unit",
            detail: "A coordinator comment is waiting.",
            href: "/ib/review",
          },
        ],
        orphaned: [],
        sla_breaches: [],
      },
    },
  }),
}));

describe("ReviewQueue", () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(window, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
    });
    vi.clearAllMocks();
  });

  it("switches lanes and renders moderation items", () => {
    render(<ReviewQueue />);

    fireEvent.click(screen.getByRole("button", { name: "Moderation" }));

    expect(screen.getAllByText("MYP criterion moderation").length).toBeGreaterThan(0);
  });
});
