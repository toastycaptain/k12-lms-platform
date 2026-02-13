const NAV_ITEMS = [
  { label: "Plan", href: "/plan" },
  { label: "Teach", href: "/teach" },
  { label: "Assess", href: "/assess" },
  { label: "Report", href: "/report" },
  { label: "Communicate", href: "/communicate" },
  { label: "Admin", href: "/admin" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Left sidebar nav — UX §3.2 */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-gray-200 bg-white md:block">
        <div className="flex h-16 items-center px-4 font-semibold text-lg">K-12 LMS</div>
        <nav className="mt-2 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar placeholder */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-sm text-gray-500">School Name</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Search</span>
            <span className="text-sm text-gray-400">Notifications</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
