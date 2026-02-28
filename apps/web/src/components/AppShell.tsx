"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LiveRegion } from "@k12/ui";
import SchoolSelector from "@/components/SchoolSelector";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import TopRightQuickActions from "@/components/TopRightQuickActions";

interface NavItem {
  id: string;
  label: string;
  href: string;
  roles?: string[];
  children?: { label: string; href: string }[];
}

const FLYOUT_NAV_IDS = new Set(["plan", "teach", "assess", "admin", "report", "communicate"]);

const NAV_ITEMS: NavItem[] = [
  {
    id: "guardian",
    label: "My Students",
    href: "/guardian",
    roles: ["guardian"],
    children: [{ label: "Dashboard", href: "/guardian/dashboard" }],
  },
  {
    id: "learn",
    label: "Learn",
    href: "/learn",
    roles: ["student"],
    children: [
      { label: "Dashboard", href: "/learn/dashboard" },
      { label: "My Courses", href: "/learn/courses" },
      { label: "To-dos", href: "/learn/todos" },
      { label: "Goals", href: "/learn/goals" },
      { label: "Calendar", href: "/learn/calendar" },
      { label: "Portfolio", href: "/learn/portfolio" },
      { label: "Grades", href: "/learn/grades" },
      { label: "Progress", href: "/learn/progress" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    href: "/plan",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { label: "Units", href: "/plan/units" },
      { label: "Calendar", href: "/plan/calendar" },
      { label: "Templates", href: "/plan/templates" },
      { label: "Standards", href: "/plan/standards" },
    ],
  },
  {
    id: "teach",
    label: "Teach",
    href: "/teach",
    roles: ["admin", "teacher"],
    children: [
      { label: "Courses", href: "/teach/courses" },
      { label: "Submissions", href: "/teach/submissions" },
    ],
  },
  {
    id: "assess",
    label: "Assess",
    href: "/assess",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { label: "Question Banks", href: "/assess/banks" },
      { label: "Quizzes", href: "/assess/quizzes" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    href: "/admin",
    roles: ["admin", "curriculum_lead"],
    children: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "School Setup", href: "/admin/school" },
      { label: "Users & Roles", href: "/admin/users" },
      { label: "Integrations", href: "/admin/integrations" },
      { label: "AI Settings", href: "/admin/ai" },
      { label: "LTI", href: "/admin/lti" },
      { label: "Data Retention", href: "/admin/retention" },
      { label: "Curriculum Map", href: "/admin/curriculum-map" },
      { label: "Standards", href: "/admin/standards" },
      { label: "Approval Queue", href: "/admin/approvals" },
    ],
  },
  {
    id: "district",
    label: "District",
    href: "/district",
    roles: ["district_admin"],
    children: [
      { label: "Dashboard", href: "/district/dashboard" },
      { label: "Schools", href: "/district/schools" },
      { label: "Standards", href: "/district/standards" },
      { label: "Templates", href: "/district/templates" },
      { label: "Users", href: "/district/users" },
    ],
  },
  {
    id: "report",
    label: "Report",
    href: "/report",
    roles: ["admin", "curriculum_lead", "teacher"],
    children: [
      { label: "Overview", href: "/report" },
      { label: "Standards Coverage", href: "/report/standards-coverage" },
    ],
  },
  {
    id: "communicate",
    label: "Communicate",
    href: "/communicate",
    roles: ["admin", "curriculum_lead", "teacher", "student"],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isStudentOnly = roles.length > 0 && roles.every((role) => role === "student");
  const isGuardianOnly = roles.length > 0 && roles.every((role) => role === "guardian");

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (roles.length === 0 || !item.roles || item.roles.length === 0) return true;
    return item.roles.some((role) => roles.includes(role));
  }).filter((item) => {
    if (isGuardianOnly) {
      return item.id === "guardian";
    }

    if (!isStudentOnly) return item.id !== "guardian";
    return !["plan", "teach", "admin", "district", "guardian"].includes(item.id);
  });

  const homeHref = isGuardianOnly
    ? "/guardian/dashboard"
    : isStudentOnly
      ? "/learn/dashboard"
      : "/dashboard";

  return (
    <div className="flex h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSidebarOpen(false);
            }
          }}
        />
      )}

      {/* Left sidebar nav — UX §3.2 */}
      <aside
        id="primary-sidebar"
        aria-label="Sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-60 flex-shrink-0 border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href={homeHref} className="text-lg font-semibold text-gray-900">
            K-12 LMS
          </Link>
          <button
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
            aria-controls="primary-sidebar"
            aria-expanded={sidebarOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav aria-label="Main navigation" className="mt-2 flex flex-col gap-1 px-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const shouldUseFlyout = Boolean(item.children && FLYOUT_NAV_IDS.has(item.id));
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.children ? item.children[0].href : item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && shouldUseFlyout && isActive && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 md:absolute md:left-full md:top-0 md:z-50 md:ml-2 md:min-w-[12rem] md:rounded-md md:border md:border-gray-200 md:bg-white md:p-1 md:shadow-lg">
                    {item.children.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={childActive ? "page" : undefined}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                            childActive
                              ? "text-blue-700 bg-blue-50"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
                {item.children && !shouldUseFlyout && isActive && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5">
                    {item.children.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={childActive ? "page" : undefined}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                            childActive
                              ? "text-blue-700 bg-blue-50"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header
          role="banner"
          className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 pr-4">
            <button
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-controls="primary-sidebar"
              aria-expanded={sidebarOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {user && (
              <>
                <SchoolSelector />
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && <TopRightQuickActions showNotifications={!isGuardianOnly} />}
          </div>
        </header>
        <ConnectionBanner />

        <main id="main-content" role="main" className="flex-1 overflow-auto bg-gray-50 p-6">
          <LiveRegion />
          <div className="flex min-h-full flex-col">
            <div className="flex-1">{children}</div>
            <footer className="mt-6 border-t border-gray-200 pt-3 text-xs text-gray-500">
              <Link
                href="/docs/api"
                className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
              >
                API Docs
              </Link>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
