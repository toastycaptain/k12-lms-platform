import {
  GENERIC_NAV_ITEMS,
  IB_GUARDIAN_NAV_ITEMS,
  IB_STUDENT_NAV_ITEMS,
  IB_TEACHER_NAV_ITEMS,
} from "./registry";
import type { BuiltNavigation, NavigationItem, ShellQuickAction } from "./types";
import { IB_WORKSPACES } from "@/features/ib/shell/getIbWorkspaceConfig";

interface BuildNavigationInput {
  isIb: boolean;
  documentsOnlyMode?: boolean;
  roles: string[];
  pathname: string;
  activeProgramme: string | null;
  visibleNavigation?: string[];
  terminology?: Record<string, string>;
}

function matchesRoles(item: NavigationItem, roles: string[]): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (roles.length === 0) return false;
  return item.roles.some((role) => roles.includes(role));
}

function pickCurrentWorkspace(pathname: string, items: NavigationItem[]): NavigationItem | null {
  return (
    [...items]
      .sort((left, right) => right.href.length - left.href.length)
      .find(
        (item) =>
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          pathname.startsWith(item.href + "#"),
      ) ?? null
  );
}

function ibNewPlanningHref(activeProgramme: string | null, documentsOnlyMode: boolean): string {
  if (!documentsOnlyMode) {
    return "/plan/units/new";
  }

  switch (activeProgramme) {
    case "MYP":
      return "/ib/myp/units/new";
    case "DP":
      return "/ib/dp/course-maps/new";
    default:
      return "/ib/pyp/units/new";
  }
}

function quickActionsForMode(
  mode: BuiltNavigation["shellMode"],
  activeProgramme: string | null,
  documentsOnlyMode: boolean,
): ShellQuickAction[] {
  switch (mode) {
    case "ib-student":
      return [
        {
          id: "student-add-evidence",
          label: "Add Evidence",
          href: IB_WORKSPACES["student-portfolio"].href,
          description: "Capture evidence or reflection quickly.",
        },
        {
          id: "student-open-progress",
          label: "Open Progress",
          href: IB_WORKSPACES["student-progress"].href,
          description: "Review criteria, ATL, and milestone progress.",
        },
      ];
    case "ib-guardian":
      return [
        {
          id: "guardian-stories",
          label: "Learning Stories",
          href: IB_WORKSPACES["guardian-stories"].href,
          description: "Open the latest narrative family updates.",
        },
        {
          id: "guardian-calendar",
          label: "Calendar Digest",
          href: IB_WORKSPACES["guardian-calendar"].href,
          description: "Review the next visible milestones.",
        },
      ];
    case "ib-teacher":
      return [
        {
          id: "ib-new-unit",
          label: "New Unit",
          href: ibNewPlanningHref(activeProgramme, documentsOnlyMode),
          description: documentsOnlyMode
            ? "Start a new programme-aware document in the IB-native studio."
            : "Start a new programme-aware unit.",
        },
        {
          id: "ib-add-evidence",
          label: "Add Evidence",
          href: "/ib/evidence",
          description: "Capture evidence and move it toward reflection or family-ready stories.",
        },
        {
          id: "ib-open-projects",
          label: "Projects & Core",
          href: IB_WORKSPACES["projects-core"].href,
          description: "Jump into exhibition, CAS, EE, or TOK.",
        },
        {
          id: "ib-family-update",
          label: "Family Update",
          href: "/ib/families/publishing",
          description: "Preview and schedule a calm family-facing update.",
        },
      ];
    default:
      return [
        {
          id: "generic-new-unit",
          label: "New Unit",
          href: "/plan/units/new",
          description: "Create a new planning document.",
        },
      ];
  }
}

function pluralizeLabel(value: string): string {
  if (value.endsWith("y")) {
    return `${value.slice(0, -1)}ies`;
  }
  if (value.endsWith("s")) {
    return value;
  }
  return `${value}s`;
}

export function buildNavigation({
  isIb,
  documentsOnlyMode = false,
  roles,
  pathname,
  activeProgramme,
  visibleNavigation = [],
  terminology = {},
}: BuildNavigationInput): BuiltNavigation {
  const guardianOnly = roles.length > 0 && roles.every((role) => role === "guardian");
  const studentOnly = roles.length > 0 && roles.every((role) => role === "student");
  const shellMode: BuiltNavigation["shellMode"] = isIb
    ? guardianOnly
      ? "ib-guardian"
      : studentOnly
        ? "ib-student"
        : "ib-teacher"
    : "generic";

  const items =
    shellMode === "ib-guardian"
      ? IB_GUARDIAN_NAV_ITEMS
      : shellMode === "ib-student"
        ? IB_STUDENT_NAV_ITEMS
        : shellMode === "ib-teacher"
          ? IB_TEACHER_NAV_ITEMS
          : GENERIC_NAV_ITEMS;

  const primary = items
    .filter((item) => matchesRoles(item, roles))
    .filter((item) => visibleNavigation.length === 0 || visibleNavigation.includes(item.id))
    .map((item) => ({
      ...item,
      children: item.children
        ?.filter((child) => !child.roles || child.roles.some((role) => roles.includes(role)))
        .map((child) => {
          if (child.id === "plan.units" && terminology.unit_label) {
            return {
              ...child,
              label: pluralizeLabel(terminology.unit_label),
            };
          }

          return child;
        }),
    }));

  const currentWorkspace = pickCurrentWorkspace(pathname, primary);
  const homeHref =
    shellMode === "ib-guardian"
      ? IB_WORKSPACES["guardian-home"].href
      : shellMode === "ib-student"
        ? IB_WORKSPACES["student-home"].href
        : shellMode === "ib-teacher"
          ? IB_WORKSPACES.home.href
          : "/dashboard";

  return {
    shellMode,
    primary,
    workspaceOptions: primary,
    quickActions: quickActionsForMode(shellMode, activeProgramme, documentsOnlyMode),
    homeHref,
    currentWorkspace,
    workspaceTitle: currentWorkspace?.label || (shellMode === "ib-teacher" ? "Home" : "Workspace"),
    workspaceDescription:
      currentWorkspace?.description ||
      (isIb
        ? "IB workspace context stays visible so planning, evidence, and family views never feel detached."
        : "Generic workspace"),
    curriculumBadge: isIb ? "IB" : "Curriculum",
    programmeBadge: activeProgramme || (isIb ? "Mixed" : "General"),
  };
}
