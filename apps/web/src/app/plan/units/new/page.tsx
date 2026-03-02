"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SUBJECT_OPTIONS = ["Math", "Science", "ELA", "Social Studies", "Arts", "PE"];
const GRADE_OPTIONS = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

interface CurriculumContext {
  subject_label?: string;
  grade_label?: string;
  unit_label?: string;
  subject_options?: string[];
  grade_or_stage_options?: string[];
  framework_defaults?: string[];
}

interface Course {
  id: number;
  name: string;
  effective_curriculum_profile_key?: string;
  effective_curriculum_source?: string;
  curriculum_context?: CurriculumContext;
}

interface UnitPlan {
  id: number;
}

export default function NewUnitPlanPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { preferredSubjects, preferredGrades } = useMemo(() => {
    const preferences = user?.preferences || {};
    return {
      preferredSubjects: Array.isArray(preferences.subjects)
        ? (preferences.subjects as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      preferredGrades: Array.isArray(preferences.grade_levels)
        ? (preferences.grade_levels as unknown[]).filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };
  }, [user?.preferences]);

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === courseId),
    [courseId, courses],
  );
  const resolvedCurriculumContext = selectedCourse?.curriculum_context;
  const gradeLabel = resolvedCurriculumContext?.grade_label || "Grade Level";
  const subjectLabel = resolvedCurriculumContext?.subject_label || "Course Subject";
  const unitLabel = resolvedCurriculumContext?.unit_label || "Unit";
  const availableSubjectOptions =
    resolvedCurriculumContext?.subject_options &&
    resolvedCurriculumContext.subject_options.length > 0
      ? resolvedCurriculumContext.subject_options
      : SUBJECT_OPTIONS;
  const availableGradeOptions =
    resolvedCurriculumContext?.grade_or_stage_options &&
    resolvedCurriculumContext.grade_or_stage_options.length > 0
      ? resolvedCurriculumContext.grade_or_stage_options
      : GRADE_OPTIONS;
  const preferredSubjectValue =
    preferredSubjects.find((subject) => availableSubjectOptions.includes(subject)) || "";
  const preferredGradeValue =
    preferredGrades.find((grade) => availableGradeOptions.includes(grade)) || "";
  const selectedSubjectValue =
    selectedSubject === null
      ? preferredSubjectValue
      : selectedSubject === ""
        ? ""
        : availableSubjectOptions.includes(selectedSubject)
          ? selectedSubject
          : preferredSubjectValue;
  const selectedGradeValue =
    selectedGrade === null
      ? preferredGradeValue
      : selectedGrade === ""
        ? ""
        : availableGradeOptions.includes(selectedGrade)
          ? selectedGrade
          : preferredGradeValue;

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await apiFetch<Course[]>("/api/v1/courses");
        setCourses(data);
        if (data.length > 0) {
          setCourseId(String(data[0].id));
        }
      } catch {
        setError("Unable to load courses.");
      }
    }

    fetchCourses();
  }, []);

  async function handleCreate() {
    if (!selectedGradeValue || !selectedSubjectValue) {
      setError("Please select a grade level and subject before creating material.");
      return;
    }

    if (!title.trim()) {
      setError("Unit title is required.");
      return;
    }

    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      if (user) {
        const preferences = user.preferences || {};
        const currentSubjects = Array.isArray(preferences.subjects)
          ? (preferences.subjects as unknown[]).filter(
              (value): value is string => typeof value === "string",
            )
          : [];
        const currentGrades = Array.isArray(preferences.grade_levels)
          ? (preferences.grade_levels as unknown[]).filter(
              (value): value is string => typeof value === "string",
            )
          : [];

        const nextSubjects = [
          selectedSubjectValue,
          ...currentSubjects.filter((value) => value !== selectedSubjectValue),
        ];
        const nextGrades = [
          selectedGradeValue,
          ...currentGrades.filter((value) => value !== selectedGradeValue),
        ];

        try {
          await apiFetch("/api/v1/me", {
            method: "PATCH",
            body: JSON.stringify({
              preferences: {
                ...preferences,
                subjects: nextSubjects,
                grade_levels: nextGrades,
              },
            }),
          });
          await refresh();
        } catch {
          // Do not block unit creation if preference persistence fails.
        }
      }

      const unit = await apiFetch<UnitPlan>("/api/v1/unit_plans", {
        method: "POST",
        body: JSON.stringify({
          unit_plan: {
            title: title.trim(),
            course_id: Number(courseId),
            status: "draft",
          },
        }),
      });
      router.push(`/plan/units/${unit.id}`);
    } catch {
      setError("Failed to create unit plan. Check your permissions and try again.");
      setCreating(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/plan/units" className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Unit Plan</h1>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {selectedCourse?.effective_curriculum_profile_key && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              Using curriculum profile:{" "}
              <span className="font-semibold">
                {selectedCourse.effective_curriculum_profile_key}
              </span>{" "}
              <span className="text-blue-700">
                ({selectedCourse.effective_curriculum_source || "system"})
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="unit-grade-level" className="block text-sm font-medium text-gray-700">
                {gradeLabel}
              </label>
              <select
                id="unit-grade-level"
                value={selectedGradeValue}
                onChange={(event) => setSelectedGrade(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a grade level</option>
                {availableGradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="unit-course-subject"
                className="block text-sm font-medium text-gray-700"
              >
                {subjectLabel}
              </label>
              <select
                id="unit-course-subject"
                value={selectedSubjectValue}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a subject</option>
                {availableSubjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="unit-title" className="block text-sm font-medium text-gray-700">
              {unitLabel} Title
            </label>
            <input
              id="unit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ecosystems and Biodiversity"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="unit-course" className="block text-sm font-medium text-gray-700">
              Course
            </label>
            <select
              id="unit-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Unit Plan"}
            </button>
            <button
              onClick={() => router.push("/plan/units")}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
