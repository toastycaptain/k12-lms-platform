"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
  current_version_id: number | null;
}

interface UnitVersion {
  id: number;
  version_number: number;
  title: string;
  description: string | null;
  essential_questions: string[];
  enduring_understandings: string[];
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

interface LessonPlan {
  id: number;
  title: string;
  position: number;
}

export default function PublishPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;

  const [unitPlan, setUnitPlan] = useState<UnitPlan | null>(null);
  const [currentVersion, setCurrentVersion] = useState<UnitVersion | null>(null);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [unit, vers, lessonList] = await Promise.all([
        apiFetch<UnitPlan>(`/api/v1/unit_plans/${unitId}`),
        apiFetch<UnitVersion[]>(`/api/v1/unit_plans/${unitId}/versions`),
        apiFetch<LessonPlan[]>(`/api/v1/unit_plans/${unitId}/lesson_plans`),
      ]);

      setUnitPlan(unit);
      setLessons(lessonList.sort((a, b) => a.position - b.position));

      if (vers.length > 0) {
        const cv = vers[0];
        setCurrentVersion(cv);

        try {
          const aligned = await apiFetch<Standard[]>(
            `/api/v1/unit_versions/${cv.id}/standards`,
          );
          setStandards(aligned);
        } catch {
          // No standards
        }
      }
    } catch {
      setError("Failed to load unit plan.");
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/publish`, { method: "POST" });
      router.push(`/plan/units/${unitId}`);
    } catch {
      setError("Cannot publish. Approval may be required — try submitting for approval instead.");
    } finally {
      setPublishing(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/submit_for_approval`, { method: "POST" });
      router.push(`/plan/units/${unitId}`);
    } catch {
      setError("Failed to submit for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Loading...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!unitPlan || !currentVersion) {
    return (
      <ProtectedRoute>
        <AppShell>
          <p className="text-gray-500">Unit plan not found or no version available.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/plan/units/${unitId}`}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                &larr; Back to Editor
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Publish Preview</h1>
              <StatusBadge status={unitPlan.status} />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Unit Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentVersion.title}</h2>
              <span className="text-sm text-gray-400">v{currentVersion.version_number}</span>
            </div>

            {currentVersion.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Description</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                  {currentVersion.description}
                </p>
              </div>
            )}

            {currentVersion.essential_questions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Essential Questions</h3>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentVersion.essential_questions.map((q, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentVersion.enduring_understandings.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Enduring Understandings</h3>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {currentVersion.enduring_understandings.map((u, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Standards */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-700">Aligned Standards</h3>
            {standards.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No standards aligned.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {standards.map((std) => (
                  <div key={std.id} className="text-sm">
                    <span className="font-semibold text-blue-700">{std.code}</span>
                    <span className="text-gray-600"> — {std.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lessons */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium text-gray-700">Lessons</h3>
            {lessons.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No lessons added.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{lesson.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {unitPlan.status === "draft" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {publishing ? "Publishing..." : "Publish"}
              </button>
              <button
                onClick={handleSubmitForApproval}
                disabled={submitting}
                className="rounded-md border border-orange-300 bg-orange-50 px-6 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
