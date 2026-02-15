"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface UnitPlan {
  id: number;
  title: string;
  status: string;
  current_version_id: number | null;
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

interface UnitVersion {
  id: number;
  version_number: number;
  title: string;
  description: string | null;
  essential_questions: string[];
  enduring_understandings: string[];
  standards?: Standard[];
}

interface LessonPlan {
  id: number;
  title: string;
  position: number;
}

interface LessonVersion {
  id: number;
  title: string;
  objectives: string | null;
  activities: string | null;
  materials: string | null;
}

interface ResourceLink {
  id: number;
  title: string | null;
  url: string;
}

interface LessonPreview {
  id: number;
  title: string;
  position: number;
  summary: string;
  resources: ResourceLink[];
}

interface ExportStatusResponse {
  status: "processing" | "completed";
  download_url?: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    pending_approval: "bg-orange-100 text-orange-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function summarizeLesson(version: LessonVersion | null): string {
  if (!version) return "No summary available.";
  const candidate =
    version.objectives || version.activities || version.materials || "No summary available.";
  return candidate.length > 220 ? `${candidate.slice(0, 220)}...` : candidate;
}

export default function UnitPublishPreviewPage() {
  const params = useParams();
  const unitId = String(params.id);

  const [unitPlan, setUnitPlan] = useState<UnitPlan | null>(null);
  const [currentVersion, setCurrentVersion] = useState<UnitVersion | null>(null);
  const [lessons, setLessons] = useState<LessonPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [unit, versions, lessonPlans] = await Promise.all([
        apiFetch<UnitPlan>(`/api/v1/unit_plans/${unitId}`),
        apiFetch<UnitVersion[]>(`/api/v1/unit_plans/${unitId}/versions`),
        apiFetch<LessonPlan[]>(`/api/v1/unit_plans/${unitId}/lesson_plans`),
      ]);

      setUnitPlan(unit);

      const resolvedVersion =
        versions.find((version) => version.id === unit.current_version_id) || versions[0] || null;
      setCurrentVersion(resolvedVersion);

      const lessonPreviews = await Promise.all(
        lessonPlans
          .sort((a, b) => a.position - b.position)
          .map(async (lesson) => {
            try {
              const lessonVersions = await apiFetch<LessonVersion[]>(
                `/api/v1/unit_plans/${unitId}/lesson_plans/${lesson.id}/versions`,
              );
              const latestVersion = lessonVersions[0] || null;
              const resources = latestVersion
                ? await apiFetch<ResourceLink[]>(
                    `/api/v1/lesson_versions/${latestVersion.id}/resource_links`,
                  )
                : [];

              return {
                id: lesson.id,
                title: latestVersion?.title || lesson.title,
                position: lesson.position,
                summary: summarizeLesson(latestVersion),
                resources,
              } satisfies LessonPreview;
            } catch {
              return {
                id: lesson.id,
                title: lesson.title,
                position: lesson.position,
                summary: "No summary available.",
                resources: [],
              } satisfies LessonPreview;
            }
          }),
      );

      setLessons(lessonPreviews);
    } catch {
      setError("Unable to load publish preview.");
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const isPublished = unitPlan?.status === "published";
  const standards = useMemo(() => currentVersion?.standards || [], [currentVersion]);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/publish`, { method: "POST" });
      setMessage("Unit published.");
      await fetchData();
    } catch {
      setError("Unable to publish this unit right now.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch(`/api/v1/unit_plans/${unitId}/export_pdf`, { method: "POST" });
      setMessage("PDF export queued. Checking status...");

      window.setTimeout(async () => {
        try {
          const status = await apiFetch<ExportStatusResponse>(
            `/api/v1/unit_plans/${unitId}/export_pdf_status`,
          );
          if (status.status === "completed" && status.download_url) {
            setMessage("PDF is ready. Opening download...");
            window.open(status.download_url, "_blank", "noopener,noreferrer");
          } else {
            setMessage("PDF is still processing. Please try export again shortly.");
          }
        } catch {
          setMessage("PDF export is still processing.");
        }
      }, 1500);
    } catch {
      setError("Failed to start PDF export.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading preview...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!unitPlan || !currentVersion) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Unit data is unavailable.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-3">
              <Link
                href={`/plan/units/${unitId}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Editor
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Publish Preview</h1>
              <StatusBadge status={unitPlan.status} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || isPublished}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPublished ? "Published" : publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && (
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">{message}</div>
          )}

          <article className="space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <header className="space-y-2 border-b border-gray-100 pb-5">
              <h2 className="text-3xl font-semibold text-gray-900">{currentVersion.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>Version {currentVersion.version_number}</span>
                <span>&middot;</span>
                <span>Status: {unitPlan.status.replace("_", " ")}</span>
              </div>
              {currentVersion.description && (
                <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                  {currentVersion.description}
                </p>
              )}
            </header>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Essential Questions
              </h3>
              {currentVersion.essential_questions.length === 0 ? (
                <p className="text-sm text-gray-500">No essential questions added.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {currentVersion.essential_questions.map((question, index) => (
                    <li key={`${question}-${index}`}>{question}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Enduring Understandings
              </h3>
              {currentVersion.enduring_understandings.length === 0 ? (
                <p className="text-sm text-gray-500">No enduring understandings added.</p>
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {currentVersion.enduring_understandings.map((understanding, index) => (
                    <li key={`${understanding}-${index}`}>{understanding}</li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Standards Aligned
              </h3>
              {standards.length === 0 ? (
                <p className="text-sm text-gray-500">No standards aligned.</p>
              ) : (
                <div className="space-y-2">
                  {standards.map((standard) => (
                    <div
                      key={standard.id}
                      className="rounded-md border border-gray-100 bg-gray-50 p-3"
                    >
                      <p className="text-sm font-semibold text-gray-900">{standard.code}</p>
                      <p className="text-sm text-gray-600">{standard.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Lessons
              </h3>
              {lessons.length === 0 ? (
                <p className="text-sm text-gray-500">No lessons added.</p>
              ) : (
                <div className="space-y-4">
                  {lessons.map((lesson, index) => (
                    <section key={lesson.id} className="rounded-lg border border-gray-100 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {index + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-gray-900">{lesson.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{lesson.summary}</p>

                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Resources
                        </p>
                        {lesson.resources.length === 0 ? (
                          <p className="mt-1 text-sm text-gray-500">No resources linked.</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {lesson.resources.map((resource) => (
                              <li key={resource.id}>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {resource.title || resource.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </article>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
