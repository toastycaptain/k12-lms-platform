"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import { useGuardianGrades } from "@/hooks/useGuardian";

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
}

export default function GuardianGradesPage() {
  const params = useParams();
  const studentId = String(params.studentId);
  const { data: grades, isLoading, error } = useGuardianGrades(studentId);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading grades...</p>;
  }

  if (error) {
    return <EmptyState title="Unable to load grades" description="Try again in a moment." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Grades</h1>
        <Link
          href={`/guardian/students/${studentId}`}
          className="text-sm text-blue-700 hover:text-blue-800"
        >
          ← Back to overview
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Assignment</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Course</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Score</th>
              <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(grades || []).map((grade) => (
              <tr key={grade.id}>
                <td className="px-4 py-2">{grade.assignment_title}</td>
                <td className="px-4 py-2">{grade.course_name}</td>
                <td className="px-4 py-2">{formatPercent(grade.percentage)}</td>
                <td className="px-4 py-2 capitalize">{grade.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
