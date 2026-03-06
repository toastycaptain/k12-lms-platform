const ANALYTICS_ENDPOINT = "/api/v1/analytics/web_vitals";

interface AnalyticsPayload {
  name: string;
  value: number;
  path: string;
  category: "web-vital" | "interaction";
  metadata?: Record<string, unknown>;
}

function emitAnalyticsEvent(payload: AnalyticsPayload): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("k12-analytics", { detail: payload }));

  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Fire-and-forget telemetry should never block rendering.
  });
}

export function reportInteractionMetric(
  name: string,
  value: number,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  emitAnalyticsEvent({
    name,
    value,
    metadata,
    path: window.location.pathname,
    category: "interaction",
  });
}

export function reportWebVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      emitAnalyticsEvent({
        name: entry.name,
        value: entry.startTime,
        path: window.location.pathname,
        category: "web-vital",
      });
    }
  });

  observer.observe({ type: "largest-contentful-paint", buffered: true });
  observer.observe({ type: "first-input", buffered: true });
  observer.observe({ type: "layout-shift", buffered: true });
}
