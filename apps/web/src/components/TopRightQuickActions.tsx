"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";

type MenuKey = "schedule" | "help" | "profile" | "search";

interface TopRightQuickActionsProps {
  showNotifications?: boolean;
}

interface CalendarEvent {
  id: number;
  type: "unit_plan" | "assignment" | "quiz";
  title: string;
  start_date?: string;
  due_date?: string;
  status?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
}

function userInitials(firstName?: string, lastName?: string, email?: string): string {
  const first = firstName?.trim()?.[0] || "";
  const last = lastName?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();
  if (initials.length > 0) return initials;
  return (email || "U").slice(0, 1).toUpperCase();
}

function fullName(firstName?: string, lastName?: string, email?: string): string {
  const joined = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  if (joined.length > 0) return joined;
  return email || "User";
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function eventTimestamp(event: CalendarEvent): number {
  const raw = event.due_date || event.start_date;
  if (!raw) return Number.MAX_SAFE_INTEGER;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function eventTimeLabel(event: CalendarEvent): string {
  if (event.type === "unit_plan") return "All day";
  const raw = event.due_date || event.start_date;
  if (!raw) return "No time";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "No time";
  return parsed.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function TopRightQuickActions({
  showNotifications = true,
}: TopRightQuickActionsProps) {
  const { user, signOut } = useAuth();
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(
    () => fullName(user?.first_name, user?.last_name, user?.email),
    [user?.email, user?.first_name, user?.last_name],
  );

  const initials = useMemo(
    () => userInitials(user?.first_name, user?.last_name, user?.email),
    [user?.email, user?.first_name, user?.last_name],
  );

  const loadTodaySchedule = useCallback(async () => {
    setScheduleLoading(true);

    try {
      const today = isoDate(new Date());
      const response = await apiFetch<CalendarResponse>(
        `/api/v1/calendar?start_date=${today}&end_date=${today}`,
      );
      const events = [...(response.events || [])].sort(
        (left, right) => eventTimestamp(left) - eventTimestamp(right),
      );
      setTodayEvents(events);
    } catch {
      setTodayEvents([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (openMenu === "schedule") {
      void loadTodaySchedule();
    }
  }, [loadTodaySchedule, openMenu]);

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenMenu((previous) => (previous === "search" ? null : "search"))}
          aria-expanded={openMenu === "search"}
          aria-haspopup="dialog"
          className="rounded-md border border-gray-200 px-2 py-1.5 text-gray-600 hover:bg-gray-50"
          title="Search your account"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search your account</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenMenu((previous) => (previous === "schedule" ? null : "schedule"))}
          aria-expanded={openMenu === "schedule"}
          aria-haspopup="dialog"
          className="rounded-md border border-gray-200 px-2 py-1.5 text-gray-600 hover:bg-gray-50"
          title="Today's schedule"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
            <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
          </svg>
          <span className="sr-only">Today&apos;s schedule</span>
        </button>

        {showNotifications && <NotificationBell />}

        <button
          type="button"
          onClick={() => setOpenMenu((previous) => (previous === "help" ? null : "help"))}
          aria-expanded={openMenu === "help"}
          aria-haspopup="dialog"
          className="rounded-md border border-gray-200 px-2 py-1.5 text-gray-600 hover:bg-gray-50"
          title="Help center"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="9" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"
            />
            <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          <span className="sr-only">Help center</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenMenu((previous) => (previous === "profile" ? null : "profile"))}
          aria-expanded={openMenu === "profile"}
          aria-haspopup="dialog"
          className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-gray-700 hover:bg-gray-50"
          title="Profile"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {initials}
          </span>
          <span className="max-w-40 truncate text-sm">{displayName}</span>
        </button>
      </div>

      {openMenu && (
        <aside className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,30rem)] rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          {openMenu === "schedule" && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Schedule</h3>
                <Link href="/plan/calendar" className="text-xs text-blue-700 hover:text-blue-900">
                  Full calendar
                </Link>
              </div>
              {scheduleLoading ? (
                <p className="text-sm text-gray-500">Loading schedule...</p>
              ) : todayEvents.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing scheduled for today.</p>
              ) : (
                <ul className="space-y-2">
                  {todayEvents.map((event) => (
                    <li
                      key={`${event.type}-${event.id}`}
                      className="rounded border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {eventTimeLabel(event)} - {event.type.replace("_", " ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {openMenu === "help" && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Help Center</h3>
              <div className="space-y-2 text-sm">
                <Link href="/docs/api" className="block rounded px-2 py-1 hover:bg-gray-50">
                  Help Center
                </Link>
                <Link href="/docs/api/errors" className="block rounded px-2 py-1 hover:bg-gray-50">
                  Troubleshooting
                </Link>
                <Link
                  href="/docs/api/changelog"
                  className="block rounded px-2 py-1 hover:bg-gray-50"
                >
                  Release Notes
                </Link>
              </div>
            </section>
          )}

          {openMenu === "search" && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Search Your Account</h3>
              <GlobalSearch />
            </section>
          )}

          {openMenu === "profile" && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">Profile</h3>
              <div className="space-y-1 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">{displayName}</p>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-gray-600">Roles: {user.roles.join(", ") || "None"}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Link href="/dashboard" className="text-sm text-blue-700 hover:text-blue-900">
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </div>
            </section>
          )}
        </aside>
      )}
    </div>
  );
}
