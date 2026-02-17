"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { useToast } from "@k12/ui";
import { CourseHomeSkeleton } from "@/components/skeletons/CourseHomeSkeleton";
import { EmptyState } from "@k12/ui";
import { swrConfig } from "@/lib/swr";

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  sections?: { id: number; name: string; term_id: number }[];
}

interface CourseModule {
  id: number;
  title: string;
  status: string;
  position: number;
}

interface ModuleItem {
  id: number;
  item_type: string;
  itemable_type: string | null;
  itemable_id: number | null;
}

interface Assignment {
  id: number;
  title: string;
  due_at: string | null;
  status: string;
}

interface Discussion {
  id: number;
  title: string;
  status: string;
}

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string | null;
}

interface DiscussionPost {
  id: number;
  discussion_id: number;
  created_by_id: number;
  created_at: string;
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

interface SyncMapping {
  id: number;
  local_type: string;
  local_id: number;
  external_id: string;
  last_synced_at: string | null;
}

interface IntegrationConfig {
  id: number;
  provider: string;
  status: string;
}

interface ModuleProgress {
  moduleId: number;
  completed: number;
  total: number;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  text: string;
}

interface CourseHomeData {
  course: Course | null;
  modules: CourseModule[];
  assignments: Assignment[];
  termsById: Record<number, Term>;
  studentCount: number;
  moduleProgress: Record<number, ModuleProgress>;
  recentActivity: ActivityItem[];
  courseMapping: SyncMapping | null;
  integrationConfig: IntegrationConfig | null;
}

const TEACHER_ROLES = ["admin", "curriculum_lead", "teacher"];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-200 text-yellow-900",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function personName(usersById: Record<number, User>, userId: number): string {
  const user = usersById[userId];
  if (!user) return `User #${userId}`;
  return `${user.first_name} ${user.last_name}`.trim() || `User #${userId}`;
}

function countdownLabel(dateValue: string | null): string {
  if (!dateValue) return "No due date";
  const now = new Date();
  const due = new Date(dateValue);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  return `Due in ${diffDays}d`;
}

export default function CourseHomePage() {
  const params = useParams();
  const { addToast } = useToast();
  const courseId = String(params.courseId);

  const [syncingNow, setSyncingNow] = useState(false);
  const [pushingGrades, setPushingGrades] = useState(false);

  const {
    data,
    error: loadError,
    isLoading,
    mutate,
  } = useSWR<CourseHomeData>(
    ["course-home", courseId],
    async () => {
      const [courseData, moduleData, assignmentData, discussionData, termData, userData] =
        await Promise.all([
          apiFetch<Course>(`/api/v1/courses/${courseId}`),
          apiFetch<CourseModule[]>(`/api/v1/courses/${courseId}/modules`),
          apiFetch<Assignment[]>(`/api/v1/courses/${courseId}/assignments`),
          apiFetch<Discussion[]>(`/api/v1/courses/${courseId}/discussions`),
          apiFetch<Term[]>("/api/v1/terms"),
          apiFetch<User[]>("/api/v1/users"),
        ]);

      const sortedModules = [...moduleData].sort((a, b) => a.position - b.position);
      const termsById = termData.reduce<Record<number, Term>>((accumulator, term) => {
        accumulator[term.id] = term;
        return accumulator;
      }, {});
      const usersById = userData.reduce<Record<number, User>>((accumulator, user) => {
        accumulator[user.id] = user;
        return accumulator;
      }, {});

      const sections = courseData.sections || [];
      const enrollmentsBySection = await Promise.all(
        sections.map((section) =>
          apiFetch<Enrollment[]>(`/api/v1/enrollments?section_id=${section.id}`),
        ),
      );

      const uniqueStudents = new Set<number>();
      enrollmentsBySection.flat().forEach((enrollment) => {
        if (enrollment.role === "student") {
          uniqueStudents.add(enrollment.user_id);
        }
      });

      const moduleItems = await Promise.all(
        sortedModules.map((moduleEntry) =>
          apiFetch<ModuleItem[]>(`/api/v1/modules/${moduleEntry.id}/module_items`),
        ),
      );

      const assignmentById = assignmentData.reduce<Record<number, Assignment>>(
        (accumulator, assignment) => {
          accumulator[assignment.id] = assignment;
          return accumulator;
        },
        {},
      );

      const moduleProgress: Record<number, ModuleProgress> = {};
      sortedModules.forEach((moduleEntry, index) => {
        const items = moduleItems[index] || [];
        const completed = items.filter((item) => {
          if (item.itemable_type === "Assignment" && item.itemable_id) {
            return assignmentById[item.itemable_id]?.status !== "draft";
          }
          return true;
        }).length;

        moduleProgress[moduleEntry.id] = {
          moduleId: moduleEntry.id,
          completed,
          total: items.length,
        };
      });

      const submissionsPerAssignment = await Promise.all(
        assignmentData.map((assignment) =>
          apiFetch<Submission[]>(`/api/v1/assignments/${assignment.id}/submissions`),
        ),
      );
      const postsPerDiscussion = await Promise.all(
        discussionData.map((discussion) =>
          apiFetch<DiscussionPost[]>(`/api/v1/discussions/${discussion.id}/posts`),
        ),
      );

      const activity: ActivityItem[] = [];
      submissionsPerAssignment.forEach((submissionList, index) => {
        submissionList.forEach((submission) => {
          if (!submission.submitted_at) return;
          activity.push({
            id: `submission-${submission.id}`,
            timestamp: submission.submitted_at,
            text: `${personName(usersById, submission.user_id)} submitted ${assignmentData[index].title}`,
          });
        });
      });

      postsPerDiscussion.forEach((postList, index) => {
        postList.forEach((post) => {
          activity.push({
            id: `post-${post.id}`,
            timestamp: post.created_at,
            text: `${personName(usersById, post.created_by_id)} posted in ${discussionData[index].title}`,
          });
        });
      });

      const recentActivity = activity
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      let integrationConfig: IntegrationConfig | null = null;
      let courseMapping: SyncMapping | null = null;

      try {
        const configs = await apiFetch<IntegrationConfig[]>("/api/v1/integration_configs");
        integrationConfig =
          configs.find(
            (config) => config.provider === "google_classroom" && config.status === "active",
          ) || null;

        if (integrationConfig) {
          const mappings = await apiFetch<SyncMapping[]>(
            `/api/v1/sync_mappings?integration_config_id=${integrationConfig.id}&local_type=Course&local_id=${courseId}`,
          );
          courseMapping = mappings.find((entry) => entry.local_type === "Course") || null;
        }
      } catch {
        integrationConfig = null;
        courseMapping = null;
      }

      return {
        course: courseData,
        modules: sortedModules,
        assignments: assignmentData,
        termsById,
        studentCount: uniqueStudents.size,
        moduleProgress,
        recentActivity,
        courseMapping,
        integrationConfig,
      } satisfies CourseHomeData;
    },
    swrConfig,
  );

  const course = data?.course ?? null;
  const modules = data?.modules ?? [];
  const assignments = data?.assignments ?? [];
  const termsById = data?.termsById ?? {};
  const studentCount = data?.studentCount ?? 0;
  const moduleProgress = data?.moduleProgress ?? {};
  const recentActivity = data?.recentActivity ?? [];
  const courseMapping = data?.courseMapping ?? null;
  const integrationConfig = data?.integrationConfig ?? null;
  const loading = isLoading && !data;
  const error = loadError ? "Unable to load course home data." : null;

  const sectionNames =
    (course?.sections || []).map((section) => section.name).join(", ") || "No sections";

  const termNames = useMemo(() => {
    const names = new Set<string>();
    (course?.sections || []).forEach((section) => {
      const term = termsById[section.term_id];
      if (term) names.add(term.name);
    });
    return Array.from(names).join(", ") || "No term assigned";
  }, [course?.sections, termsById]);

  const upcomingAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => assignment.due_at)
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
      .slice(0, 5);
  }, [assignments]);
  const classroomLinked = Boolean(courseMapping);

  async function syncNow() {
    if (!integrationConfig) return;

    setSyncingNow(true);
    try {
      if (courseMapping) {
        await apiFetch(`/api/v1/sync_mappings/${courseMapping.id}/sync_roster`, { method: "POST" });
      } else {
        await apiFetch(`/api/v1/integration_configs/${integrationConfig.id}/sync_courses`, {
          method: "POST",
        });
      }
      addToast("success", "Sync triggered.");
      await mutate();
    } catch {
      addToast("error", "Failed to trigger sync.");
    } finally {
      setSyncingNow(false);
    }
  }

  async function pushGradesNow() {
    if (!integrationConfig || !courseMapping) return;

    setPushingGrades(true);
    try {
      const assignmentMappings = await apiFetch<SyncMapping[]>(
        `/api/v1/sync_mappings?integration_config_id=${integrationConfig.id}&local_type=Assignment`,
      );
      const mappedAssignmentIds = new Set(assignmentMappings.map((mapping) => mapping.local_id));
      const mappedCourseAssignments = assignments.filter((assignment) =>
        mappedAssignmentIds.has(assignment.id),
      );

      if (mappedCourseAssignments.length === 0) {
        addToast("error", "No Classroom-linked assignments available for grade passback.");
        return;
      }

      const results = await Promise.allSettled(
        mappedCourseAssignments.map((assignment) =>
          apiFetch(`/api/v1/assignments/${assignment.id}/sync_grades`, { method: "POST" }),
        ),
      );
      const successCount = results.filter((result) => result.status === "fulfilled").length;

      if (successCount === 0) {
        addToast("error", "Grade passback could not be triggered for linked assignments.");
        return;
      }

      addToast("success", `Grade passback triggered for ${successCount} assignment(s).`);
    } catch {
      addToast("error", "Failed to trigger grade passback.");
    } finally {
      setPushingGrades(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <CourseHomeSkeleton />
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute requiredRoles={TEACHER_ROLES}>
        <AppShell>
          <p className="text-sm text-gray-500">Course not found.</p>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={TEACHER_ROLES}>
      <AppShell>
        <div className="space-y-6">
          <header className="rounded-lg border border-gray-200 bg-white p-6">
            <Link href="/teach/courses" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Courses
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              {classroomLinked && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                  Google Classroom
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{course.code}</p>
            {classroomLinked && courseMapping?.last_synced_at && (
              <p className="mt-1 text-xs text-gray-500">
                Last Classroom sync: {new Date(courseMapping.last_synced_at).toLocaleString()}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-600">{course.description}</p>
            <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
              <p>
                <span className="font-semibold text-gray-700">Section:</span> {sectionNames}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Term:</span> {termNames}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Enrollment:</span> {studentCount}{" "}
                students
              </p>
            </div>
          </header>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/teach/courses/${courseId}/modules/new`}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Module
              </Link>
              <Link
                href={`/teach/courses/${courseId}/assignments/new`}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Assignment
              </Link>
              <Link
                href={`/teach/courses/${courseId}/gradebook`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View Gradebook
              </Link>
              <Link
                href={`/teach/courses/${courseId}/quiz-performance`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Quiz Analytics
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
              <Link
                href={`/teach/courses/${courseId}/modules/new`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + New Module
              </Link>
            </div>
            {modules.length === 0 ? (
              <EmptyState
                title="No modules yet"
                description="Create modules to organize your course content."
              />
            ) : (
              <div className="space-y-2">
                {modules.map((moduleEntry) => {
                  const progress = moduleProgress[moduleEntry.id] || { completed: 0, total: 0 };
                  return (
                    <Link
                      key={moduleEntry.id}
                      href={`/teach/courses/${courseId}/modules/${moduleEntry.id}`}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{moduleEntry.title}</p>
                        <p className="text-xs text-gray-500">
                          {progress.completed} of {progress.total} items completed
                        </p>
                      </div>
                      <StatusBadge status={moduleEntry.status} />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <EmptyState
                  title="No recent activity."
                  description="Activity will appear here as students interact with this course."
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="rounded-md border border-gray-100 px-3 py-2">
                      <p className="text-sm text-gray-700">{item.text}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
              {upcomingAssignments.length === 0 ? (
                <EmptyState
                  title="No upcoming assignments."
                  description="Assignments with due dates will appear here."
                />
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcomingAssignments.map((assignment) => (
                    <li key={assignment.id} className="rounded-md border border-gray-100 px-3 py-2">
                      <Link
                        href={`/teach/courses/${courseId}/assignments/${assignment.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-700"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {assignment.due_at
                          ? new Date(assignment.due_at).toLocaleString()
                          : "No due date"}{" "}
                        - {countdownLabel(assignment.due_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Roster</h2>
                <p className="text-sm text-gray-600">{studentCount} enrolled students</p>
              </div>
              <Link
                href={`/teach/courses/${courseId}/roster`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                View Roster
              </Link>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Classroom Sync</h2>
                {integrationConfig ? (
                  <>
                    <p className="text-sm text-gray-600">
                      {classroomLinked
                        ? "Linked to Google Classroom"
                        : "Integration active, but this course is not linked yet"}
                    </p>
                    {!classroomLinked && (
                      <Link
                        href="/admin/integrations"
                        className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
                      >
                        Connect to Google Classroom
                      </Link>
                    )}
                    {courseMapping?.last_synced_at && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(courseMapping.last_synced_at).toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    Google Classroom is not connected for this school.
                  </p>
                )}
              </div>

              {integrationConfig ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void syncNow()}
                    disabled={syncingNow}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncingNow ? "Syncing..." : "Sync Now"}
                  </button>
                  <button
                    onClick={() => void pushGradesNow()}
                    disabled={!classroomLinked || pushingGrades}
                    className="rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    {pushingGrades ? "Pushing..." : "Push Grades"}
                  </button>
                </div>
              ) : (
                <Link
                  href="/admin/integrations"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Connect to Google Classroom
                </Link>
              )}
            </div>
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
