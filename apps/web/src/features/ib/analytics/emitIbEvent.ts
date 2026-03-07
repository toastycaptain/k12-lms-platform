import { reportInteractionMetric } from "@/lib/performance";
import type { IbEventPayload } from "@/features/ib/analytics/event-schema";

export async function emitIbEvent(payload: IbEventPayload): Promise<void> {
  reportInteractionMetric(payload.eventName, 1, {
    ib_event_family: payload.eventFamily,
    ib_surface: payload.surface,
    programme: payload.programme,
    route_id: payload.routeId,
    entity_ref: payload.entityRef,
  });

  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/v1/ib/activity_events", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ib_activity_event: {
          event_name: payload.eventName,
          event_family: payload.eventFamily,
          surface: payload.surface,
          programme: payload.programme,
          route_id: payload.routeId,
          entity_ref: payload.entityRef,
          document_type: payload.documentType,
          dedupe_key: payload.dedupeKey,
          metadata: payload.metadata || {},
        },
      }),
      keepalive: true,
    });
  } catch {
    // Fire-and-forget telemetry should not block the UI.
  }
}
