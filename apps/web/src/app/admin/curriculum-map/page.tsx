"use client";

import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

interface AcademicYear {
  id: number;
  name: string;
}

interface StandardFramework {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  academic_year_id: number;
}

interface CoverageEntry {
  standard_id: number;
  code: string;
  description: string;
  grade_band: string | null;
  covered: boolean;
  unit_plan_ids: number[];
}

export default function CurriculumMapPage() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [frameworks, setFrameworks] = useState<StandardFramework[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");
  const [coverage, setCoverage] = useState<CoverageEntry[]>([]);
  const [courseCoverage, setCourseCoverage] = useState<
    Record<number, CoverageEntry[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    standardId: number;
    courseId: number;
  } | null>(null);

  const canAccess =
    user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  useEffect(() => {
    async function fetchData() {
      try {
        const [years, fws, allCourses] = await Promise.all([
          apiFetch<AcademicYear[]>("/api/v1/academic_years"),
          apiFetch<StandardFramework[]>("/api/v1/standard_frameworks"),
          apiFetch<Course[]>("/api/v1/courses"),
        ]);
        setAcademicYears(years);
        setFrameworks(fws);
        setCourses(allCourses);
        if (years.length > 0) setSelectedYear(String(years[0].id));
        if (fws.length > 0) setSelectedFramework(String(fws[0].id));
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedYear || !selectedFramework) return;
    async function fetchCoverage() {
      setCoverageLoading(true);
      try {
        // Get year-level coverage
        const yearCoverage = await apiFetch<CoverageEntry[]>(
          `/api/v1/academic_years/${selectedYear}/standards_coverage?standard_framework_id=${selectedFramework}`,
        );
        setCoverage(yearCoverage);

        // Get per-course coverage
        const yearCourses = courses.filter(
          (c) => c.academic_year_id === parseInt(selectedYear),
        );
        const courseResults: Record<number, CoverageEntry[]> = {};
        await Promise.all(
          yearCourses.map(async (course) => {
            try {
              const data = await apiFetch<CoverageEntry[]>(
                `/api/v1/courses/${course.id}/standards_coverage?standard_framework_id=${selectedFramework}`,
              );
              courseResults[course.id] = data;
            } catch {
              courseResults[course.id] = [];
            }
          }),
        );
        setCourseCoverage(courseResults);
      } catch {
        setCoverage([]);
      } finally {
        setCoverageLoading(false);
      }
    }
    fetchCoverage();
  }, [selectedYear, selectedFramework, courses]);

  const yearCourses = useMemo(
    () => courses.filter((c) => c.academic_year_id === parseInt(selectedYear)),
    [courses, selectedYear],
  );

  const stats = useMemo(() => {
    const total = coverage.length;
    const covered = coverage.filter((c) => c.covered).length;
    return { total, covered, percentage: total > 0 ? Math.round((covered / total) * 100) : 0 };
  }, [coverage]);

  function getCellCoverage(standardId: number, courseId: number): CoverageEntry | undefined {
    return courseCoverage[courseId]?.find((c) => c.standard_id === standardId);
  }

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Access restricted to administrators and curriculum leads.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Map</h1>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Selectors */}
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Standard Framework
                  </label>
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {frameworks.map((fw) => (
                      <option key={fw.id} value={fw.id}>
                        {fw.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex gap-6 rounded-md bg-gray-50 px-4 py-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Total Standards:</span>{" "}
                  <span className="text-gray-900">{stats.total}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Covered:</span>{" "}
                  <span className="text-green-700">{stats.covered}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Gaps:</span>{" "}
                  <span className="text-red-700">{stats.total - stats.covered}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Coverage:</span>{" "}
                  <span
                    className={
                      stats.percentage >= 80
                        ? "text-green-700"
                        : stats.percentage >= 50
                          ? "text-yellow-700"
                          : "text-red-700"
                    }
                  >
                    {stats.percentage}%
                  </span>
                </div>
              </div>

              {/* Coverage Matrix */}
              {coverageLoading ? (
                <p className="text-sm text-gray-500">Loading coverage data...</p>
              ) : coverage.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                  <p className="text-sm text-gray-500">No standards data available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left font-medium text-gray-700">
                          Standard
                        </th>
                        {yearCourses.map((course) => (
                          <th
                            key={course.id}
                            className="px-3 py-2 text-center font-medium text-gray-700"
                          >
                            {course.code || course.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coverage.map((std) => (
                        <tr key={std.standard_id} className="hover:bg-gray-50">
                          <td
                            className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-900"
                            title={std.description}
                          >
                            {std.code}
                          </td>
                          {yearCourses.map((course) => {
                            const cell = getCellCoverage(std.standard_id, course.id);
                            const isCovered = cell?.covered;
                            const isSelected =
                              selectedCell?.standardId === std.standard_id &&
                              selectedCell?.courseId === course.id;
                            return (
                              <td
                                key={course.id}
                                className={`cursor-pointer px-3 py-2 text-center ${
                                  isCovered
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-50 text-red-400"
                                } ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                                onClick={() =>
                                  setSelectedCell({
                                    standardId: std.standard_id,
                                    courseId: course.id,
                                  })
                                }
                              >
                                {isCovered ? "Covered" : "Gap"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cell Detail */}
              {selectedCell && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                  <h3 className="text-sm font-medium text-blue-900">Coverage Detail</h3>
                  {(() => {
                    const cell = getCellCoverage(
                      selectedCell.standardId,
                      selectedCell.courseId,
                    );
                    const std = coverage.find(
                      (c) => c.standard_id === selectedCell.standardId,
                    );
                    const course = yearCourses.find(
                      (c) => c.id === selectedCell.courseId,
                    );
                    return (
                      <div className="mt-2 space-y-1 text-sm text-blue-800">
                        <p>
                          <span className="font-medium">Standard:</span> {std?.code} —{" "}
                          {std?.description}
                        </p>
                        <p>
                          <span className="font-medium">Course:</span> {course?.name}
                        </p>
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          {cell?.covered ? "Covered" : "Gap"}
                        </p>
                        {cell?.unit_plan_ids && cell.unit_plan_ids.length > 0 && (
                          <p>
                            <span className="font-medium">Unit Plan IDs:</span>{" "}
                            {cell.unit_plan_ids.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
