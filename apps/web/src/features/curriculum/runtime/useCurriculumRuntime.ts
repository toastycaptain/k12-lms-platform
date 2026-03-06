"use client";

import { useMemo } from "react";
import * as nextNavigation from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { normalizePackRuntime, type NormalizedPackRuntime } from "@/curriculum/runtime/adapters";

export type IbProgramme = "PYP" | "MYP" | "DP" | "Mixed";

function inferProgrammeFromPath(pathname: string): IbProgramme | null {
  if (pathname.includes("/pyp")) return "PYP";
  if (pathname.includes("/myp")) return "MYP";
  if (
    pathname.includes("/dp") ||
    pathname.includes("/cas") ||
    pathname.includes("/ee") ||
    pathname.includes("/tok")
  ) {
    return "DP";
  }

  return null;
}

function inferProgrammeFromPreferences(
  preferences: Record<string, unknown> | undefined,
): IbProgramme | null {
  const raw = preferences?.ib_programme;
  if (typeof raw !== "string") return null;
  const normalized = raw.trim().toUpperCase();
  if (normalized === "PYP" || normalized === "MYP" || normalized === "DP") {
    return normalized;
  }
  return null;
}

function isIbRuntime(runtime: NormalizedPackRuntime): boolean {
  return Boolean(runtime.packKey?.toLowerCase().includes("ib"));
}

function isIbPreference(preferences: Record<string, unknown> | undefined): boolean {
  if (!preferences) return false;

  const candidates = [
    preferences.ib_programme,
    preferences.curriculum_mode,
    preferences.curriculum_profile_key,
  ];

  return candidates.some(
    (value) => typeof value === "string" && value.toLowerCase().includes("ib"),
  );
}

export function useCurriculumRuntime() {
  const pathname = nextNavigation.usePathname?.() ?? "";
  const { user } = useAuth();

  return useMemo(() => {
    const runtime = normalizePackRuntime(user?.curriculum_runtime);
    const roles = user?.roles ?? [];
    const studentOnly = roles.length > 0 && roles.every((role) => role === "student");
    const guardianOnly = roles.length > 0 && roles.every((role) => role === "guardian");
    const ib =
      isIbRuntime(runtime) || isIbPreference(user?.preferences) || pathname.startsWith("/ib");
    const activeProgramme =
      inferProgrammeFromPath(pathname) ??
      inferProgrammeFromPreferences(user?.preferences) ??
      (ib ? "Mixed" : null);
    const featureFlags = user?.curriculum_runtime?.feature_flags ?? {};

    return {
      runtime,
      roles,
      pathname,
      isIb: ib,
      featureFlags,
      isIbDocumentsOnly: ib && Boolean(featureFlags.ib_documents_only_v1),
      isStudentOnly: studentOnly,
      isGuardianOnly: guardianOnly,
      activeProgramme,
    };
  }, [pathname, user]);
}
