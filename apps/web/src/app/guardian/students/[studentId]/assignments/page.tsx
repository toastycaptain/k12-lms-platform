"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import { useGuardianAssignments } from "@/hooks/useGuardian";

export default function GuardianAssignmentsPage() {
  const params = useParams();
  const studentId = String(params.studentId);
  const { data: assignments, isLoading, error } = useGuardianAssignments(studentId);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading assignments...</p>;
  }

  if (error) {
    return <EmptyState title="Unable to load assignments" description="Try again in a moment." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <Link
          href={`/guardian/students/${studentId}`}
          className="text-sm text-blue-700 hover:text-blue-800"
        >
          ← Back to overview
        </Link>
      </div>

      <div className="space-y-3">
        {(assignments || []).map((assignment) => (
          <article key={assignment.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">{assignment.title}</h2>
                <p className="text-sm text-slate-600">{assignment.course_name}</p>
                {assignment.due_at && (
                  <p className="text-xs text-slate-500">
                    Due {new Date(assignment.due_at).toLocaleString()}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                {assignment.status}
              </span>
            </div>
          </article>
        ))}
        {(assignments || []).length === 0 && (
          <EmptyState
            title="No assignments"
            description="No assignments available for this student."
          />
        )}
      </div>
    </div>
  );
}
