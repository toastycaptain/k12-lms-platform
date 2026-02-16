"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ApiError, apiFetch } from "@/lib/api";

interface Assignment {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  points_possible: string | null;
  due_at: string | null;
  lock_at: string | null;
  allow_late_submission: boolean;
  submission_types: string[];
  rubric_id: number | null;
  standard_ids: number[];
}

interface Submission {
  id: number;
  assignment_id: number;
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
  rubric_criteria: RubricCriterion[];
}

interface RubricCriterion {
  id: number;
  title: string;
  points: string;
  rubric_ratings: RubricRating[];
}

interface RubricRating {
  id: number;
  description: string;
  points: string;
}

interface RubricScore {
  id: number;
  rubric_criterion_id: number;
  rubric_rating_id: number | null;
  points_awarded: string | null;
  comments: string | null;
}

interface ResourceLink {
  id: number;
  title: string | null;
  url: string;
  provider: string;
}

interface Standard {
  id: number;
  code: string;
  description: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function daysUntil(dateValue: string): number {
  const now = new Date();
  const due = new Date(dateValue);
  const ms = due.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function dueCountdownLabel(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  const days = daysUntil(dueAt);
  if (days < 0) return `Past due by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due in 1 day";
  return `Due in ${days} days`;
}

function statusBadgeClass(status: string): string {
  if (status === "graded" || status === "returned") return "bg-green-100 text-green-800";
  if (status === "submitted") return "bg-blue-100 text-blue-800";
  return "bg-yellow-200 text-yellow-900";
}

function supportsSubmissionType(assignment: Assignment | null, type: string): boolean {
  if (!assignment) return false;
  if (!assignment.submission_types || assignment.submission_types.length === 0) return true;

  const aliases: Record<string, string[]> = {
    online_text: ["online_text", "text", "online_text_entry"],
    file_upload: ["file_upload"],
    google_drive_link: ["google_drive_link", "url"],
  };

  const validTypes = aliases[type] || [type];
  return assignment.submission_types.some((submissionType) => validTypes.includes(submissionType));
}

function rubricCriterionMap(rubric: Rubric | null): Record<number, RubricCriterion> {
  if (!rubric) return {};
  return rubric.rubric_criteria.reduce<Record<number, RubricCriterion>>((acc, criterion) => {
    acc[criterion.id] = criterion;
    return acc;
  }, {});
}

export default function LearnAssignmentSubmissionPage() {
  const params = useParams();
  const courseId = String(params.courseId);
  const assignmentId = String(params.assignmentId);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [rubricScores, setRubricScores] = useState<RubricScore[]>([]);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);

  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDriveFile, setSelectedDriveFile] = useState<DriveFile | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentData, resourceLinks, alignedStandards, submissions] = await Promise.all([
        apiFetch<Assignment>(`/api/v1/assignments/${assignmentId}`),
        apiFetch<ResourceLink[]>(`/api/v1/assignments/${assignmentId}/resource_links`),
        apiFetch<Standard[]>(`/api/v1/assignments/${assignmentId}/standards`),
        apiFetch<Submission[]>(`/api/v1/assignments/${assignmentId}/submissions`),
      ]);

      const latestSubmission = submissions[0] || null;
      setAssignment(assignmentData);
      setResources(resourceLinks);
      setStandards(alignedStandards);
      setSubmission(latestSubmission);
      setBody(latestSubmission?.body || "");
      setUrl(latestSubmission?.url || "");

      if (assignmentData.rubric_id) {
        const rubricData = await apiFetch<Rubric>(`/api/v1/rubrics/${assignmentData.rubric_id}`);
        setRubric(rubricData);
      } else {
        setRubric(null);
      }

      if (latestSubmission) {
        const scores = await apiFetch<RubricScore[]>(
          `/api/v1/submissions/${latestSubmission.id}/rubric_scores`,
        );
        setRubricScores(scores);
      } else {
        setRubricScores([]);
      }
    } catch {
      setError("Unable to load assignment details.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const rubricCriteriaById = useMemo(() => rubricCriterionMap(rubric), [rubric]);
  const isPastDue = assignment?.due_at ? new Date(assignment.due_at).getTime() < Date.now() : false;
  const isLocked = assignment?.lock_at
    ? new Date(assignment.lock_at).getTime() < Date.now()
    : false;
  const isGraded = submission?.status === "graded" || submission?.status === "returned";

  async function submitAssignment() {
    if (!assignment) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      let created: Submission;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("submission_type", "file_upload");
        formData.append("attachment", selectedFile);
        if (body.trim()) formData.append("body", body.trim());
        if (url.trim()) formData.append("url", url.trim());
        created = await apiFetch<Submission>(`/api/v1/assignments/${assignment.id}/submissions`, {
          method: "POST",
          body: formData,
        });
      } else {
        const submissionType = url.trim() ? "url" : "online_text";
        created = await apiFetch<Submission>(`/api/v1/assignments/${assignment.id}/submissions`, {
          method: "POST",
          body: JSON.stringify({
            submission_type: submissionType,
            body: body.trim() || null,
            url: url.trim() || null,
          }),
        });
      }

      setSubmission(created);
      setMessage("Assignment submitted.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to submit assignment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function onDriveFileSelect(file: DriveFile) {
    setSelectedDriveFile(file);
    setUrl(file.url);
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Loading assignment...</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!assignment) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Assignment not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link
              href={`/learn/courses/${courseId}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to Course
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>{assignment.points_possible || "-"} points</span>
              <span>
                Due:{" "}
                {assignment.due_at ? new Date(assignment.due_at).toLocaleString() : "No due date"}
              </span>
              <span className="text-amber-700">{dueCountdownLabel(assignment.due_at)}</span>
            </div>
            {(assignment.description || assignment.instructions) && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                {assignment.description || assignment.instructions}
              </p>
            )}
          </header>

          {error && <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {message && (
            <div role="status" aria-live="polite" className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-5">
            {!submission && !isPastDue && (
              <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                Not submitted. {dueCountdownLabel(assignment.due_at)}
              </div>
            )}
            {!submission && isPastDue && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                Past due.{" "}
                {assignment.allow_late_submission
                  ? "Late submissions may still be accepted."
                  : "Late submissions are disabled."}
              </div>
            )}
            {submission && !isGraded && (
              <div className="flex flex-wrap items-center gap-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <span>
                  Submitted on{" "}
                  {submission.submitted_at
                    ? new Date(submission.submitted_at).toLocaleString()
                    : "now"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(submission.status)}`}
                >
                  {submission.status}
                </span>
              </div>
            )}
            {submission && isGraded && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                Graded: {submission.grade || "-"} / {assignment.points_possible || "-"} points
              </div>
            )}

            {!isGraded ? (
              <div className="mt-4 space-y-4">
                {!submission && (
                  <>
                    {supportsSubmissionType(assignment, "online_text") && (
                      <div>
                        <label htmlFor="submission-text-entry" className="block text-sm font-medium text-gray-700">
                          Text Entry
                        </label>
                        <textarea
                          id="submission-text-entry"
                          value={body}
                          onChange={(event) => setBody(event.target.value)}
                          rows={7}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Write your response..."
                        />
                      </div>
                    )}

                    {supportsSubmissionType(assignment, "file_upload") && (
                      <div>
                        <label htmlFor="submission-file-upload" className="block text-sm font-medium text-gray-700">
                          File Upload
                        </label>
                        <input
                          id="submission-file-upload"
                          type="file"
                          className="mt-1 block w-full text-sm text-gray-700"
                          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                        />
                        {selectedFile && (
                          <p className="mt-1 text-xs text-gray-500">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {supportsSubmissionType(assignment, "google_drive_link") && (
                      <div className="space-y-2">
                        <label htmlFor="submission-drive-link" className="block text-sm font-medium text-gray-700">
                          Google Drive Link
                        </label>
                        <GoogleDrivePicker onSelect={onDriveFileSelect}>
                          <span className="inline-flex rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                            Pick from Drive
                          </span>
                        </GoogleDrivePicker>
                        <input
                          id="submission-drive-link"
                          type="url"
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="https://drive.google.com/..."
                        />
                        {selectedDriveFile && (
                          <p className="text-xs text-gray-500">
                            Selected Drive file: {selectedDriveFile.name}
                          </p>
                        )}
                      </div>
                    )}

                    {isLocked && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                        This assignment is locked and no longer accepts submissions.
                      </div>
                    )}

                    <button
                      onClick={() => void submitAssignment()}
                      disabled={
                        submitting || isLocked || (!body.trim() && !url.trim() && !selectedFile)
                      }
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Assignment"}
                    </button>
                  </>
                )}

                {submission && (
                  <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Your Submitted Work</h3>
                    {submission.body && (
                      <p className="whitespace-pre-wrap text-sm text-gray-700">{submission.body}</p>
                    )}
                    {submission.url && (
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {submission.url}
                      </a>
                    )}
                    {!isLocked && (
                      <button
                        onClick={() => {
                          setSubmission(null);
                          setBody("");
                          setUrl("");
                          setSelectedFile(null);
                          setSelectedDriveFile(null);
                          setMessage(null);
                        }}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Resubmit
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Feedback</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {submission?.feedback?.trim() || "No written feedback provided yet."}
                  </p>
                </div>

                {rubric && rubricScores.length > 0 && (
                  <div className="rounded-md border border-gray-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Rubric Breakdown</h3>
                    <div className="mt-3 space-y-2">
                      {rubricScores.map((score) => {
                        const criterion = rubricCriteriaById[score.rubric_criterion_id];
                        const rating = criterion?.rubric_ratings.find(
                          (entry) => entry.id === score.rubric_rating_id,
                        );

                        return (
                          <div
                            key={score.id}
                            className="rounded border border-gray-200 p-3 text-sm"
                          >
                            <p className="font-medium text-gray-900">
                              {criterion?.title || "Criterion"}
                            </p>
                            <p className="text-gray-600">
                              Score: {score.points_awarded || "0"} / {criterion?.points || "-"}
                            </p>
                            {rating && (
                              <p className="text-gray-600">Rating: {rating.description}</p>
                            )}
                            {score.comments && (
                              <p className="mt-1 text-gray-700">{score.comments}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isLocked && (
                  <button
                    onClick={() => {
                      setSubmission(null);
                      setBody("");
                      setUrl("");
                      setSelectedFile(null);
                      setSelectedDriveFile(null);
                      setMessage(null);
                    }}
                    className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Resubmit
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Attached Resources
              </h2>
              {resources.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No resources attached.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {resources.map((resource) => (
                    <li key={resource.id} className="text-sm">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {resource.title || resource.url}
                      </a>
                      <span className="ml-2 text-xs uppercase text-gray-500">
                        {resource.provider}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                Standards Aligned
              </h2>
              {standards.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No standards aligned.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {standards.map((standard) => (
                    <li key={standard.id} className="rounded border border-gray-200 p-3 text-sm">
                      <p className="font-medium text-gray-900">{standard.code}</p>
                      <p className="text-gray-600">{standard.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
