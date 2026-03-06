export interface NavigationChildItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  roles?: string[];
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  roles?: string[];
  children?: NavigationChildItem[];
}

export interface ShellQuickAction {
  id: string;
  label: string;
  href: string;
  description: string;
}

export type ShellMode = "generic" | "ib-teacher" | "ib-student" | "ib-guardian";

export interface BuiltNavigation {
  shellMode: ShellMode;
  primary: NavigationItem[];
  workspaceOptions: NavigationItem[];
  quickActions: ShellQuickAction[];
  homeHref: string;
  currentWorkspace: NavigationItem | null;
  workspaceTitle: string;
  workspaceDescription: string;
  curriculumBadge: string;
  programmeBadge: string;
}
