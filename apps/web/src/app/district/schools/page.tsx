"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface SchoolRow {
  id: number;
  name: string;
  address: string | null;
  timezone: string;
  tenant_id: number;
}

interface UserSummaryRow {
  tenant_id: number;
  teachers: number;
  students: number;
  admins: number;
}

export default function DistrictSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<UserSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [schoolsData, summaryData] = await Promise.all([
          apiFetch<SchoolRow[]>("/api/v1/district/schools"),
          apiFetch<UserSummaryRow[]>("/api/v1/district/user_summary"),
        ]);
        setSchools(schoolsData);
        setSummaryRows(summaryData);
      } catch {
        setError("Unable to load district school data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const summaryByTenant = useMemo(() => {
    return summaryRows.reduce(
      (acc, row) => {
        acc[row.tenant_id] = row;
        return acc;
      },
      {} as Record<number, UserSummaryRow>,
    );
  }, [summaryRows]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">District Schools</h1>
        <p className="mt-1 text-sm text-gray-600">
          School-level roster and staffing metrics across your district.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                School
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Time Zone
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
              : schools.map((school) => {
                  const summary = summaryByTenant[school.tenant_id];
                  return (
                    <tr key={school.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <p className="font-medium">{school.name}</p>
                        {school.address && (
                          <p className="text-xs text-gray-500">{school.address}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{school.timezone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{summary?.teachers ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{summary?.students ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{summary?.admins ?? 0}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
