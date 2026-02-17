"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { ResponsiveTable } from "@k12/ui";
import { apiFetch } from "@/lib/api";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

interface Assignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  points_possible: string | null;
  due_at: string | null;
  lock_at: string | null;
  submission_types: string[];
  status: string;
  rubric_id: number | null;
}

interface Submission {
  id: number;
  status: string;
  submitted_at: string | null;
  grade: string | null;
  feedback: string | null;
  body: string | null;
  url: string | null;
}

interface Rubric {
  id: number;
  title: string;
  rubric_criteria: {
    id: number;
    title: string;
    points: string;
    rubric_ratings: { description: string; points: string }[];
  }[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-purple-100 text-purple-800",
    returned: "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default function StudentSubmissionPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const assignmentData = await apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`);
      setAssignment(assignmentData);

      if (assignmentData.rubric_id) {
        const rubricData = await apiFetch<Rubric>(`/api/v1/rubrics/${assignmentData.rubric_id}`);
        setRubric(rubricData);
      }

      // Check for existing submission
      try {
        const submissions = await apiFetch<Submission[]>(
          `/api/v1/assignments/${assignmentId}/submissions`,
        );
        if (submissions.length > 0) {
          setSubmission(submissions[0]);
        }
      } catch {
        // No submissions yet
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const sub = await apiFetch<Submission>(`/api/v1/assignments/${assignmentId}/submissions`, {
        method: "POST",
        body: JSON.stringify({
          submission_type: url ? "url" : "text",
          body: body || null,
          url: url || null,
        }),
      });
      setSubmission(sub);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const isPastDue = assignment?.due_at ? new Date(assignment.due_at) < now : false;
  const isLocked = assignment?.lock_at ? new Date(assignment.lock_at) < now : false;
  const canSubmit = assignment?.status === "published" && !isLocked && !submission;

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <ListSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!assignment) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="text-sm text-red-500">Assignment not found</div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link
              href={`/teach/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to course
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              {assignment.points_possible && <span>{assignment.points_possible} points</span>}
              {assignment.due_at && (
                <span>Due: {new Date(assignment.due_at).toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            {assignment.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Description</h3>
                <p className="mt-1 text-sm text-gray-600">{assignment.description}</p>
              </div>
            )}
            {assignment.instructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Instructions</h3>
                <p className="mt-1 text-sm text-gray-600">{assignment.instructions}</p>
              </div>
            )}
          </div>

          {/* Rubric Preview */}
          {rubric && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900">Rubric: {rubric.title}</h3>
              <div className="mt-3">
                <ResponsiveTable
                  caption="Rubric criteria"
                  data={rubric.rubric_criteria || []}
                  keyExtractor={(criterion) => criterion.id}
                  columns={[
                    {
                      key: "criterion",
                      header: "Criterion",
                      primary: true,
                      render: (criterion) => criterion.title,
                    },
                    {
                      key: "points",
                      header: "Points",
                      render: (criterion) => criterion.points,
                    },
                    {
                      key: "ratings",
                      header: "Ratings",
                      render: (criterion) =>
                        criterion.rubric_ratings
                          ?.map((rating) => `${rating.description} (${rating.points})`)
                          .join(", "),
                    },
                  ]}
                />
              </div>
            </div>
          )}

          {/* Submission Area or Status */}
          {submission ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Submission</h3>
                <StatusBadge status={submission.status} />
              </div>
              {submission.submitted_at && (
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submitted_at).toLocaleString()}
                </p>
              )}
              {submission.body && <p className="text-sm text-gray-600">{submission.body}</p>}
              {submission.url && (
                <a
                  href={submission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {submission.url}
                </a>
              )}
              {(submission.status === "graded" || submission.status === "returned") && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Grade:</span>
                    <span className="text-sm text-gray-900">
                      {submission.grade} / {assignment.points_possible}
                    </span>
                  </div>
                  {submission.feedback && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Feedback:</span>
                      <p className="mt-1 text-sm text-gray-600">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit Your Work</h3>

              {isPastDue && !isLocked && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  This assignment is past due. Late submissions may be accepted.
                </div>
              )}

              {isLocked ? (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  This assignment is locked and no longer accepting submissions.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Text Response</label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter your response..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      URL (optional)
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting || (!body && !url)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
