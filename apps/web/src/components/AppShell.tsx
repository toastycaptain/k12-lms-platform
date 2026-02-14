"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Plan",
    href: "/plan",
    children: [
      { label: "Units", href: "/plan/units" },
      { label: "Templates", href: "/plan/templates" },
      { label: "Standards", href: "/plan/standards" },
    ],
  },
  {
    label: "Teach",
    href: "/teach",
    children: [
      { label: "Courses", href: "/teach/courses" },
      { label: "Submissions", href: "/teach/submissions" },
    ],
  },
  {
    label: "Assess",
    href: "/assess",
    children: [
      { label: "Question Banks", href: "/assess/banks" },
      { label: "Quizzes", href: "/assess/quizzes" },
    ],
  },
  { label: "Report", href: "/report" },
  { label: "Communicate", href: "/communicate" },
  { label: "Admin", href: "/admin" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left sidebar nav — UX §3.2 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex-shrink-0 border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
            K-12 LMS
          </Link>
          <button
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <div key={item.href}>
                <Link
                  href={item.children ? item.children[0].href : item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium block ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
                {item.children && isActive && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5">
                    {item.children.map((child) => {
                      const childActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
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
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button
              className="rounded-md p-1 text-gray-400 hover:text-gray-600 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm text-gray-500">School Name</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Search</span>
            <span className="text-sm text-gray-400">Notifications</span>
            {user && (
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
