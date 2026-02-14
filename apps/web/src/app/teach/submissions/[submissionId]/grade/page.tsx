"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_type: string;
  body: string | null;
  url: string | null;
  status: string;
  grade: string | null;
  feedback: string | null;
  submitted_at: string | null;
}

interface Assignment {
  id: number;
  title: string;
  points_possible: string | null;
  rubric_id: number | null;
}

interface RubricCriterion {
  id: number;
  title: string;
  points: string;
  rubric_ratings: { id: number; description: string; points: string }[];
}

interface Rubric {
  id: number;
  title: string;
  rubric_criteria: RubricCriterion[];
}

interface RubricScore {
  rubric_criterion_id: number;
  rubric_rating_id: number | null;
  points_awarded: number;
  comments: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

export default function GradingViewPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const router = useRouter();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Manual grade
  const [manualGrade, setManualGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  // Rubric scores
  const [rubricScores, setRubricScores] = useState<Map<number, RubricScore>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      const sub = await apiFetch<Submission>(`/api/v1/submissions/${submissionId}`);
      setSubmission(sub);
      setManualGrade(sub.grade || "");
      setFeedback(sub.feedback || "");

      const asn = await apiFetch<Assignment>(`/api/v1/assignments/${sub.assignment_id}`);
      setAssignment(asn);

      if (asn.rubric_id) {
        const rubricData = await apiFetch<Rubric>(`/api/v1/rubrics/${asn.rubric_id}`);
        setRubric(rubricData);

        // Load existing rubric scores
        try {
          const existingScores = await apiFetch<{ rubric_criterion_id: number; rubric_rating_id: number | null; points_awarded: string; comments: string }[]>(
            `/api/v1/submissions/${submissionId}/rubric_scores`,
          );
          const scoreMap = new Map<number, RubricScore>();
          for (const s of existingScores) {
            scoreMap.set(s.rubric_criterion_id, {
              rubric_criterion_id: s.rubric_criterion_id,
              rubric_rating_id: s.rubric_rating_id,
              points_awarded: Number(s.points_awarded),
              comments: s.comments || "",
            });
          }
          setRubricScores(scoreMap);
        } catch {
          // No scores yet
        }
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function selectRating(criterionId: number, ratingId: number, points: number) {
    const newScores = new Map(rubricScores);
    const existing = newScores.get(criterionId);
    newScores.set(criterionId, {
      rubric_criterion_id: criterionId,
      rubric_rating_id: ratingId,
      points_awarded: points,
      comments: existing?.comments || "",
    });
    setRubricScores(newScores);
  }

  function updateCriterionComment(criterionId: number, comment: string) {
    const newScores = new Map(rubricScores);
    const existing = newScores.get(criterionId);
    if (existing) {
      newScores.set(criterionId, { ...existing, comments: comment });
    } else {
      newScores.set(criterionId, {
        rubric_criterion_id: criterionId,
        rubric_rating_id: null,
        points_awarded: 0,
        comments: comment,
      });
    }
    setRubricScores(newScores);
  }

  const rubricTotal = Array.from(rubricScores.values()).reduce((sum, s) => sum + s.points_awarded, 0);

  async function handleSaveRubricGrade() {
    setSaving(true);
    try {
      const scores = Array.from(rubricScores.values());
      await apiFetch(`/api/v1/submissions/${submissionId}/rubric_scores`, {
        method: "POST",
        body: JSON.stringify({ scores }),
      });

      if (feedback) {
        await apiFetch(`/api/v1/submissions/${submissionId}/grade`, {
          method: "POST",
          body: JSON.stringify({ grade: rubricTotal, feedback }),
        });
      }

      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveManualGrade() {
    setSaving(true);
    try {
      await apiFetch(`/api/v1/submissions/${submissionId}/grade`, {
        method: "POST",
        body: JSON.stringify({ grade: Number(manualGrade), feedback }),
      });
      fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleReturn() {
    try {
      await apiFetch(`/api/v1/submissions/${submissionId}/return`, { method: "POST" });
      fetchData();
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-gray-500">Loading submission...</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push("/teach/submissions")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to inbox
              </button>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Grade: {assignment?.title}
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-sm text-gray-500">Student #{submission?.user_id}</span>
                <StatusBadge status={submission?.status || ""} />
              </div>
            </div>
            <div className="flex gap-2">
              {submission?.status === "graded" && (
                <button
                  onClick={handleReturn}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Return to Student
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Panel: Submission Content */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Submission</h2>
              {submission?.submitted_at && (
                <p className="mt-1 text-xs text-gray-400">
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </p>
              )}
              <div className="mt-4 space-y-3">
                {submission?.body && (
                  <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {submission.body}
                  </div>
                )}
                {submission?.url && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">URL: </span>
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {submission.url}
                    </a>
                  </div>
                )}
                {!submission?.body && !submission?.url && (
                  <p className="text-sm text-gray-500">No content submitted</p>
                )}
              </div>
            </div>

            {/* Right Panel: Grading Tools */}
            <div className="space-y-4">
              {rubric ? (
                /* Rubric-based grading */
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Rubric: {rubric.title}</h2>
                  <div className="mt-4 space-y-6">
                    {rubric.rubric_criteria?.map((criterion) => {
                      const score = rubricScores.get(criterion.id);
                      return (
                        <div key={criterion.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {criterion.title}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {score?.points_awarded || 0} / {criterion.points}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {criterion.rubric_ratings?.map((rating) => (
                              <button
                                key={rating.id}
                                onClick={() =>
                                  selectRating(criterion.id, rating.id, Number(rating.points))
                                }
                                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  score?.rubric_rating_id === rating.id
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {rating.description} ({rating.points})
                              </button>
                            ))}
                          </div>
                          <input
                            type="text"
                            value={score?.comments || ""}
                            onChange={(e) =>
                              updateCriterionComment(criterion.id, e.target.value)
                            }
                            placeholder="Comments for this criterion..."
                            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <span className="text-sm font-semibold text-gray-900">
                      Total: {rubricTotal} / {assignment?.points_possible || "?"}
                    </span>
                  </div>
                </div>
              ) : (
                /* Manual grading */
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Grade</h2>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Points (max: {assignment?.points_possible || "N/A"})
                    </label>
                    <input
                      type="number"
                      value={manualGrade}
                      onChange={(e) => setManualGrade(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-gray-900">Overall Feedback</h2>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Feedback for student..."
                />
              </div>

              <button
                onClick={rubric ? handleSaveRubricGrade : handleSaveManualGrade}
                disabled={saving}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
