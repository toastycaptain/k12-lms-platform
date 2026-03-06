import type { CurriculumRuntimePayload } from "@/lib/api";

export interface NormalizedPackRuntime {
  packKey: string | null;
  packVersion: string | null;
  selectedFrom: string | null;
  terminology: Record<string, string>;
  visibleNavigation: string[];
  navigationByRole: Record<string, string[]>;
  payloadSource: string | null;
  releaseId: number | null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function normalizeNavigationMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>(
    (accumulator, [role, navIds]) => {
      accumulator[role] = normalizeStringArray(navIds);
      return accumulator;
    },
    {},
  );
}

export function normalizePackRuntime(
  input?: CurriculumRuntimePayload | null,
): NormalizedPackRuntime {
  const runtime = input ?? {};

  return {
    packKey: runtime.pack_key ?? runtime.profile_key ?? null,
    packVersion: runtime.pack_version ?? runtime.profile_version ?? null,
    selectedFrom: runtime.selected_from ?? null,
    terminology: runtime.terminology ?? {},
    visibleNavigation: normalizeStringArray(runtime.visible_navigation),
    navigationByRole: normalizeNavigationMap(runtime.navigation),
    payloadSource: runtime.pack_payload_source ?? null,
    releaseId: typeof runtime.pack_release_id === "number" ? runtime.pack_release_id : null,
  };
}
