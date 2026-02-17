"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface UserSummaryRow {
  tenant_id: number;
  school: string;
  teachers: number;
  students: number;
  admins: number;
  district_admins: number;
}

export default function DistrictUsersPage() {
  const [rows, setRows] = useState<UserSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await apiFetch<UserSummaryRow[]>("/api/v1/district/user_summary");
        setRows(payload);
      } catch {
        setError("Unable to load district user summary.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        teachers: acc.teachers + row.teachers,
        students: acc.students + row.students,
        admins: acc.admins + row.admins,
        district_admins: acc.district_admins + row.district_admins,
      }),
      { teachers: 0, students: 0, admins: 0, district_admins: 0 },
    );
  }, [rows]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">District Users</h1>
        <p className="mt-1 text-sm text-gray-600">
          School-by-school staffing totals across teachers, students, and administrators.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Teachers" value={totals.teachers} loading={loading} />
        <SummaryCard label="Students" value={totals.students} loading={loading} />
        <SummaryCard label="Admins" value={totals.admins} loading={loading} />
        <SummaryCard label="District Admins" value={totals.district_admins} loading={loading} />
      </section>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                School
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Teachers
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Students
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admins
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                District Admins
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="h-5 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.tenant_id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.school}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.teachers}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.students}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.admins}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{row.district_admins}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-100" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}
