import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PublishingQueue } from "@/features/ib/families/PublishingQueue";

const { mutateMock, schedulePublishingQueueItemMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(async () => undefined),
  schedulePublishingQueueItemMock: vi.fn(async () => undefined),
}));

vi.mock("@/features/ib/data", () => ({
  schedulePublishingQueueItem: schedulePublishingQueueItemMock,
  useIbPublishingQueue: () => ({
    data: [
      {
        id: 7,
        state: "draft",
        story: {
          id: "story-7",
          title: "Water inquiry reflection",
          programme: "PYP",
          audience: "Families",
          teacher: "Ms Rivera",
          cadence: "Weekly Digest",
          state: "ready-for-digest",
          summary: "Students connected systems thinking to real-world waterways.",
          supportPrompt: "Ask your child how systems can change a community.",
        },
      },
    ],
    mutate: mutateMock,
  }),
}));

describe("PublishingQueue", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("updates the active story schedule plan", async () => {
    render(<PublishingQueue />);

    fireEvent.click(screen.getByRole("button", { name: "Publish now" }));
    fireEvent.click(screen.getByRole("button", { name: "Save publishing plan" }));

    await waitFor(() => {
      expect(schedulePublishingQueueItemMock).toHaveBeenCalledWith(7, "publish-now");
      expect(mutateMock).toHaveBeenCalled();
    });
  });
});
