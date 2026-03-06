import { fireEvent, render, screen } from "@testing-library/react";
import { CoordinatorOverview } from "@/features/ib/home/CoordinatorOverview";

vi.mock("@/features/ib/home/useIbHomePayload", () => ({
  useIbHomePayload: () => ({
    data: {
      schoolLabel: "Demo School",
      coordinatorCards: [
        {
          id: "coord-1",
          label: "PYP POI gaps need attention",
          detail: "A PYP gap exists.",
          href: "/ib/pyp/poi",
          tone: "warm",
          programme: "PYP",
          status: "watch",
        },
        {
          id: "coord-2",
          label: "DP IA risk hotspot",
          detail: "A DP issue exists.",
          href: "/ib/dp/assessment/ia-risk",
          tone: "risk",
          programme: "DP",
          status: "risk",
        },
      ],
      programme: "Mixed",
      coordinatorMode: true,
      resumeItems: [],
      changeFeed: [],
      evidenceActions: [],
      publishingActions: [],
      coordinatorComments: [],
      projectsCoreFollowUp: [],
      quickActions: [],
    },
  }),
}));

describe("CoordinatorOverview", () => {
  const originalFetch = globalThis.fetch;
  const storage = new Map<string, string>();

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("filters by programme and persists the selection", () => {
    render(<CoordinatorOverview />);

    fireEvent.click(screen.getByRole("button", { name: "DP" }));

    expect(screen.getByText("DP IA risk hotspot")).toBeInTheDocument();
    expect(storage.get("k12.ib.coordinator.home.filters")).toContain('"programme":"DP"');
  });
});
