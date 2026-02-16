"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
  course_id: number;
  current_version_id: number | null;
  created_at: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface UnitVersion {
  id: number;
  version_number: number;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function UnitLibraryPage() {
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [versionCounts, setVersionCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCourse, setFilterCourse] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [units, allCourses] = await Promise.all([
          apiFetch<UnitPlan[]>("/api/v1/unit_plans"),
          apiFetch<Course[]>("/api/v1/courses"),
        ]);
        setUnitPlans(units);
        setCourses(allCourses);

        // Fetch version counts for each unit
        const counts: Record<number, number> = {};
        await Promise.all(
          units.map(async (unit) => {
            try {
              const versions = await apiFetch<UnitVersion[]>(
                `/api/v1/unit_plans/${unit.id}/versions`,
              );
              counts[unit.id] = versions.length;
            } catch {
              counts[unit.id] = 0;
            }
          }),
        );
        setVersionCounts(counts);
      } catch {
        // API may not be available
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const courseMap = useMemo(() => {
    const map: Record<number, Course> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [courses]);

  const filteredUnits = useMemo(() => {
    return unitPlans.filter((unit) => {
      if (filterStatus !== "all" && unit.status !== filterStatus) return false;
      if (filterCourse !== "all" && unit.course_id !== Number(filterCourse)) return false;
      if (searchQuery && !unit.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [unitPlans, filterStatus, filterCourse, searchQuery]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Unit Library</h1>
            <Link
              href="/plan/units/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Unit Plan
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Unit Cards */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : filteredUnits.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-500">
                {unitPlans.length === 0
                  ? "No unit plans yet. Create your first one!"
                  : "No units match your filters."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => (
                <Link
                  key={unit.id}
                  href={`/plan/units/${unit.id}`}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
                >
                  <h3 className="font-medium text-gray-900">{unit.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {courseMap[unit.course_id]?.name || "Unknown Course"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge status={unit.status} />
                    <span className="text-xs text-gray-400">
                      {versionCounts[unit.id] ?? 0} version
                      {(versionCounts[unit.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
