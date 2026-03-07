"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { buildNavigation } from "@/features/curriculum/navigation/buildNavigation";
import { useCurriculumRuntime } from "@/features/curriculum/runtime/useCurriculumRuntime";
import { useUiPreferences } from "@/features/curriculum/runtime/ui-preferences";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import SchoolSelector from "@/components/SchoolSelector";
import TopRightQuickActions from "@/components/TopRightQuickActions";
import {
  CommandPalette as BaseCommandPalette,
  DensityToggle,
  LiveRegion,
  ThemeToggle,
} from "@k12/ui";
import { CommandPalette as IbCommandPalette } from "@/features/ib/navigation/CommandPalette";
import { useKeyboardShortcuts } from "@/features/ib/navigation/useKeyboardShortcuts";

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}#`);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { theme, density, setTheme, setDensity } = useUiPreferences();
  const { roles, isIb, activeProgramme, isGuardianOnly, isIbDocumentsOnly } =
    useCurriculumRuntime();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  const navigation = useMemo(
    () =>
      buildNavigation({
        isIb,
        documentsOnlyMode: isIbDocumentsOnly,
        roles,
        pathname,
        activeProgramme,
        visibleNavigation: user?.curriculum_runtime?.visible_navigation ?? [],
        terminology: user?.curriculum_runtime?.terminology ?? {},
      }),
    [activeProgramme, isIb, isIbDocumentsOnly, pathname, roles, user?.curriculum_runtime],
  );

  const commandItems = useMemo(() => {
    const primaryItems = navigation.primary.map((item) => ({
      id: item.id,
      label: item.label,
      group: "Workspace",
      keywords: [item.description || "", item.href],
      onSelect: () => router.push(item.href),
    }));

    const childItems = navigation.primary.flatMap((item) =>
      (item.children || []).map((child) => ({
        id: child.id,
        label: `${item.label} • ${child.label}`,
        group: "Jump",
        keywords: [child.href, child.description || item.label],
        onSelect: () => router.push(child.href),
      })),
    );

    const quickActions = navigation.quickActions.map((action) => ({
      id: action.id,
      label: action.label,
      group: "Quick Action",
      keywords: [action.href, action.description],
      onSelect: () => router.push(action.href),
    }));

    return [...primaryItems, ...childItems, ...quickActions];
  }, [navigation, router]);

  const ibCommandItems = useMemo(
    () =>
      commandItems.map((item) => ({
        id: item.id,
        label: item.label,
        detail: item.keywords?.[0] || item.group || "IB workspace action",
        href:
          navigation.primary.find((primary) => primary.id === item.id)?.href ||
          navigation.primary
            .flatMap((primary) => primary.children || [])
            .find((child) => child.id === item.id)?.href ||
          navigation.quickActions.find((action) => action.id === item.id)?.href ||
          navigation.homeHref,
        programme: activeProgramme || "Mixed",
      })),
    [activeProgramme, commandItems, navigation],
  );

  useKeyboardShortcuts({
    openPalette: () => setPaletteOpen(true),
    home: () => router.push("/ib/home"),
    evidence: () => router.push("/ib/evidence"),
    publishing: () => router.push("/ib/families/publishing"),
    review: () => router.push("/ib/review"),
  });

  const currentWorkspaceValue =
    navigation.currentWorkspace?.href ||
    navigation.workspaceOptions[0]?.href ||
    navigation.homeHref;

  return (
    <div className="min-h-screen bg-[var(--app-background)] text-[var(--app-foreground)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950"
      >
        Skip to main content
      </a>

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      ) : null}

      <div className="grid min-h-screen md:grid-cols-[19rem_minmax(0,1fr)]">
        <aside
          id="primary-sidebar"
          aria-label="Sidebar"
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/60 bg-[var(--app-surface)]/95 p-4 shadow-2xl backdrop-blur transition-transform md:sticky md:top-0 md:h-screen md:w-auto md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={navigation.homeHref} className="block">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-accent)]">
                    K-12 LMS
                  </p>
                </Link>
                <h1 className="mt-2 text-xl font-semibold text-slate-950">
                  {isIb ? "IB Workspace System" : "Curriculum Workspace"}
                </h1>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setSidebarOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 md:hidden"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">{navigation.workspaceDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                {navigation.curriculumBadge}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {navigation.programmeBadge}
              </span>
            </div>
          </div>

          <nav aria-label="Main navigation" className="mt-5 flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {navigation.primary.map((item) => {
                const itemActive =
                  matchesPath(pathname, item.href) ||
                  (item.children || []).some((child) => matchesPath(pathname, child.href));

                return (
                  <li
                    key={item.id}
                    onMouseEnter={() => setOpenItemId(item.id)}
                    onMouseLeave={() =>
                      setOpenItemId((current) => (current === item.id ? null : current))
                    }
                    className={`group rounded-[1.5rem] border px-2 py-2 transition ${
                      itemActive
                        ? "border-slate-200 bg-white/90 shadow-sm"
                        : "border-transparent bg-transparent hover:border-white/60 hover:bg-white/70"
                    }`}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={itemActive ? "page" : undefined}
                      aria-label={item.label}
                      className="block rounded-2xl px-3 py-2"
                    >
                      <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      ) : null}
                    </Link>

                    {item.children?.length && (itemActive || openItemId === item.id) ? (
                      <div className="overflow-hidden pb-2 pl-3 pr-1 transition">
                        <div className="space-y-1 pt-1">
                          {item.children.map((child) => {
                            const childActive = matchesPath(pathname, child.href);
                            return (
                              <Link
                                key={child.id}
                                href={child.href}
                                onClick={() => setSidebarOpen(false)}
                                aria-current={childActive ? "page" : undefined}
                                aria-label={child.label}
                                className={`block rounded-xl px-3 py-2 text-sm ${
                                  childActive
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-5 space-y-4 rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-sm">
            <ThemeToggle value={theme} onChange={setTheme} />
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        </aside>

        <div className="min-w-0">
          <header
            role="banner"
            className="sticky top-0 z-30 border-b border-white/60 bg-[var(--app-surface)]/90 backdrop-blur"
          >
            <div className="flex flex-col gap-4 px-4 py-4 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    type="button"
                    aria-label="Open navigation menu"
                    aria-controls="primary-sidebar"
                    aria-expanded={sidebarOpen}
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm md:hidden"
                  >
                    Menu
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {navigation.curriculumBadge} workspace
                    </p>
                    <h2 className="mt-1 truncate text-2xl font-semibold text-slate-950">
                      {navigation.workspaceTitle}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600">
                      {navigation.workspaceDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Jump
                    <span className="ml-2 text-xs text-slate-400">Ctrl K</span>
                  </button>
                  {user ? <TopRightQuickActions showNotifications={!isGuardianOnly} /> : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  {user ? <SchoolSelector /> : null}
                  <label className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-sm text-slate-600 shadow-sm">
                    <span>Workspace</span>
                    <select
                      value={currentWorkspaceValue}
                      onChange={(event) => router.push(event.target.value)}
                      className="bg-transparent text-sm font-medium text-slate-900 outline-none"
                    >
                      {navigation.workspaceOptions.map((item) => (
                        <option key={item.id} value={item.href}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {navigation.quickActions.map((action) => (
                    <Link
                      key={action.id}
                      href={action.href}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <ConnectionBanner />

          <main id="main-content" role="main" className="px-4 py-6 md:px-6">
            <LiveRegion />
            <div className="mx-auto min-h-[calc(100vh-10rem)] max-w-[92rem]">{children}</div>
          </main>
        </div>
      </div>

      {isIb ? (
        <IbCommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          homeItems={ibCommandItems}
          recentHistory={[]}
        />
      ) : (
        <BaseCommandPalette
          open={paletteOpen}
          items={commandItems}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </div>
  );
}
