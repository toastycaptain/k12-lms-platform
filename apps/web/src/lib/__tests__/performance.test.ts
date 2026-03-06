import { reportInteractionMetric, reportWebVitals } from "@/lib/performance";

describe("reportWebVitals", () => {
  const originalObserver = globalThis.PerformanceObserver;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.PerformanceObserver = originalObserver;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("returns without throwing when PerformanceObserver is unavailable", () => {
    // @ts-expect-error test override
    delete globalThis.PerformanceObserver;

    expect(() => reportWebVitals()).not.toThrow();
  });

  it("observes web-vitals and posts metrics", async () => {
    const observe = vi.fn();
    let callbackRef: ((list: PerformanceObserverEntryList) => void) | null = null;

    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;

    class PerformanceObserverMock {
      constructor(callback: (list: PerformanceObserverEntryList) => void) {
        callbackRef = callback;
      }

      observe = observe;
    }

    globalThis.PerformanceObserver =
      PerformanceObserverMock as unknown as typeof PerformanceObserver;

    reportWebVitals();

    expect(observe).toHaveBeenCalledWith({ type: "largest-contentful-paint", buffered: true });
    expect(observe).toHaveBeenCalledWith({ type: "first-input", buffered: true });
    expect(observe).toHaveBeenCalledWith({ type: "layout-shift", buffered: true });

    expect(callbackRef).not.toBeNull();
    if (typeof callbackRef !== "function") {
      throw new Error("PerformanceObserver callback was not captured");
    }

    const callback = callbackRef as (list: PerformanceObserverEntryList) => void;
    callback({
      getEntries: () =>
        [{ name: "largest-contentful-paint", startTime: 123.4 }] as PerformanceEntry[],
    } as PerformanceObserverEntryList);

    await Promise.resolve();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/analytics/web_vitals",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );
  });

  it("posts interaction metrics and dispatches an analytics event", async () => {
    const listener = vi.fn();
    globalThis.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
    window.addEventListener("k12-analytics", listener as EventListener);

    reportInteractionMetric("ib_workspace_render", 86, { workspace: "IB Home" });

    await Promise.resolve();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/analytics/web_vitals",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
      }),
    );

    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse(String(options?.body)) as {
      name: string;
      value: number;
      category: string;
      metadata?: { workspace?: string };
    };

    expect(body.name).toBe("ib_workspace_render");
    expect(body.value).toBe(86);
    expect(body.category).toBe("interaction");
    expect(body.metadata?.workspace).toBe("IB Home");
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("k12-analytics", listener as EventListener);
  });
});
