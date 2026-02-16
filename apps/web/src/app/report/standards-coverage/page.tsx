"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch, ApiError } from "@/lib/api";

interface AcademicYear {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  academic_year_id: number;
}

interface CoveredStandard {
  id: number;
  code: string;
  description: string;
  grade_band: string | null;
  covered_by_assignment?: boolean;
  covered_by_unit_plan?: boolean;
}

interface FrameworkCoverage {
  framework_id: number;
  framework_name: string;
  subject: string | null;
  total_standards: number;
  covered_standards: number;
  coverage_percentage: number;
  covered: CoveredStandard[];
  uncovered: CoveredStandard[];
}

interface AcademicYearCoverageResponse {
  academic_year_id: number;
  academic_year: string;
  frameworks: FrameworkCoverage[];
}

interface CourseCoverageResponse {
  course_id: number;
  course_name: string;
  frameworks: FrameworkCoverage[];
}

const REPORT_ROLES = ["admin", "curriculum_lead", "teacher"];

function progressBarClass(percentage: number): string {
  if (percentage > 80) return "bg-green-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function percentLabel(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function StandardsCoverageReportPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [yearCoverage, setYearCoverage] = useState<AcademicYearCoverageResponse | null>(null);
  const [courseCoverage, setCourseCoverage] = useState<CourseCoverageResponse | null>(null);
  const [expandedFrameworkIds, setExpandedFrameworkIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearCourses = useMemo(
    () => courses.filter((course) => String(course.academic_year_id) === selectedYearId),
    [courses, selectedYearId],
  );

  const summaryStats = useMemo(() => {
    const frameworks = yearCoverage?.frameworks || [];
    const totalStandards = frameworks.reduce(
      (total, framework) => total + framework.total_standards,
      0,
    );
    const coveredStandards = frameworks.reduce(
      (total, framework) => total + framework.covered_standards,
      0,
    );

    return {
      totalFrameworks: frameworks.length,
      overallCoverage:
        totalStandards > 0 ? Number(((coveredStandards * 100) / totalStandards).toFixed(1)) : 0,
      fullyUncoveredStandards: frameworks.reduce(
        (total, framework) => total + framework.uncovered.length,
        0,
      ),
    };
  }, [yearCoverage]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [years, allCourses] = await Promise.all([
        apiFetch<AcademicYear[]>("/api/v1/academic_years"),
        apiFetch<Course[]>("/api/v1/courses"),
      ]);

      setAcademicYears(years);
      setCourses(allCourses);

      if (years.length > 0) {
        const firstYearId = String(years[0].id);
        setSelectedYearId(firstYearId);

        const firstCourseInYear = allCourses.find(
          (course) => String(course.academic_year_id) === firstYearId,
        );
        setSelectedCourseId(firstCourseInYear ? String(firstCourseInYear.id) : "");
      }
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load standards coverage report.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchYearCoverage = useCallback(async (yearId: string) => {
    if (!yearId) return;

    setCoverageLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AcademicYearCoverageResponse>(
        `/api/v1/academic_years/${yearId}/standards_coverage`,
      );
      setYearCoverage(data);
    } catch (requestError) {
      setYearCoverage(null);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load academic year standards coverage.",
      );
    } finally {
      setCoverageLoading(false);
    }
  }, []);

  const fetchCourseCoverage = useCallback(async (courseId: string) => {
    if (!courseId) {
      setCourseCoverage(null);
      return;
    }

    setCourseLoading(true);
    setError(null);
    try {
      const data = await apiFetch<CourseCoverageResponse>(
        `/api/v1/courses/${courseId}/standards_coverage`,
      );
      setCourseCoverage(data);
    } catch (requestError) {
      setCourseCoverage(null);
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load course drill-down.",
      );
    } finally {
      setCourseLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (!selectedYearId) return;
    void fetchYearCoverage(selectedYearId);
  }, [fetchYearCoverage, selectedYearId]);

  useEffect(() => {
    if (!selectedYearId) return;

    if (!selectedCourseId) {
      const firstCourse = yearCourses[0];
      if (firstCourse) {
        setSelectedCourseId(String(firstCourse.id));
      }
      return;
    }

    const stillValid = yearCourses.some((course) => String(course.id) === selectedCourseId);

    if (!stillValid) {
      const firstCourse = yearCourses[0];
      setSelectedCourseId(firstCourse ? String(firstCourse.id) : "");
    }
  }, [selectedCourseId, selectedYearId, yearCourses]);

  useEffect(() => {
    if (!selectedCourseId) return;
    void fetchCourseCoverage(selectedCourseId);
  }, [fetchCourseCoverage, selectedCourseId]);

  function toggleFramework(frameworkId: number): void {
    setExpandedFrameworkIds((current) =>
      current.includes(frameworkId)
        ? current.filter((id) => id !== frameworkId)
        : [frameworkId, ...current],
    );
  }

  return (
    <ProtectedRoute requiredRoles={REPORT_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Standards Coverage</h1>
            <p className="text-sm text-gray-600">
              Framework-level coverage, uncovered standards, and course drill-down details.
            </p>
          </header>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading standards coverage report...</p>
          ) : (
            <>
              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Total Frameworks
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {summaryStats.totalFrameworks}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Overall Coverage
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {percentLabel(summaryStats.overallCoverage)}
                    </p>
                  </div>
                  <div className="rounded border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Fully Uncovered Standards
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-red-700">
                      {summaryStats.fullyUncoveredStandards}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                    <select
                      value={selectedYearId}
                      onChange={(event) => setSelectedYearId(event.target.value)}
                      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {coverageLoading ? (
                  <p className="mt-4 text-sm text-gray-500">Loading framework coverage...</p>
                ) : !yearCoverage || yearCoverage.frameworks.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    No framework coverage data is available for this academic year.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {yearCoverage.frameworks.map((framework) => {
                      const expanded = expandedFrameworkIds.includes(framework.framework_id);
                      return (
                        <article
                          key={framework.framework_id}
                          className="rounded border border-gray-200 bg-gray-50 p-4"
                        >
                          <button
                            type="button"
                            onClick={() => toggleFramework(framework.framework_id)}
                            className="w-full text-left"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                  {framework.framework_name}
                                </h2>
                                <p className="text-xs text-gray-500">
                                  {framework.subject || "General"}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-800">
                                {framework.covered_standards} of {framework.total_standards}{" "}
                                standards covered
                              </p>
                            </div>

                            <div
                              role="progressbar"
                              aria-valuenow={Math.min(100, framework.coverage_percentage)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${framework.framework_name} coverage`}
                              className="mt-3 h-2 w-full rounded bg-gray-200"
                            >
                              <div
                                className={`h-2 rounded ${progressBarClass(framework.coverage_percentage)}`}
                                style={{
                                  width: `${Math.min(100, framework.coverage_percentage)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-600">
                              {percentLabel(framework.coverage_percentage)}
                            </p>
                          </button>

                          {expanded && (
                            <div className="mt-3 rounded border border-gray-200 bg-white p-3">
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                Uncovered Standards
                              </h3>
                              {framework.uncovered.length === 0 ? (
                                <p className="mt-2 text-sm text-green-700">
                                  All standards in this framework are covered.
                                </p>
                              ) : (
                                <ul className="mt-2 space-y-2">
                                  {framework.uncovered.map((standard) => (
                                    <li
                                      key={standard.id}
                                      className="rounded border border-red-100 bg-red-50 p-2"
                                    >
                                      <p className="text-sm font-medium text-red-900">
                                        {standard.code}
                                        {standard.grade_band ? ` (${standard.grade_band})` : ""}
                                      </p>
                                      <p className="text-xs text-red-800">{standard.description}</p>
                                      <p className="mt-1 text-xs font-medium text-red-700">
                                        This standard has no aligned content.
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Course Drill-Down</h2>
                <p className="text-sm text-gray-600">
                  Compare covered standards by source type (assignment vs. unit plan) for a specific
                  course.
                </p>

                <div className="mt-3 flex flex-wrap items-end gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <select
                      value={selectedCourseId}
                      onChange={(event) => setSelectedCourseId(event.target.value)}
                      className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select a course</option>
                      {yearCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code ? `${course.code} - ${course.name}` : course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {courseLoading ? (
                  <p className="mt-4 text-sm text-gray-500">Loading course coverage...</p>
                ) : !selectedCourseId || !courseCoverage ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Select a course to inspect coverage sources.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {courseCoverage.frameworks.map((framework) => (
                      <article
                        key={`course-framework-${framework.framework_id}`}
                        className="rounded border border-gray-200 bg-gray-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {framework.framework_name}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {percentLabel(framework.coverage_percentage)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          {framework.covered_standards} of {framework.total_standards} standards
                          covered
                        </p>

                        {framework.covered.length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            No covered standards for this framework in the selected course.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {framework.covered.map((standard) => (
                              <div
                                key={standard.id}
                                className="rounded border border-gray-200 bg-white p-2"
                              >
                                <p className="text-sm font-medium text-gray-900">{standard.code}</p>
                                <p className="text-xs text-gray-600">{standard.description}</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {standard.covered_by_assignment && (
                                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                      Assignment Alignment
                                    </span>
                                  )}
                                  {standard.covered_by_unit_plan && (
                                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                      Unit Plan Alignment
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
