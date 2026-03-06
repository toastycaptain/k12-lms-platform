import { buildNavigation } from "@/features/curriculum/navigation/buildNavigation";
import type { NavigationItem } from "@/features/curriculum/navigation/types";

interface LegacyRuntimeShape {
  packKey?: string | null;
}

function inferProgramme(pathname: string): string | null {
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

export function buildNav(
  _registry: NavigationItem[] | undefined,
  runtime: LegacyRuntimeShape | undefined,
  roles: string[],
  pathname = "/dashboard",
) {
  const built = buildNavigation({
    isIb: Boolean(runtime?.packKey?.toLowerCase().includes("ib") || pathname.startsWith("/ib")),
    roles,
    pathname,
    activeProgramme: inferProgramme(pathname),
  });

  return built.primary;
}
