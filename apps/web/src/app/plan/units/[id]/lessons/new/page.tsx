"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
}

interface LessonPlan {
  id: number;
  position: number;
}

interface CreatedLesson {
  id: number;
}

export default function NewLessonPage() {
  const params = useParams();
  const unitId = params.id as string;
  const router = useRouter();

  const [unitPlan, setUnitPlan] = useState<UnitPlan | null>(null);
  const [existingLessons, setExistingLessons] = useState<LessonPlan[]>([]);
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState("0");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [unit, lessons] = await Promise.all([
          apiFetch<UnitPlan>(`/api/v1/unit_plans/${unitId}`),
          apiFetch<LessonPlan[]>(`/api/v1/unit_plans/${unitId}/lesson_plans`),
        ]);
        setUnitPlan(unit);
        setExistingLessons(lessons);
        const maxPosition = lessons.reduce((max, lesson) => Math.max(max, lesson.position), -1);
        setPosition((maxPosition + 1).toString());
      } catch {
        setError("Unable to load unit details.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [unitId]);

  const unitIsEditable = useMemo(() => unitPlan?.status === "draft", [unitPlan]);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Lesson title is required.");
      return;
    }

    if (!unitIsEditable) {
      setError("Lessons can only be added to draft unit plans.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const lesson = await apiFetch<CreatedLesson>(`/api/v1/unit_plans/${unitId}/lesson_plans`, {
        method: "POST",
        body: JSON.stringify({
          lesson_plan: {
            title: title.trim(),
            status: "draft",
            position: Number(position),
          },
        }),
      });

      router.push(`/plan/units/${unitId}/lessons/${lesson.id}`);
    } catch {
      setError("Failed to create lesson. Check your permissions and try again.");
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-sm text-gray-500">Loading lesson form...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-3">
            <Link href={`/plan/units/${unitId}`} className="text-sm text-gray-400 hover:text-gray-600">
              &larr; Back to unit
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create Lesson</h1>
          </div>

          {unitPlan && (
            <div className="rounded-md bg-white p-4 text-sm text-gray-600 shadow-sm ring-1 ring-gray-200">
              <p>
                <span className="font-medium text-gray-900">Unit:</span> {unitPlan.title}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-900">Current status:</span> {unitPlan.status}
              </p>
              <p className="mt-1">
                <span className="font-medium text-gray-900">Existing lessons:</span> {existingLessons.length}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Lesson Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!unitIsEditable}
              placeholder="e.g., Introduction to Ecosystems"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input
              type="number"
              min={0}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              disabled={!unitIsEditable}
              className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !unitIsEditable}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Lesson"}
            </button>
            <button
              onClick={() => router.push(`/plan/units/${unitId}`)}
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
