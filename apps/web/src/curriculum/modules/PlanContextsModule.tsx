"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, EmptyState, useToast } from "@k12/ui";
import { apiFetch, ApiError } from "@/lib/api";
import { usePlanningContexts } from "@/curriculum/contexts/hooks";
import { useCourses } from "@/hooks/useCourses";
import { useSchool } from "@/lib/school-context";

export default function PlanContextsModule() {
  const { addToast } = useToast();
  const { schoolId } = useSchool();
  const { data: contexts = [], mutate, isLoading } = usePlanningContexts({ per_page: 200 });
  const { data: courses = [] } = useCourses({ per_page: 200 });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("course");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);

  async function createContext(): Promise<void> {
    setSubmitting(true);
    setError(null);

    const selectedCourses = selectedCourseIds
      .map((courseId) => courseMap.get(Number(courseId)))
      .filter((course): course is NonNullable<typeof course> => Boolean(course));
    const academicYearId = selectedCourses[0]?.academic_year_id ?? courses[0]?.academic_year_id;

    if (!schoolId || !academicYearId || !name.trim()) {
      setError("Name and an academic-year-backed course selection are required.");
      setSubmitting(false);
      return;
    }

    try {
      await apiFetch("/api/v1/planning_contexts", {
        method: "POST",
        body: JSON.stringify({
          planning_context: {
            school_id: Number(schoolId),
            academic_year_id: academicYearId,
            kind,
            name: name.trim(),
            course_ids: selectedCourses.map((course) => course.id),
          },
        }),
      });
      addToast("success", "Planning context created.");
      setShowCreateForm(false);
      setName("");
      setSelectedCourseIds([]);
      await mutate();
    } catch (createError) {
      const message =
        createError instanceof ApiError
          ? createError.message
          : "Unable to create planning context.";
      setError(message);
      addToast("error", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning contexts</h1>
          <p className="text-sm text-gray-600">
            Organize curriculum planning by course, team, programme, or interdisciplinary scope.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowCreateForm((current) => !current)}>
          {showCreateForm ? "Hide form" : "New context"}
        </Button>
      </div>

      {showCreateForm && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Context name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="course">Course</option>
              <option value="grade_team">Grade team</option>
              <option value="interdisciplinary">Interdisciplinary</option>
              <option value="programme">Programme</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="planning-context-courses"
              className="block text-sm font-medium text-gray-700"
            >
              Linked courses
            </label>
            <select
              id="planning-context-courses"
              multiple
              value={selectedCourseIds}
              onChange={(event) =>
                setSelectedCourseIds(
                  Array.from(event.target.selectedOptions).map((option) => option.value),
                )
              }
              className="mt-1 min-h-40 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createContext()} disabled={submitting}>
              {submitting ? "Creating..." : "Create context"}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading planning contexts...</p>
      ) : contexts.length === 0 ? (
        <EmptyState
          title="No planning contexts yet"
          description="Create a planning context to group curriculum documents by school and team."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {contexts.map((context) => (
            <Link
              key={context.id}
              href={`/plan/contexts/${context.id}`}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">{context.kind.replace(/_/g, " ")}</p>
                  <h2 className="text-lg font-semibold text-gray-900">{context.name}</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {context.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {context.course_ids.length} linked course
                {context.course_ids.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
