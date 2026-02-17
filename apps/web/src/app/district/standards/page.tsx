"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface FrameworkCoverage {
  framework_id: number;
  framework_name: string;
  subject: string | null;
  total_standards: number;
  covered_standards: number;
  coverage_pct: number;
}

interface SchoolCoverage {
  tenant_id: number;
  school: string;
  frameworks: FrameworkCoverage[];
}

interface CoverageRow {
  tenant_id: number;
  school: string;
  framework_name: string;
  subject: string;
  total_standards: number;
  covered_standards: number;
  coverage_pct: number;
}

export default function DistrictStandardsPage() {
  const [rows, setRows] = useState<SchoolCoverage[]>([]);
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoverage() {
      try {
        setLoading(true);
        setError(null);
        const payload = await apiFetch<SchoolCoverage[]>("/api/v1/district/standards_coverage");
        setRows(payload);
      } catch {
        setError("Unable to load standards comparison.");
      } finally {
        setLoading(false);
      }
    }

    fetchCoverage();
  }, []);

  const frameworkOptions = useMemo(() => {
    const names = rows.flatMap((row) =>
      row.frameworks.map((framework) => framework.framework_name),
    );
    return Array.from(new Set(names)).sort();
  }, [rows]);

  const flattenedRows = useMemo(() => {
    const selected = frameworkFilter === "all" ? null : frameworkFilter;
    return rows.flatMap((row) => {
      return row.frameworks
        .filter((framework) => (selected ? framework.framework_name === selected : true))
        .map(
          (framework): CoverageRow => ({
            tenant_id: row.tenant_id,
            school: row.school,
            framework_name: framework.framework_name,
            subject: framework.subject || "N/A",
            total_standards: framework.total_standards,
            covered_standards: framework.covered_standards,
            coverage_pct: framework.coverage_pct,
          }),
        );
    });
  }, [frameworkFilter, rows]);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Standards Comparison</h1>
          <p className="mt-1 text-sm text-gray-600">
            Coverage matrix by school and standards framework.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="framework-filter" className="text-sm font-medium text-gray-600">
            Framework
          </label>
          <select
            id="framework-filter"
            value={frameworkFilter}
            onChange={(event) => setFrameworkFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
          >
            <option value="all">All Frameworks</option>
            {frameworkOptions.map((framework) => (
              <option key={framework} value={framework}>
                {framework}
              </option>
            ))}
          </select>
        </div>
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
                Framework
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Coverage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Covered / Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="h-5 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              : flattenedRows.map((row, index) => {
                  const coverageClass = coverageCellClass(row.coverage_pct);
                  return (
                    <tr key={`${row.tenant_id}-${row.framework_name}-${index}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.school}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.framework_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.subject}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${coverageClass}`}
                        >
                          {row.coverage_pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.covered_standards} / {row.total_standards}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function coverageCellClass(coveragePct: number) {
  if (coveragePct >= 80) return "bg-green-100 text-green-700";
  if (coveragePct >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}
