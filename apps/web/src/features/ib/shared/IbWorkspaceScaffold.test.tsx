import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IbWorkspaceScaffold } from "@/features/ib/shared/IbWorkspaceScaffold";

describe("IbWorkspaceScaffold", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("reports workspace render and click-depth telemetry", async () => {
    render(
      <IbWorkspaceScaffold
        title="IB Home"
        description="Overview"
        actions={<button type="button">Open unit studio</button>}
        main={<div>Main workspace</div>}
      />,
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open unit studio" }));

    const payloads = vi
      .mocked(globalThis.fetch)
      .mock.calls.map(
        ([, options]) =>
          JSON.parse(String(options?.body)) as {
            name: string;
            value: number;
            metadata?: { workspace?: string };
          },
      );

    expect(payloads.some((payload) => payload.name === "ib_workspace_render")).toBe(true);
    expect(
      payloads.some(
        (payload) =>
          payload.name === "ib_workspace_click_depth" &&
          payload.value === 1 &&
          payload.metadata?.workspace === "IB Home",
      ),
    ).toBe(true);
  });
});
