"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSchool } from "@/lib/school-context";
import { useCurriculumRuntime } from "@/features/curriculum/runtime/useCurriculumRuntime";
import {
  resolveIbRoute,
  type IbBreadcrumb,
  type IbRouteId,
  type IbWorkspaceKey,
} from "@/features/ib/core/route-registry";

export type IbWorkMode = "planning" | "teaching" | "meeting" | "review" | "family-preview";

interface IbRecentItem {
  routeId: IbRouteId;
  href: string;
  label: string;
  visitedAt: string;
  workspace: IbWorkspaceKey;
  programme: string | null;
}

interface StoredIbContext {
  workModes: Record<string, IbWorkMode>;
  recentItems: IbRecentItem[];
}

interface IbContextValue {
  active: boolean;
  breadcrumbs: IbBreadcrumb[];
  currentHref: string | null;
  currentLabel: string | null;
  currentProgramme: string | null;
  currentWorkspace: IbWorkspaceKey | null;
  currentWorkMode: IbWorkMode;
  currentSchoolLabel: string | null;
  recentItems: IbRecentItem[];
  setWorkMode: (mode: IbWorkMode) => void;
}

const DEFAULT_STORED_CONTEXT: StoredIbContext = {
  workModes: {},
  recentItems: [],
};

const IbContext = createContext<IbContextValue>({
  active: false,
  breadcrumbs: [],
  currentHref: null,
  currentLabel: null,
  currentProgramme: null,
  currentWorkspace: null,
  currentWorkMode: "planning",
  currentSchoolLabel: null,
  recentItems: [],
  setWorkMode: () => {},
});

function defaultWorkMode(roles: string[], pathname: string): IbWorkMode {
  if (roles.includes("guardian") || pathname.startsWith("/guardian")) {
    return "family-preview";
  }

  if (roles.includes("student") || pathname.startsWith("/learn")) {
    return "teaching";
  }

  if (
    roles.includes("admin") ||
    roles.includes("curriculum_lead") ||
    roles.includes("district_admin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ib/review") ||
    pathname.startsWith("/ib/operations")
  ) {
    return "review";
  }

  return "planning";
}

function readStoredContext(key: string | null): StoredIbContext {
  if (!key || typeof window === "undefined") {
    return DEFAULT_STORED_CONTEXT;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return DEFAULT_STORED_CONTEXT;
    }

    const parsed = JSON.parse(raw) as Partial<StoredIbContext>;
    return {
      workModes: parsed.workModes && typeof parsed.workModes === "object" ? parsed.workModes : {},
      recentItems: Array.isArray(parsed.recentItems) ? parsed.recentItems : [],
    };
  } catch {
    return DEFAULT_STORED_CONTEXT;
  }
}

function writeStoredContext(key: string | null, value: StoredIbContext): void {
  if (!key || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function IbContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isIb, activeProgramme } = useCurriculumRuntime();
  const { schoolId, schools } = useSchool();
  const [storedContext, setStoredContext] = useState<StoredIbContext>(DEFAULT_STORED_CONTEXT);

  const matchedRoute = useMemo(() => resolveIbRoute(pathname), [pathname]);
  const currentSchoolLabel = schools.find((school) => String(school.id) === schoolId)?.name ?? null;
  const storageKey = user?.id ? `k12.ib.context.${user.id}.${schoolId ?? "global"}` : null;

  useEffect(() => {
    setStoredContext(readStoredContext(storageKey));
  }, [storageKey]);

  useEffect(() => {
    writeStoredContext(storageKey, storedContext);
  }, [storageKey, storedContext]);

  useEffect(() => {
    if (!matchedRoute || !(isIb || pathname.startsWith("/ib"))) {
      return;
    }

    setStoredContext((current) => {
      const label = matchedRoute.breadcrumbs[matchedRoute.breadcrumbs.length - 1]?.label;
      const nextItem: IbRecentItem = {
        routeId: matchedRoute.route.id,
        href: matchedRoute.canonicalHref,
        label,
        visitedAt: new Date().toISOString(),
        workspace: matchedRoute.route.workspace,
        programme: matchedRoute.route.programme ?? activeProgramme,
      };

      const recentItems = [
        nextItem,
        ...current.recentItems.filter((item) => item.href !== nextItem.href),
      ].slice(0, 6);

      return {
        ...current,
        recentItems,
      };
    });
  }, [activeProgramme, isIb, matchedRoute, pathname]);

  const setWorkMode = useCallback(
    (mode: IbWorkMode) => {
      const family = matchedRoute?.route.family;
      if (!family) {
        return;
      }

      setStoredContext((current) => ({
        ...current,
        workModes: {
          ...current.workModes,
          [family]: mode,
        },
      }));
    },
    [matchedRoute?.route.family],
  );

  const value = useMemo<IbContextValue>(() => {
    const active = Boolean(matchedRoute && (isIb || pathname.startsWith("/ib")));
    const workMode =
      matchedRoute?.route.family && storedContext.workModes[matchedRoute.route.family]
        ? storedContext.workModes[matchedRoute.route.family]
        : defaultWorkMode(user?.roles ?? [], pathname);

    return {
      active,
      breadcrumbs: matchedRoute?.breadcrumbs ?? [],
      currentHref: matchedRoute?.canonicalHref ?? null,
      currentLabel: matchedRoute?.breadcrumbs[matchedRoute.breadcrumbs.length - 1]?.label ?? null,
      currentProgramme: matchedRoute?.route.programme ?? activeProgramme ?? null,
      currentWorkspace: matchedRoute?.route.workspace ?? null,
      currentWorkMode: workMode,
      currentSchoolLabel,
      recentItems: storedContext.recentItems.filter(
        (item) => item.href !== matchedRoute?.canonicalHref,
      ),
      setWorkMode,
    };
  }, [
    activeProgramme,
    currentSchoolLabel,
    isIb,
    matchedRoute,
    pathname,
    setWorkMode,
    storedContext.recentItems,
    storedContext.workModes,
    user?.roles,
  ]);

  return <IbContext.Provider value={value}>{children}</IbContext.Provider>;
}

export function useIbContext() {
  return useContext(IbContext);
}
