"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import { type GuardianCalendarEvent, useGuardianCalendar } from "@/hooks/useGuardian";

function eventDate(event: GuardianCalendarEvent): Date {
  return new Date(event.start_date || event.due_date || event.end_date || Date.now());
}

export default function GuardianCalendarPage() {
  const params = useParams();
  const studentId = String(params.studentId);

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);

  const { data, isLoading, error } = useGuardianCalendar(studentId, { startDate, endDate });

  const events = useMemo(
    () => [...(data?.events || [])].sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime()),
    [data?.events],
  );

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading calendar...</p>;
  }

  if (error) {
    return <EmptyState title="Unable to load calendar" description="Try again in a moment." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-600">Upcoming classwork and course events.</p>
        </div>
        <Link
          href={`/guardian/students/${studentId}`}
          className="text-sm text-blue-700 hover:text-blue-800"
        >
          ← Back to overview
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No calendar events" description="No events were found for this range." />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <article
              key={`${event.type}-${event.id}`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.type.replace("_", " ").toUpperCase()} •{" "}
                    {eventDate(event).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Course ID: {event.course_id}</p>
                </div>
                {event.status ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {event.status}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
