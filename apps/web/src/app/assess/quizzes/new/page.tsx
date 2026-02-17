"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { FormActions, FormField, Select, TextArea, TextInput } from "@/components/forms";

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
        <FormField label="Course" htmlFor="quiz-course" required>
          <Select
            id="quiz-course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            required
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="quiz-title" required>
          <TextInput
            id="quiz-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Description" htmlFor="quiz-description">
          <TextArea
            id="quiz-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </FormField>

        <FormActions
          submitLabel="Create Quiz"
          submittingLabel="Creating..."
          submitting={saving}
          onCancel={() => router.back()}
        />
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
