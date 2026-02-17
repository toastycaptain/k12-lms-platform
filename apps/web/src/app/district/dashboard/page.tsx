"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

interface DistrictUserSummaryRow {
  tenant_id: number;
  school: string;
  teachers: number;
  students: number;
  admins: number;
  district_admins: number;
}

interface DistrictCoverageRow {
  tenant_id: number;
  school: string;
  frameworks_count: number;
  standards_count: number;
  covered_standards: number;
  coverage_pct: number;
}

export default function DistrictDashboardPage() {
  const [userSummary, setUserSummary] = useState<DistrictUserSummaryRow[]>([]);
  const [coverageRows, setCoverageRows] = useState<DistrictCoverageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDistrictData() {
      try {
        setLoading(true);
        setError(null);
        const [summary, coverage] = await Promise.all([
          apiFetch<DistrictUserSummaryRow[]>("/api/v1/district/user_summary"),
          apiFetch<DistrictCoverageRow[]>("/api/v1/district/standards_coverage"),
        ]);
        setUserSummary(summary);
        setCoverageRows(coverage);
      } catch {
        setError("Unable to load district dashboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchDistrictData();
  }, []);

  const totals = useMemo(() => {
    const schools = userSummary.length;
    const teachers = userSummary.reduce((sum, row) => sum + row.teachers, 0);
    const students = userSummary.reduce((sum, row) => sum + row.students, 0);
    const avgCoverage =
      coverageRows.length === 0
        ? 0
        : coverageRows.reduce((sum, row) => sum + row.coverage_pct, 0) / coverageRows.length;

    return {
      schools,
      teachers,
      students,
      avgCoverage: Number(avgCoverage.toFixed(1)),
    };
  }, [coverageRows, userSummary]);

  const coverageByTenant = useMemo(() => {
    return coverageRows.reduce(
      (acc, row) => {
        acc[row.tenant_id] = row;
        return acc;
      },
      {} as Record<number, DistrictCoverageRow>,
    );
  }, [coverageRows]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">District Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Compare school performance and manage district-wide curriculum delivery.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Schools" value={totals.schools} loading={loading} />
        <MetricCard label="Teachers" value={totals.teachers} loading={loading} />
        <MetricCard label="Students" value={totals.students} loading={loading} />
        <MetricCard
          label="Avg Standards Coverage"
          value={`${totals.avgCoverage}%`}
          loading={loading}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {loading
          ? Array.from({ length: 2 }).map((_, index) => (
              <div key={`loading-${index}`} className="h-36 animate-pulse rounded-lg bg-gray-100" />
            ))
          : userSummary.map((entry) => {
              const coverage = coverageByTenant[entry.tenant_id];
              return (
                <article
                  key={entry.tenant_id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">{entry.school}</h2>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                      {coverage ? `${coverage.coverage_pct}% covered` : "No coverage data"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Teachers</dt>
                      <dd className="font-semibold text-gray-900">{entry.teachers}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Students</dt>
                      <dd className="font-semibold text-gray-900">{entry.students}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Admins</dt>
                      <dd className="font-semibold text-gray-900">{entry.admins}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/district/schools"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          View Schools
        </Link>
        <Link
          href="/district/standards"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Standards Comparison
        </Link>
        <Link
          href="/district/templates"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Push Templates
        </Link>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string;
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
