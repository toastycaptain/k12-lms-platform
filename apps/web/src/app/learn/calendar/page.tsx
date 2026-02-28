"use client";

import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { EmptyState } from "@k12/ui";
import { swrConfig } from "@/lib/swr";

interface CalendarEvent {
  type: "unit_plan" | "assignment" | "quiz";
  id: number;
  title: string;
  course_id: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  status?: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
}

function eventDate(event: CalendarEvent): Date {
  return new Date(event.start_date || event.due_date || event.end_date || Date.now());
}

export default function LearnCalendarPage() {
  const startDate = new Date();
  startDate.setDate(1);

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);

  const query = `start_date=${startDate.toISOString().slice(0, 10)}&end_date=${endDate
    .toISOString()
    .slice(0, 10)}`;

  const { data, error, isLoading } = useSWR<CalendarResponse>(
    `learn-calendar-${query}`,
    () => apiFetch<CalendarResponse>(`/api/v1/calendar?${query}`),
    swrConfig,
  );

  const events = [...(data?.events || [])].sort(
    (a, b) => eventDate(a).getTime() - eventDate(b).getTime(),
  );

  return (
    <ProtectedRoute requiredRoles={["student"]}>
      <AppShell>
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">Your classwork timeline for this month.</p>
          </header>

          {error ? (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              Unable to load calendar events.
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
              Loading calendar...
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              title="No calendar items"
              description="No events were found for this time range."
            />
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <article
                  key={`${event.type}-${event.id}`}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {event.type.replace("_", " ").toUpperCase()} •{" "}
                        {eventDate(event).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">Course ID: {event.course_id}</p>
                    </div>
                    {event.status ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {event.status}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
