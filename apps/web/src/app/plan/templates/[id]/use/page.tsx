"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface Template {
  id: number;
  name: string;
  subject: string | null;
  grade_level: string | null;
  description: string | null;
  status: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface UnitPlan {
  id: number;
}

export default function UseTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tmpl, courseList] = await Promise.all([
          apiFetch<Template>(`/api/v1/templates/${templateId}`),
          apiFetch<Course[]>("/api/v1/courses"),
        ]);
        setTemplate(tmpl);
        setCourses(courseList);

        if (tmpl.status !== "published") {
          setError("This template is no longer available for use.");
        }
      } catch {
        setError("Failed to load template.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [templateId]);

  const handleCreate = async () => {
    if (!selectedCourseId) {
      setError("Please select a course.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const unitPlan = await apiFetch<UnitPlan>(`/api/v1/templates/${templateId}/create_unit`, {
        method: "POST",
        body: JSON.stringify({ course_id: parseInt(selectedCourseId) }),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/plan/units/${unitPlan.id}`);
      }, 1000);
    } catch {
      setError("Failed to create unit from template. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-lg space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/plan/templates" className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Back to Templates
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Use Template</h1>
          </div>

          {success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              Unit plan created successfully! Redirecting...
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {template && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900">{template.name}</h2>
              {template.subject && <p className="mt-1 text-sm text-gray-500">{template.subject}</p>}
              {template.grade_level && (
                <p className="text-xs text-gray-400">{template.grade_level}</p>
              )}
              {template.description && (
                <p className="mt-2 text-sm text-gray-600">{template.description}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Select a Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Choose a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !selectedCourseId || template?.status !== "published"}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Creating Unit Plan..." : "Create Unit Plan from Template"}
          </button>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
