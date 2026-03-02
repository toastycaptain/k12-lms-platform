"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import { useGuardianClassesToday } from "@/hooks/useGuardian";

export default function GuardianClassesTodayPage() {
  const params = useParams();
  const studentId = String(params.studentId);
  const { data, isLoading, error } = useGuardianClassesToday(studentId);

  const classesToday = useMemo(
    () =>
      [...(data || [])].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      ),
    [data],
  );

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading classes...</p>;
  }

  if (error) {
    return <EmptyState title="Unable to load classes" description="Try again in a moment." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes Today</h1>
          <p className="mt-1 text-sm text-slate-600">Today&apos;s timetable and teacher roster.</p>
        </div>
        <Link
          href={`/guardian/students/${studentId}`}
          className="text-sm text-blue-700 hover:text-blue-800"
        >
          ← Back to overview
        </Link>
      </div>

      {classesToday.length === 0 ? (
        <EmptyState title="No classes today" description="No class meetings are scheduled today." />
      ) : (
        <div className="space-y-2">
          {classesToday.map((entry) => (
            <article
              key={`${entry.section_id}-${entry.start_at}`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <p className="font-semibold text-slate-900">{entry.course_name}</p>
              <p className="text-sm text-slate-600">{entry.section_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(entry.start_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(entry.end_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              {entry.location ? (
                <p className="mt-1 text-xs text-slate-500">{entry.location}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                Teachers: {entry.teachers.map((teacher) => teacher.name).join(", ")}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
