"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submission_type: string | null;
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
  rubric_id: number | null;
  points_possible: string | null;
}

interface RubricRating {
  id: number;
  description: string;
  points: string;
}

interface RubricCriterion {
  id: number;
  title: string;
  points: string;
  rubric_ratings: RubricRating[];
}

interface Rubric {
  id: number;
  title: string;
  rubric_criteria: RubricCriterion[];
}

interface RubricScoreResponse {
  rubric_criterion_id: number;
  rubric_rating_id: number | null;
  points_awarded: string;
  comments: string | null;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface RubricSelection {
  ratingId: number | null;
  score: number;
  comments: string;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
    draft: "bg-yellow-200 text-yellow-900",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function userDisplayName(user: User | undefined, fallbackId: number): string {
  if (!user) return `Student #${fallbackId}`;
  return `${user.first_name} ${user.last_name}`.trim() || `User #${user.id}`;
}

function roleLabel(user: User | undefined): string {
  if (!user) return "student";
  if (user.roles.includes("teacher") || user.roles.includes("admin")) return "teacher";
  return "student";
}

export default function CourseAssignmentGradingPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = String(params.courseId);
  const assignmentId = String(params.assignmentId);
  const submissionId = String(params.submissionId);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Submission[]>([]);
  const [usersById, setUsersById] = useState<Record<number, User>>({});
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [scores, setScores] = useState<Record<number, RubricSelection>>({});
  const [manualGrade, setManualGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [submissionData, assignmentData, submissionsData, usersData] = await Promise.all([
        apiFetch<Submission>(`/api/v1/submissions/${submissionId}`),
        apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`),
        apiFetch<Submission[]>(`/api/v1/assignments/${assignmentId}/submissions`),
        apiFetch<User[]>("/api/v1/users"),
      ]);

      setSubmission(submissionData);
      setAssignment(assignmentData);
      setAssignmentSubmissions(
        [...submissionsData].sort((a, b) => {
          const aTime = a.submitted_at
            ? new Date(a.submitted_at).getTime()
            : Number.MAX_SAFE_INTEGER;
          const bTime = b.submitted_at
            ? new Date(b.submitted_at).getTime()
            : Number.MAX_SAFE_INTEGER;
          if (aTime === bTime) return a.user_id - b.user_id;
          return aTime - bTime;
        }),
      );
      setUsersById(
        usersData.reduce<Record<number, User>>((accumulator, user) => {
          accumulator[user.id] = user;
          return accumulator;
        }, {}),
      );
      setFeedback(submissionData.feedback || "");
      setManualGrade(submissionData.grade || "");

      if (assignmentData.rubric_id) {
        const [rubricData, existingScores] = await Promise.all([
          apiFetch<Rubric>(`/api/v1/rubrics/${assignmentData.rubric_id}`),
          apiFetch<RubricScoreResponse[]>(`/api/v1/submissions/${submissionId}/rubric_scores`),
        ]);

        setRubric(rubricData);
        setScores(
          existingScores.reduce<Record<number, RubricSelection>>((accumulator, score) => {
            accumulator[score.rubric_criterion_id] = {
              ratingId: score.rubric_rating_id,
              score: Number(score.points_awarded),
              comments: score.comments || "",
            };
            return accumulator;
          }, {}),
        );
      } else {
        setRubric(null);
        setScores({});
      }
    } catch {
      setError("Unable to load grading data.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId, submissionId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const currentIndex = useMemo(
    () => assignmentSubmissions.findIndex((item) => item.id === Number(submissionId)),
    [assignmentSubmissions, submissionId],
  );

  const previousSubmission = currentIndex > 0 ? assignmentSubmissions[currentIndex - 1] : null;
  const nextSubmission =
    currentIndex >= 0 && currentIndex < assignmentSubmissions.length - 1
      ? assignmentSubmissions[currentIndex + 1]
      : null;

  const rubricTotal = useMemo(
    () => Object.values(scores).reduce((sum, entry) => sum + entry.score, 0),
    [scores],
  );

  function setCriterionRating(criterionId: number, ratingId: number, score: number) {
    setScores((previous) => ({
      ...previous,
      [criterionId]: {
        ratingId,
        score,
        comments: previous[criterionId]?.comments || "",
      },
    }));
  }

  async function handleSaveGrade() {
    if (!submission) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const gradeValue = rubric ? rubricTotal : Number(manualGrade || 0);
    const rubricPayload = rubric
      ? Object.entries(scores).map(([criterionId, value]) => ({
          criterion_id: Number(criterionId),
          rating_id: value.ratingId,
          score: value.score,
          comments: value.comments,
        }))
      : [];

    try {
      await apiFetch(`/api/v1/submissions/${submission.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          grade: gradeValue,
          feedback,
          rubric_scores: rubricPayload,
        }),
      });
      setMessage("Grade saved.");
      await fetchData();
    } catch {
      setError("Failed to save grade.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading grading view...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!submission || !assignment) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Submission not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const student = usersById[submission.user_id];

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                href={`/teach/courses/${courseId}/submissions`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                &larr; Back to Submissions Inbox
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{userDisplayName(student, submission.user_id)}</span>
                <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs capitalize text-gray-600">
                  {roleLabel(student)}
                </span>
                <span>&middot;</span>
                <span>
                  Submitted{" "}
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString()
                    : "Not submitted"}
                </span>
                <StatusBadge status={submission.status} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!previousSubmission}
                onClick={() => {
                  if (!previousSubmission) return;
                  router.push(
                    `/teach/courses/${courseId}/assignments/${assignmentId}/grade/${previousSubmission.id}`,
                  );
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous Student
              </button>
              <button
                type="button"
                disabled={!nextSubmission}
                onClick={() => {
                  if (!nextSubmission) return;
                  router.push(
                    `/teach/courses/${courseId}/assignments/${assignmentId}/grade/${nextSubmission.id}`,
                  );
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next Student
              </button>
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Student Submission</h2>
              <div className="mt-4 space-y-4">
                {submission.body && (
                  <div className="rounded-md bg-gray-50 p-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                    {submission.body}
                  </div>
                )}

                {submission.url && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Attached link
                    </p>
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

                {!submission.body && !submission.url && (
                  <p className="text-sm text-gray-500">No content submitted.</p>
                )}
              </div>
            </section>

            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Grading</h2>
                <p className="text-sm font-semibold text-gray-700">
                  Total: {rubric ? rubricTotal : manualGrade || 0}
                  {assignment.points_possible ? ` / ${assignment.points_possible}` : ""}
                </p>
              </div>

              {rubric ? (
                <div className="space-y-4">
                  {rubric.rubric_criteria.map((criterion) => {
                    const criterionScore = scores[criterion.id];
                    return (
                      <div key={criterion.id} className="rounded-md border border-gray-100 p-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">{criterion.title}</h3>
                          <span className="text-xs text-gray-500">
                            {criterionScore?.score || 0}/{criterion.points}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {criterion.rubric_ratings.map((rating) => (
                            <button
                              key={rating.id}
                              type="button"
                              onClick={() =>
                                setCriterionRating(criterion.id, rating.id, Number(rating.points))
                              }
                              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                criterionScore?.ratingId === rating.id
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {rating.description} ({rating.points})
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <input
                    type="number"
                    min={0}
                    value={manualGrade}
                    onChange={(event) => setManualGrade(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Overall Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Add feedback for this student..."
                />
              </div>

              <button
                onClick={handleSaveGrade}
                disabled={saving}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Grade"}
              </button>
            </section>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
