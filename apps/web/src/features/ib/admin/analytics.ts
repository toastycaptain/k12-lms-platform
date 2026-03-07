"use client";

import { reportInteractionMetric } from "@/lib/performance";

export function reportIbAdminEvent(
  name: string,
  metadata?: Record<string, string | number | boolean | null | undefined>,
) {
  reportInteractionMetric(name, 1, {
    surface: "ib_admin",
    ...metadata,
  });
}
