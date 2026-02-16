"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
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

interface StandardCoverageEntry {
  id: number;
  code: string;
  description: string;
  grade_band: string | null;
  covered_by_assignment?: boolean;
  covered_by_unit_plan?: boolean;
  assignment_ids?: number[];
  unit_plan_ids?: number[];
}

interface FrameworkCoverage {
  framework_id: number;
  framework_name: string;
  subject: string | null;
  total_standards: number;
  covered_standards: number;
  coverage_percentage: number;
  covered: StandardCoverageEntry[];
  uncovered: StandardCoverageEntry[];
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

interface UnitPlan {
  id: number;
  title: string;
  current_version_id: number | null;
}

interface GapStandard extends StandardCoverageEntry {
  framework_id: number;
  framework_name: string;
}

type ViewMode = "matrix" | "gap";
type AlignmentType = "assignment" | "unit_plan";

function uniqueStandards(framework: FrameworkCoverage | null): StandardCoverageEntry[] {
  if (!framework) return [];

  const byId = new Map<number, StandardCoverageEntry>();
  framework.covered.forEach((standard) => byId.set(standard.id, standard));
  framework.uncovered.forEach((standard) => {
    if (!byId.has(standard.id)) {
      byId.set(standard.id, standard);
    }
  });

  return Array.from(byId.values()).sort((a, b) => a.code.localeCompare(b.code));
}

export default function CurriculumMapPage() {
  const { user } = useAuth();

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [frameworks, setFrameworks] = useState<StandardFramework[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedFramework, setSelectedFramework] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [yearCoverage, setYearCoverage] = useState<AcademicYearCoverageResponse | null>(null);
  const [courseCoverage, setCourseCoverage] = useState<Record<number, CourseCoverageResponse>>({});

  const [loading, setLoading] = useState(true);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCell, setSelectedCell] = useState<{ standardId: number; courseId: number } | null>(null);

  const [assignTarget, setAssignTarget] = useState<GapStandard | null>(null);
  const [assignCourseId, setAssignCourseId] = useState<string>("");
  const [alignmentType, setAlignmentType] = useState<AlignmentType>("assignment");
  const [unitPlans, setUnitPlans] = useState<UnitPlan[]>([]);
  const [selectedUnitPlanId, setSelectedUnitPlanId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const canAccess =
    user?.roles?.includes("admin") || user?.roles?.includes("curriculum_lead");

  const yearCourses = useMemo(
    () => courses.filter((course) => String(course.academic_year_id) === selectedYear),
    [courses, selectedYear],
  );

  const selectedFrameworkCoverage = useMemo(() => {
    if (!yearCoverage || !selectedFramework) return null;
    return (
      yearCoverage.frameworks.find(
        (framework) => String(framework.framework_id) === selectedFramework,
      ) || null
    );
  }, [selectedFramework, yearCoverage]);

  const matrixStandards = useMemo(
    () => uniqueStandards(selectedFrameworkCoverage),
    [selectedFrameworkCoverage],
  );

  const stats = useMemo(() => {
    const total = matrixStandards.length;
    const covered = selectedFrameworkCoverage?.covered_standards || 0;
    return {
      total,
      covered,
      gaps: total - covered,
      percentage: total > 0 ? Math.round((covered / total) * 100) : 0,
    };
  }, [matrixStandards.length, selectedFrameworkCoverage?.covered_standards]);

  const gapGroups = useMemo(() => {
    if (!yearCoverage) return [];

    return yearCoverage.frameworks
      .map((framework) => {
        const groupedByGrade = framework.uncovered.reduce<Record<string, GapStandard[]>>(
          (accumulator, standard) => {
            const gradeBand = standard.grade_band || "Unspecified";
            if (!accumulator[gradeBand]) {
              accumulator[gradeBand] = [];
            }

            accumulator[gradeBand].push({
              ...standard,
              framework_id: framework.framework_id,
              framework_name: framework.framework_name,
            });

            return accumulator;
          },
          {},
        );

        return {
          frameworkId: framework.framework_id,
          frameworkName: framework.framework_name,
          grades: Object.entries(groupedByGrade)
            .sort(([gradeA], [gradeB]) => gradeA.localeCompare(gradeB))
            .map(([grade, standards]) => ({
              grade,
              standards: standards.sort((a, b) => a.code.localeCompare(b.code)),
            })),
        };
      })
      .filter((framework) => framework.grades.length > 0);
  }, [yearCoverage]);

  const totalGapCount = useMemo(
    () =>
      gapGroups.reduce(
        (total, framework) =>
          total + framework.grades.reduce((gradeTotal, group) => gradeTotal + group.standards.length, 0),
        0,
      ),
    [gapGroups],
  );

  const fetchCoverage = useCallback(
    async (yearId: string) => {
      if (!yearId) return;

      setCoverageLoading(true);
      setError(null);

      try {
        const yearData = await apiFetch<AcademicYearCoverageResponse>(
          `/api/v1/academic_years/${yearId}/standards_coverage`,
        );
        setYearCoverage(yearData);

        const coursesForYear = courses.filter(
          (course) => String(course.academic_year_id) === yearId,
        );

        const courseResults = await Promise.allSettled(
          coursesForYear.map((course) =>
            apiFetch<CourseCoverageResponse>(`/api/v1/courses/${course.id}/standards_coverage`),
          ),
        );

        const nextCourseCoverage: Record<number, CourseCoverageResponse> = {};
        coursesForYear.forEach((course, index) => {
          const result = courseResults[index];
          if (result.status === "fulfilled") {
            nextCourseCoverage[course.id] = result.value;
          }
        });

        setCourseCoverage(nextCourseCoverage);
      } catch (requestError) {
        setYearCoverage(null);
        setCourseCoverage({});
        setError(requestError instanceof ApiError ? requestError.message : "Unable to load curriculum coverage.");
      } finally {
        setCoverageLoading(false);
      }
    },
    [courses],
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [years, frameworkData, allCourses] = await Promise.all([
          apiFetch<AcademicYear[]>("/api/v1/academic_years"),
          apiFetch<StandardFramework[]>("/api/v1/standard_frameworks"),
          apiFetch<Course[]>("/api/v1/courses"),
        ]);

        setAcademicYears(years);
        setFrameworks(frameworkData);
        setCourses(allCourses);

        if (years.length > 0) {
          setSelectedYear(String(years[0].id));
        }

        if (frameworkData.length > 0) {
          setSelectedFramework(String(frameworkData[0].id));
        }
      } catch (requestError) {
        setError(requestError instanceof ApiError ? requestError.message : "Unable to initialize curriculum map data.");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    void fetchCoverage(selectedYear);
    setSelectedCell(null);
  }, [fetchCoverage, selectedYear]);

  useEffect(() => {
    if (!yearCoverage || !selectedFramework) return;

    const exists = yearCoverage.frameworks.some(
      (framework) => String(framework.framework_id) === selectedFramework,
    );

    if (!exists && yearCoverage.frameworks.length > 0) {
      setSelectedFramework(String(yearCoverage.frameworks[0].framework_id));
    }
  }, [selectedFramework, yearCoverage]);

  useEffect(() => {
    if (!assignTarget || !assignCourseId || alignmentType !== "unit_plan") {
      setUnitPlans([]);
      setSelectedUnitPlanId("");
      return;
    }

    async function fetchUnitPlans() {
      try {
        const plans = await apiFetch<UnitPlan[]>(`/api/v1/unit_plans?course_id=${assignCourseId}`);
        setUnitPlans(plans);

        const withVersions = plans.filter((plan) => Boolean(plan.current_version_id));
        setSelectedUnitPlanId(withVersions.length > 0 ? String(withVersions[0].id) : "");
      } catch {
        setUnitPlans([]);
        setSelectedUnitPlanId("");
      }
    }

    void fetchUnitPlans();
  }, [alignmentType, assignCourseId, assignTarget]);

  function frameworkCoverageForCourse(courseId: number): FrameworkCoverage | null {
    const courseData = courseCoverage[courseId];
    if (!courseData || !selectedFramework) return null;

    return (
      courseData.frameworks.find(
        (framework) => String(framework.framework_id) === selectedFramework,
      ) || null
    );
  }

  function getCellCoverage(standardId: number, courseId: number): StandardCoverageEntry | null {
    const frameworkCoverage = frameworkCoverageForCourse(courseId);
    if (!frameworkCoverage) return null;

    return (
      frameworkCoverage.covered.find((standard) => standard.id === standardId) ||
      frameworkCoverage.uncovered.find((standard) => standard.id === standardId) ||
      null
    );
  }

  function isCovered(standardId: number, courseId: number): boolean {
    const frameworkCoverage = frameworkCoverageForCourse(courseId);
    if (!frameworkCoverage) return false;

    return frameworkCoverage.covered.some((standard) => standard.id === standardId);
  }

  function openAssignModal(gap: GapStandard): void {
    setAssignTarget(gap);
    setAssignError(null);
    setAlignmentType("assignment");

    const defaultCourse = yearCourses[0];
    setAssignCourseId(defaultCourse ? String(defaultCourse.id) : "");
    setSelectedUnitPlanId("");
  }

  function closeAssignModal(): void {
    setAssignTarget(null);
    setAssignCourseId("");
    setAlignmentType("assignment");
    setUnitPlans([]);
    setSelectedUnitPlanId("");
    setAssignError(null);
  }

  async function assignGapStandard(): Promise<void> {
    if (!assignTarget || !assignCourseId) {
      setAssignError("Select a target course first.");
      return;
    }

    setAssigning(true);
    setAssignError(null);

    try {
      if (alignmentType === "assignment") {
        const assignment = await apiFetch<{ id: number }>(
          `/api/v1/courses/${assignCourseId}/assignments`,
          {
            method: "POST",
            body: JSON.stringify({
              title: `Coverage Gap Alignment: ${assignTarget.code}`,
              description: `Auto-created from curriculum gap analysis for ${assignTarget.code}.`,
              assignment_type: "written",
              points_possible: 10,
            }),
          },
        );

        await apiFetch(`/api/v1/assignments/${assignment.id}/standards`, {
          method: "POST",
          body: JSON.stringify({ standard_ids: [assignTarget.id] }),
        });
      } else {
        if (!selectedUnitPlanId) {
          setAssignError("Select a unit plan with a current version.");
          setAssigning(false);
          return;
        }

        const selectedPlan = unitPlans.find(
          (plan) => String(plan.id) === selectedUnitPlanId,
        );

        if (!selectedPlan?.current_version_id) {
          setAssignError("The selected unit plan does not have a current version.");
          setAssigning(false);
          return;
        }

        await apiFetch(`/api/v1/unit_versions/${selectedPlan.current_version_id}/standards`, {
          method: "POST",
          body: JSON.stringify({ standard_ids: [assignTarget.id] }),
        });
      }

      await fetchCoverage(selectedYear);
      closeAssignModal();
    } catch (requestError) {
      setAssignError(requestError instanceof ApiError ? requestError.message : "Unable to create alignment.");
    } finally {
      setAssigning(false);
    }
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
          <header>
            <h1 className="text-2xl font-bold text-gray-900">Curriculum Map</h1>
            <p className="text-sm text-gray-600">
              Coverage matrix and gap analysis for standards alignment.
            </p>
          </header>

          {loading ? (
            <p className="text-sm text-gray-500">Loading curriculum map...</p>
          ) : (
            <>
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <section className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Standard Framework</label>
                  <select
                    value={selectedFramework}
                    onChange={(event) => {
                      setSelectedFramework(event.target.value);
                      setSelectedCell(null);
                    }}
                    className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    {frameworks.map((framework) => (
                      <option key={framework.id} value={framework.id}>
                        {framework.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode("matrix")}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      viewMode === "matrix"
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Coverage Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("gap")}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      viewMode === "gap"
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Gap Analysis
                  </button>
                </div>
              </section>

              <section className="flex flex-wrap gap-6 rounded-md bg-gray-50 px-4 py-3">
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
                  <span className="text-red-700">{stats.gaps}</span>
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
              </section>

              {coverageLoading ? (
                <p className="text-sm text-gray-500">Loading coverage data...</p>
              ) : viewMode === "matrix" ? (
                matrixStandards.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">No standards data available for this framework.</p>
                  </div>
                ) : (
                  <>
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
                          {matrixStandards.map((standard) => (
                            <tr key={standard.id} className="hover:bg-gray-50">
                              <td
                                className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-900"
                                title={standard.description}
                              >
                                {standard.code}
                              </td>
                              {yearCourses.map((course) => {
                                const covered = isCovered(standard.id, course.id);
                                const isSelected =
                                  selectedCell?.standardId === standard.id &&
                                  selectedCell?.courseId === course.id;

                                return (
                                  <td
                                    key={`${standard.id}-${course.id}`}
                                    className={`cursor-pointer px-3 py-2 text-center ${
                                      covered
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-50 text-red-400"
                                    } ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                                    onClick={() =>
                                      setSelectedCell({
                                        standardId: standard.id,
                                        courseId: course.id,
                                      })
                                    }
                                  >
                                    {covered ? "Covered" : "Gap"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {selectedCell && (
                      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                        <h3 className="text-sm font-medium text-blue-900">Coverage Detail</h3>
                        {(() => {
                          const standard = matrixStandards.find(
                            (entry) => entry.id === selectedCell.standardId,
                          );
                          const course = yearCourses.find(
                            (entry) => entry.id === selectedCell.courseId,
                          );
                          const cellData = getCellCoverage(
                            selectedCell.standardId,
                            selectedCell.courseId,
                          );
                          const covered = isCovered(
                            selectedCell.standardId,
                            selectedCell.courseId,
                          );

                          return (
                            <div className="mt-2 space-y-1 text-sm text-blue-800">
                              <p>
                                <span className="font-medium">Standard:</span> {standard?.code} —{" "}
                                {standard?.description}
                              </p>
                              <p>
                                <span className="font-medium">Course:</span> {course?.name}
                              </p>
                              <p>
                                <span className="font-medium">Status:</span>{" "}
                                {covered ? "Covered" : "Gap"}
                              </p>
                              {covered && (
                                <p>
                                  <span className="font-medium">Sources:</span>{" "}
                                  {cellData?.covered_by_assignment ? "Assignment " : ""}
                                  {cellData?.covered_by_unit_plan ? "Unit Plan" : ""}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )
              ) : (
                <section className="space-y-4">
                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Total Gaps</p>
                    <p className="text-2xl font-bold text-red-700">{totalGapCount}</p>
                  </div>

                  {gapGroups.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                      <p className="text-sm text-gray-500">No uncovered standards found for this academic year.</p>
                    </div>
                  ) : (
                    gapGroups.map((framework) => (
                      <article
                        key={`gap-framework-${framework.frameworkId}`}
                        className="rounded-lg border border-gray-200 bg-white p-4"
                      >
                        <h2 className="text-lg font-semibold text-gray-900">{framework.frameworkName}</h2>
                        <div className="mt-3 space-y-3">
                          {framework.grades.map((gradeGroup) => (
                            <section key={`grade-${framework.frameworkId}-${gradeGroup.grade}`}>
                              <h3 className="text-sm font-semibold text-gray-700">Grade Band: {gradeGroup.grade}</h3>
                              <div className="mt-2 space-y-2">
                                {gradeGroup.standards.map((gap) => (
                                  <div
                                    key={`gap-${framework.frameworkId}-${gap.id}`}
                                    className="rounded border border-red-100 bg-red-50 p-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-semibold text-red-900">{gap.code}</p>
                                        <p className="text-sm text-red-800">{gap.description}</p>
                                        <p className="text-xs text-red-700">
                                          Grade Band: {gap.grade_band || "Unspecified"}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openAssignModal(gap)}
                                        className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                      >
                                        Assign to Course
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </section>
              )}
            </>
          )}

          {assignTarget && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-lg rounded-lg bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Assign Gap Standard</h2>
                    <p className="text-sm text-gray-600">
                      {assignTarget.code} - {assignTarget.framework_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <select
                      value={assignCourseId}
                      onChange={(event) => setAssignCourseId(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select course</option>
                      {yearCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code ? `${course.code} - ${course.name}` : course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Alignment Method</p>
                    <div className="mt-1 flex gap-4 text-sm">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={alignmentType === "assignment"}
                          onChange={() => setAlignmentType("assignment")}
                        />
                        Create Assignment Alignment
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          checked={alignmentType === "unit_plan"}
                          onChange={() => setAlignmentType("unit_plan")}
                        />
                        Align to Unit Plan
                      </label>
                    </div>
                  </div>

                  {alignmentType === "unit_plan" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Plan</label>
                      <select
                        value={selectedUnitPlanId}
                        onChange={(event) => setSelectedUnitPlanId(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="">Select unit plan</option>
                        {unitPlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.title}
                            {plan.current_version_id ? "" : " (no current version)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {assignError && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{assignError}</p>}

                  <button
                    type="button"
                    onClick={() => void assignGapStandard()}
                    disabled={assigning}
                    className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {assigning ? "Applying..." : "Apply Alignment"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
