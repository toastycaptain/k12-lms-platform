"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface Course {
  id: number;
  name: string;
}

function NewQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId");

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(courseIdParam || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourses() {
      try {
        const data = await apiFetch<Course[]>("/api/v1/courses");
        setCourses(data);
      } catch {
        // ignore
      }
    }
    fetchCourses();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setSaving(true);
    setError("");
    try {
      const quiz = await apiFetch<{ id: number }>(`/api/v1/courses/${courseId}/quizzes`, {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });
      router.push(`/assess/quizzes/${quiz.id}`);
    } catch {
      setError("Failed to create quiz");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Quiz</h1>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Quiz"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewQuizPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<ListSkeleton />}>
          <NewQuizForm />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
