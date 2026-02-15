import { describe, it, expect, vi, beforeEach } from "vitest";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should be importable", async () => {
    // Basic smoke test — verify the module can be imported
    const api = await import("../api");
    expect(api).toBeDefined();
  });
});
