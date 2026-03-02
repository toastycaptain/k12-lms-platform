"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "@k12/ui";
import { useGuardianAttendance } from "@/hooks/useGuardian";

function statusClass(status: string): string {
  if (status === "present") return "bg-emerald-50 text-emerald-700";
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "tardy") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function GuardianAttendancePage() {
  const params = useParams();
  const studentId = String(params.studentId);
  const { data, isLoading, error } = useGuardianAttendance(studentId);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading attendance...</p>;
  }

  if (error) {
    return <EmptyState title="Unable to load attendance" description="Try again in a moment." />;
  }

  const summary = data?.summary;
  const records = data?.records || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="mt-1 text-sm text-slate-600">Recent daily attendance by class.</p>
        </div>
        <Link
          href={`/guardian/students/${studentId}`}
          className="text-sm text-blue-700 hover:text-blue-800"
        >
          ← Back to overview
        </Link>
      </div>

      {summary ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{summary.total}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Present</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{summary.present}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Absent</p>
            <p className="mt-1 text-xl font-semibold text-rose-700">{summary.absent}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tardy</p>
            <p className="mt-1 text-xl font-semibold text-amber-700">{summary.tardy}</p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Excused</p>
            <p className="mt-1 text-xl font-semibold text-slate-700">{summary.excused}</p>
          </article>
        </section>
      ) : null}

      {records.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="No attendance has been recorded yet."
        />
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{record.course_name || "Course"}</p>
                  <p className="text-slate-500">{record.section_name || "Section"}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusClass(record.status)}`}
                >
                  {record.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                <span>{new Date(record.occurred_on).toLocaleDateString()}</span>
                {record.recorded_by ? <span>Recorded by {record.recorded_by.name}</span> : null}
                {record.notes ? <span>{record.notes}</span> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
