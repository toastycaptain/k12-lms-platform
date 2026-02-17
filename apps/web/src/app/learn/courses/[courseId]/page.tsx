"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CourseHomeSkeleton } from "@/components/skeletons/CourseHomeSkeleton";
import { EmptyState } from "@k12/ui";

interface Course {
  id: number;
  name: string;
  code: string;
  sections?: Section[];
}

interface Section {
  id: number;
  name: string;
  term_id: number;
}

interface Term {
  id: number;
  name: string;
}

interface Enrollment {
  id: number;
  user_id: number;
  role: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

interface CourseModule {
  id: number;
  title: string;
  description: string | null;
  status: string;
  position: number;
}

interface ModuleItem {
  id: number;
  title: string;
  item_type: string;
  itemable_type: string | null;
  itemable_id: number | null;
  position: number;
}

interface Assignment {
  id: number;
  title: string;
  due_at: string | null;
}

interface Submission {
  id: number;
  assignment_id: number;
  status: string;
}

interface Quiz {
  id: number;
  title: string;
  due_at: string | null;
}

interface QuizAttempt {
  id: number;
  status: string;
  submitted_at: string | null;
  created_at: string;
}

interface DiscussionPost {
  id: number;
  created_by_id: number;
}

interface ModuleProgressResponse {
  total_items: number;
  current_user_completed_count: number;
  current_user_completed_item_ids: number[];
}

interface ModuleView {
  moduleEntry: CourseModule;
  items: ModuleItem[];
  completedCount: number;
  totalCount: number;
  locked: boolean;
}

const LEARN_ROLES = ["admin", "teacher", "student"];

function personName(user: User | undefined): string {
  if (!user) return "Teacher";
  return `${user.first_name} ${user.last_name}`.trim() || "Teacher";
}

function moduleStatus(
  completed: number,
  total: number,
): "not started" | "in progress" | "completed" {
  if (total === 0 || completed === 0) return "not started";
  if (completed >= total) return "completed";
  return "in progress";
}

function moduleStatusClass(status: "not started" | "in progress" | "completed"): string {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "in progress") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}

function itemTypeIcon(itemType: string): string {
  if (itemType.includes("assignment")) return "A";
  if (itemType.includes("quiz")) return "Q";
  if (itemType.includes("discussion")) return "D";
  return "R";
}

export default function LearnCoursePage() {
  const params = useParams();
  const { user } = useAuth();
  const courseId = String(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [termLabel, setTermLabel] = useState("No term");
  const [moduleViews, setModuleViews] = useState<ModuleView[]>([]);
  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({});
  const [itemDueDates, setItemDueDates] = useState<Record<number, string | null>>({});
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const overallProgress = useMemo(() => {
    const completed = moduleViews.reduce((sum, moduleView) => sum + moduleView.completedCount, 0);
    const total = moduleViews.reduce((sum, moduleView) => sum + moduleView.totalCount, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  }, [moduleViews]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [courseData, users, terms, assignments, quizzes, discussions] = await Promise.all([
        apiFetch<Course>(`/api/v1/courses/${courseId}`),
        apiFetch<User[]>("/api/v1/users"),
        apiFetch<Term[]>("/api/v1/terms"),
        apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
        apiFetch<Quiz[]>(`/api/v1/courses/${courseId}/quizzes`),
        apiFetch<{ id: number; title: string }[]>(`/api/v1/courses/${courseId}/discussions`),
      ]);

      setCourse(courseData);

      const sections = courseData.sections || [];
      const termMap = terms.reduce<Record<number, Term>>((accumulator, term) => {
        accumulator[term.id] = term;
        return accumulator;
      }, {});

      const sectionTerms = Array.from(
        new Set(sections.map((section) => termMap[section.term_id]?.name).filter(Boolean)),
      );
      setTermLabel(sectionTerms.join(", ") || "No term");

      const usersById = users.reduce<Record<number, User>>((accumulator, entry) => {
        accumulator[entry.id] = entry;
        return accumulator;
      }, {});

      const enrollmentsBySection = await Promise.all(
        sections.map((section) =>
          apiFetch<Enrollment[]>(`/api/v1/enrollments?section_id=${section.id}`),
        ),
      );
      const teacherEnrollment = enrollmentsBySection
        .flat()
        .find((enrollment) => enrollment.role === "teacher");
      setTeacherName(personName(usersById[teacherEnrollment?.user_id || -1]));

      const assignmentMap = assignments.reduce<Record<number, Assignment>>(
        (accumulator, assignment) => {
          accumulator[assignment.id] = assignment;
          return accumulator;
        },
        {},
      );
      const quizMap = quizzes.reduce<Record<number, Quiz>>((accumulator, quiz) => {
        accumulator[quiz.id] = quiz;
        return accumulator;
      }, {});

      const submissionsPerAssignment = await Promise.all(
        assignments.map((assignment) =>
          apiFetch<Submission[]>(`/api/v1/assignments/${assignment.id}/submissions`),
        ),
      );
      const submissionByAssignmentId = submissionsPerAssignment.reduce<
        Record<number, Submission | undefined>
      >((accumulator, submissionList, index) => {
        accumulator[assignments[index].id] = submissionList[0];
        return accumulator;
      }, {});

      const attemptsPerQuiz = await Promise.all(
        quizzes.map((quiz) => apiFetch<QuizAttempt[]>(`/api/v1/quizzes/${quiz.id}/attempts`)),
      );
      const latestAttemptByQuizId = attemptsPerQuiz.reduce<Record<number, QuizAttempt | undefined>>(
        (accumulator, attempts, index) => {
          accumulator[quizzes[index].id] = [...attempts].sort((a, b) => {
            const aDate = a.submitted_at || a.created_at;
            const bDate = b.submitted_at || b.created_at;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          })[0];
          return accumulator;
        },
        {},
      );

      const postsPerDiscussion = await Promise.all(
        discussions.map((discussion) =>
          apiFetch<DiscussionPost[]>(`/api/v1/discussions/${discussion.id}/posts`),
        ),
      );
      const hasPostedByDiscussionId = postsPerDiscussion.reduce<Record<number, boolean>>(
        (accumulator, posts, index) => {
          accumulator[discussions[index].id] = posts.some(
            (post) => post.created_by_id === user?.id,
          );
          return accumulator;
        },
        {},
      );

      const courseModules = await apiFetch<CourseModule[]>(
        `/api/v1/courses/${courseId}/course_modules`,
      );
      const publishedModules = courseModules
        .filter((moduleEntry) => moduleEntry.status === "published")
        .sort((a, b) => a.position - b.position);

      const moduleItemsById: Record<number, ModuleItem[]> = {};
      const completionByModule: Record<number, Set<number>> = {};

      await Promise.all(
        publishedModules.map(async (moduleEntry) => {
          const [items, progress] = await Promise.all([
            apiFetch<ModuleItem[]>(`/api/v1/modules/${moduleEntry.id}/module_items`),
            apiFetch<ModuleProgressResponse>(`/api/v1/course_modules/${moduleEntry.id}/progress`),
          ]);
          moduleItemsById[moduleEntry.id] = items.sort((a, b) => a.position - b.position);
          completionByModule[moduleEntry.id] = new Set(
            progress.current_user_completed_item_ids || [],
          );
        }),
      );

      const nextItemStatuses: Record<number, string> = {};
      const nextItemDueDates: Record<number, string | null> = {};

      let unlocked = true;
      const nextModuleViews = publishedModules.map((moduleEntry) => {
        const items = moduleItemsById[moduleEntry.id] || [];
        const completionSet = completionByModule[moduleEntry.id] || new Set<number>();

        let completedCount = 0;

        items.forEach((item) => {
          let status = "not started";
          let complete = completionSet.has(item.id);
          let dueDate: string | null = null;

          if (item.itemable_type === "Assignment" && item.itemable_id) {
            const submission = submissionByAssignmentId[item.itemable_id];
            const assignment = assignmentMap[item.itemable_id];
            dueDate = assignment?.due_at || null;
            if (submission) {
              status = submission.status;
              complete = ["submitted", "graded", "returned"].includes(submission.status);
            }
          } else if (item.itemable_type === "Quiz" && item.itemable_id) {
            const attempt = latestAttemptByQuizId[item.itemable_id];
            const quiz = quizMap[item.itemable_id];
            dueDate = quiz?.due_at || null;
            if (attempt) {
              status = attempt.status;
              complete = ["submitted", "graded"].includes(attempt.status);
            }
          } else if (item.itemable_type === "Discussion" && item.itemable_id) {
            if (hasPostedByDiscussionId[item.itemable_id]) {
              status = "submitted";
              complete = true;
            } else if (complete) {
              status = "completed";
            }
          } else if (complete) {
            status = "completed";
          }

          if (complete) completedCount += 1;

          nextItemStatuses[item.id] = status;
          nextItemDueDates[item.id] = dueDate;
        });

        const totalCount = items.length;
        const locked = !unlocked;
        if (unlocked && !(totalCount > 0 && completedCount < totalCount)) {
          unlocked = true;
        } else if (unlocked) {
          unlocked = false;
        }

        return {
          moduleEntry,
          items,
          completedCount,
          totalCount,
          locked,
        } satisfies ModuleView;
      });

      setItemStatuses(nextItemStatuses);
      setItemDueDates(nextItemDueDates);
      setModuleViews(nextModuleViews);
      setExpandedModuleIds(new Set(nextModuleViews.slice(0, 1).map((view) => view.moduleEntry.id)));
    } catch {
      setError("Unable to load this course.");
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function toggleCompletion(moduleItemId: number, completed: boolean) {
    try {
      await apiFetch(`/api/v1/module_items/${moduleItemId}/complete`, {
        method: completed ? "DELETE" : "POST",
      });
      await fetchData();
    } catch {
      setError("Unable to update item completion.");
    }
  }

  function itemHref(item: ModuleItem): string {
    if (item.itemable_type === "Assignment" && item.itemable_id) {
      return `/learn/courses/${courseId}/assignments/${item.itemable_id}`;
    }
    if (item.itemable_type === "Quiz" && item.itemable_id) {
      return `/learn/courses/${courseId}/quizzes/${item.itemable_id}/attempt`;
    }
    if (item.itemable_type === "Discussion" && item.itemable_id) {
      return `/learn/courses/${courseId}/discussions/${item.itemable_id}`;
    }
    return "";
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <CourseHomeSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute requiredRoles={LEARN_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Course not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={LEARN_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link href="/learn/courses" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to My Courses
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Teacher: {teacherName}</p>
            <p className="text-sm text-gray-500">
              Section:{" "}
              {(course.sections || []).map((section) => section.name).join(", ") || "No section"}
            </p>
            <p className="text-sm text-gray-500">Term: {termLabel}</p>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>Overall Progress</span>
                <span>
                  {overallProgress.completed}/{overallProgress.total} complete
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  role="progressbar"
                  aria-valuenow={overallProgress.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall course progress"
                  style={{ width: `${overallProgress.pct}%` }}
                />
              </div>
            </div>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="space-y-3">
            {moduleViews.length === 0 ? (
              <EmptyState
                title="No published modules yet"
                description="Course modules will appear here once published."
              />
            ) : (
              moduleViews.map((view) => {
                const status = moduleStatus(view.completedCount, view.totalCount);
                const expanded = expandedModuleIds.has(view.moduleEntry.id);
                const modulePct =
                  view.totalCount > 0
                    ? Math.round((view.completedCount / view.totalCount) * 100)
                    : 0;
                return (
                  <article
                    key={view.moduleEntry.id}
                    className={`rounded-lg border ${view.locked ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"}`}
                  >
                    <button
                      onClick={() => {
                        setExpandedModuleIds((previous) => {
                          const next = new Set(previous);
                          if (next.has(view.moduleEntry.id)) {
                            next.delete(view.moduleEntry.id);
                          } else {
                            next.add(view.moduleEntry.id);
                          }
                          return next;
                        });
                      }}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {view.moduleEntry.title}
                        </p>
                        {view.moduleEntry.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {view.moduleEntry.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${moduleStatusClass(status)}`}
                          >
                            {status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {view.completedCount}/{view.totalCount} items complete
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            role="progressbar"
                            aria-valuenow={modulePct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${view.moduleEntry.title} completion`}
                            style={{ width: `${modulePct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{expanded ? "Hide" : "Show"}</span>
                    </button>

                    {view.locked && (
                      <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
                        Complete previous module to unlock.
                      </div>
                    )}

                    {expanded && !view.locked && (
                      <div className="border-t border-gray-200 p-3">
                        {view.items.length === 0 ? (
                          <p className="text-sm text-gray-500">No items in this module.</p>
                        ) : (
                          <div className="space-y-2">
                            {view.items.map((item) => {
                              const href = itemHref(item);
                              const statusLabel = itemStatuses[item.id] || "not started";
                              const dueDate = itemDueDates[item.id];
                              const completed = [
                                "submitted",
                                "graded",
                                "returned",
                                "completed",
                                "in progress",
                              ].includes(statusLabel);

                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-700">
                                        {itemTypeIcon(item.item_type)}
                                      </span>
                                      <p className="truncate text-sm font-medium text-gray-900">
                                        {item.title}
                                      </p>
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                      <span className="capitalize">{statusLabel}</span>
                                      {dueDate && (
                                        <span>Due {new Date(dueDate).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {href ? (
                                      <Link
                                        href={href}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        Open
                                      </Link>
                                    ) : (
                                      <button
                                        onClick={() => void toggleCompletion(item.id, completed)}
                                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                      >
                                        {completed ? "Mark Incomplete" : "Mark Complete"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
