"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";

type PickerTab = "courses" | "assignments" | "quizzes";

interface CourseRow {
  id: number;
  name: string;
  code?: string;
}

interface AssignmentRow {
  id: number;
  title: string;
  course_id: number;
}

interface QuizRow {
  id: number;
  title: string;
  course_id: number;
}

interface SelectedItem {
  key: string;
  title: string;
  url: string;
  custom_params: Record<string, string>;
}

interface DeepLinkResponse {
  jwt: string;
  return_url: string;
}

function originUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
}

function LtiDeepLinkContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registration_id");
  const returnUrlParam = searchParams.get("return_url") || "";

  const [activeTab, setActiveTab] = useState<PickerTab>("courses");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl = useMemo(() => {
    if (!returnUrlParam) return "";

    try {
      return decodeURIComponent(returnUrlParam);
    } catch {
      return returnUrlParam;
    }
  }, [returnUrlParam]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const rows = await apiFetch<CourseRow[]>("/api/v1/courses");
        setCourses(rows);
      } catch {
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }

    void loadCourses();
  }, []);

  useEffect(() => {
    async function loadCourseContent() {
      if (!selectedCourseId) {
        setAssignments([]);
        setQuizzes([]);
        return;
      }

      try {
        const [assignmentRows, quizRows] = await Promise.all([
          apiFetch<AssignmentRow[]>(`/api/v1/assignments?course_id=${selectedCourseId}`),
          apiFetch<QuizRow[]>(`/api/v1/courses/${selectedCourseId}/quizzes`),
        ]);
        setAssignments(assignmentRows);
        setQuizzes(quizRows);
      } catch {
        setError("Failed to load assignments and quizzes for the selected course.");
      }
    }

    void loadCourseContent();
  }, [selectedCourseId]);

  function addItem(item: SelectedItem) {
    setSelectedItems((previous) => {
      if (previous.some((entry) => entry.key === item.key)) {
        return previous;
      }

      return [...previous, item];
    });
  }

  function removeItem(key: string) {
    setSelectedItems((previous) => previous.filter((entry) => entry.key !== key));
  }

  async function sendSelection() {
    if (!registrationId || !returnUrl) {
      setError("Missing registration or return URL for deep linking.");
      return;
    }

    if (selectedItems.length === 0) {
      setError("Select at least one item to send.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await apiFetch<DeepLinkResponse>("/api/v1/lti/deep_link_response", {
        method: "POST",
        body: JSON.stringify({
          registration_id: Number(registrationId),
          return_url: returnUrl,
          items: selectedItems.map((item) => ({
            title: item.title,
            url: item.url,
            custom_params: item.custom_params,
          })),
        }),
      });

      const form = document.createElement("form");
      form.method = "POST";
      form.action = response.return_url || returnUrl;

      const jwtInput = document.createElement("input");
      jwtInput.type = "hidden";
      jwtInput.name = "JWT";
      jwtInput.value = response.jwt;

      form.appendChild(jwtInput);
      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to send deep link response.");
    } finally {
      setSending(false);
    }
  }

  const selectedCourse = courses.find((course) => String(course.id) === selectedCourseId) || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LTI Deep Linking</h1>
          <p className="text-sm text-gray-600">Select content to send back to the requesting platform.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </Link>
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("courses")}
            className={`rounded px-3 py-1.5 text-sm ${activeTab === "courses" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`rounded px-3 py-1.5 text-sm ${activeTab === "assignments" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab("quizzes")}
            className={`rounded px-3 py-1.5 text-sm ${activeTab === "quizzes" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            Quizzes
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading content...</p>}

        {!loading && (
          <div className="space-y-3">
            <div>
              <label htmlFor="deep-link-course-filter" className="mb-1 block text-xs font-medium text-gray-700">Course Filter</label>
              <select
                id="deep-link-course-filter"
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "courses" && (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-500">{course.code || "Course"}</p>
                    </div>
                    <button
                      onClick={() =>
                        addItem({
                          key: `course-${course.id}`,
                          title: course.name,
                          url: `${originUrl()}/teach/courses/${course.id}`,
                          custom_params: { resource_link_id: `course-${course.id}` },
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Select
                    </button>
                  </div>
                ))}
                {courses.length === 0 && <p className="text-sm text-gray-500">No courses available.</p>}
              </div>
            )}

            {activeTab === "assignments" && (
              <div className="space-y-2">
                {!selectedCourse && <p className="text-sm text-gray-500">Select a course to view assignments.</p>}
                {selectedCourse && assignments.length === 0 && (
                  <p className="text-sm text-gray-500">No assignments found for this course.</p>
                )}
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                    <p className="text-sm text-gray-900">{assignment.title}</p>
                    <button
                      onClick={() =>
                        addItem({
                          key: `assignment-${assignment.id}`,
                          title: assignment.title,
                          url: `${originUrl()}/teach/courses/${assignment.course_id}/assignments/${assignment.id}`,
                          custom_params: { resource_link_id: `assignment-${assignment.id}` },
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "quizzes" && (
              <div className="space-y-2">
                {!selectedCourse && <p className="text-sm text-gray-500">Select a course to view quizzes.</p>}
                {selectedCourse && quizzes.length === 0 && <p className="text-sm text-gray-500">No quizzes found for this course.</p>}
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
                    <p className="text-sm text-gray-900">{quiz.title}</p>
                    <button
                      onClick={() =>
                        addItem({
                          key: `quiz-${quiz.id}`,
                          title: quiz.title,
                          url: `${originUrl()}/assess/quizzes/${quiz.id}`,
                          custom_params: { resource_link_id: `quiz-${quiz.id}` },
                        })
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Selected Items</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <span key={item.key} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-800">
              {item.title}
              <button onClick={() => removeItem(item.key)} className="text-blue-700 hover:text-blue-900">
                Remove
              </button>
            </span>
          ))}
          {selectedItems.length === 0 && <p className="text-sm text-gray-500">No items selected yet.</p>}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => void sendSelection()}
            disabled={sending || selectedItems.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function LtiDeepLinkPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<p className="text-sm text-gray-500">Loading deep-link request...</p>}>
          <LtiDeepLinkContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
