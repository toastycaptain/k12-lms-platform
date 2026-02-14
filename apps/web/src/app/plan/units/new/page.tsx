"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Course {
  id: number;
  name: string;
}

interface UnitPlan {
  id: number;
}

export default function NewUnitPlanPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await apiFetch<Course[]>("/api/v1/courses");
        setCourses(data);
      } catch {
        setError("Unable to load courses.");
      }
    }

    fetchCourses();
  }, []);

  async function handleCreate() {
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

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ecosystems and Biodiversity"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Course</label>
            <select
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
