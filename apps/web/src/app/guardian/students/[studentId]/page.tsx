"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import {
  useGuardianAnnouncements,
  useGuardianAssignments,
  useGuardianGrades,
} from "@/hooks/useGuardian";

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

export default function GuardianStudentDetailPage() {
  const params = useParams();
  const studentId = String(params.studentId);

  const { data: grades, isLoading: gradesLoading } = useGuardianGrades(studentId);
  const { data: assignments, isLoading: assignmentsLoading } = useGuardianAssignments(studentId);
  const { data: announcements, isLoading: announcementsLoading } =
    useGuardianAnnouncements(studentId);

  const overallAverage = useMemo(() => {
    const values = (grades || [])
      .map((grade) => grade.percentage)
      .filter((value): value is number => value !== null);
    if (values.length === 0) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [grades]);

  const upcomingAssignments = useMemo(() => {
    return (assignments || [])
      .filter((assignment) => assignment.due_at && new Date(assignment.due_at) >= new Date())
      .slice(0, 5);
  }, [assignments]);

  if (gradesLoading || assignmentsLoading || announcementsLoading) {
    return <p className="text-sm text-slate-600">Loading student details...</p>;
  }

  if (!grades && !assignments) {
    return (
      <EmptyState
        title="Student not found"
        description="This student is not linked to your guardian account."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Overview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track progress, upcoming work, and announcements.
          </p>
        </div>
        <Link href="/guardian/dashboard" className="text-sm text-blue-700 hover:text-blue-800">
          ← Back to My Students
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overall Average</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatPercent(overallAverage)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Upcoming Assignments</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{upcomingAssignments.length}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recent Announcements</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {(announcements || []).length}
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Assignments</h2>
          <Link
            href={`/guardian/students/${studentId}/assignments`}
            className="text-sm text-blue-700 hover:text-blue-800"
          >
            View all assignments
          </Link>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {upcomingAssignments.length === 0 ? (
            <p>No upcoming assignments.</p>
          ) : (
            upcomingAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded border border-slate-200 p-3">
                <p className="font-medium">{assignment.title}</p>
                <p className="text-xs text-slate-500">{assignment.course_name}</p>
                <p className="text-xs text-slate-500">
                  Due {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "TBD"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Latest Grades</h2>
          <Link
            href={`/guardian/students/${studentId}/grades`}
            className="text-sm text-blue-700 hover:text-blue-800"
          >
            View full gradebook
          </Link>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {(grades || []).slice(0, 5).map((grade) => (
            <div key={grade.id} className="rounded border border-slate-200 p-3">
              <p className="font-medium">{grade.assignment_title}</p>
              <p className="text-xs text-slate-500">{grade.course_name}</p>
              <p className="text-xs text-slate-500">{formatPercent(grade.percentage)}</p>
            </div>
          ))}
          {(grades || []).length === 0 && <p>No grades posted yet.</p>}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Recent Announcements</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {(announcements || []).slice(0, 5).map((announcement) => (
            <article key={announcement.id} className="rounded border border-slate-200 p-3">
              <p className="font-medium">{announcement.title}</p>
              <p className="text-xs text-slate-500">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
              <p className="mt-1">{announcement.message}</p>
            </article>
          ))}
          {(announcements || []).length === 0 && <p>No announcements yet.</p>}
        </div>
      </section>
    </div>
  );
}
