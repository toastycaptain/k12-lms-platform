"use client";

import Link from "next/link";
import { EmptyState } from "@k12/ui";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useGuardianStudents } from "@/hooks/useGuardian";

export default function GuardianDashboardPage() {
  const { data: students, isLoading, error } = useGuardianStudents();

  if (isLoading) {
    return <ListSkeleton />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load students"
        description="Please refresh to retry loading linked students."
      />
    );
  }

  if (!students || students.length === 0) {
    return (
      <EmptyState
        title="No linked students"
        description="Your account is not yet linked to any students."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
        <p className="mt-1 text-sm text-gray-600">
          Read-only view of grades, assignments, and announcements for linked students.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {students.map((student) => (
          <article
            key={student.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-slate-600">{student.email}</p>
            <p className="mt-2 text-sm text-slate-700">{student.course_count} enrolled courses</p>

            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {student.courses.slice(0, 3).map((course) => (
                <li key={course.id}>• {course.name}</li>
              ))}
            </ul>

            <div className="mt-4">
              <Link
                href={`/guardian/students/${student.id}`}
                className="text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                View student details →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
