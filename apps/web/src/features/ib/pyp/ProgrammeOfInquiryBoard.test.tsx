import { fireEvent, render, screen, within } from "@testing-library/react";
import { ProgrammeOfInquiryBoard } from "@/features/ib/pyp/ProgrammeOfInquiryBoard";

vi.mock("@/features/ib/data", () => ({
  useIbPoiPayload: () => ({
    data: {
      board: {
        id: 1,
        title: "Programme of inquiry",
        status: "draft",
        entries: [
          {
            id: 11,
            yearLevel: "Grade 4",
            theme: "How the world works",
            title: "Systems around us",
            centralIdea:
              "People design systems to meet needs, but those systems affect communities.",
            reviewState: "review_ready",
            coherenceSignal: "healthy",
            specialistExpectations: ["Library"],
          },
        ],
      },
      themes: ["How the world works"],
      years: ["Grade 4"],
      summaryMetrics: [{ label: "Mapped units", value: "1" }],
    },
  }),
}));

describe("ProgrammeOfInquiryBoard", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("opens the mapped unit drawer with central idea details", () => {
    render(<ProgrammeOfInquiryBoard />);

    fireEvent.click(screen.getByRole("button", { name: /Systems around us/i }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Central idea")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /People design systems to meet needs, but those systems affect communities/i,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
