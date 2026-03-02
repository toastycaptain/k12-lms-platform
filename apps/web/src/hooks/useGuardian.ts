import { type SWRConfiguration } from "swr";
import { useAppSWR } from "@/lib/swr";

export interface GuardianStudent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  course_count: number;
  courses: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

export interface GuardianGrade {
  id: number;
  assignment_id: number;
  assignment_title: string;
  course_id: number;
  course_name: string;
  score: number | null;
  points_possible: number | null;
  percentage: number | null;
  graded_at: string | null;
  status: string;
}

export interface GuardianAssignment {
  id: number;
  title: string;
  description: string | null;
  due_at: string | null;
  course_id: number;
  course_name: string;
  status: string;
  submitted_at: string | null;
  grade: number | null;
  points_possible: number | null;
}

export interface GuardianAnnouncement {
  id: number;
  title: string;
  message: string;
  created_at: string;
  course_id: number;
}

export interface GuardianAttendanceSummary {
  total: number;
  present: number;
  absent: number;
  tardy: number;
  excused: number;
}

export interface GuardianAttendanceRecord {
  id: number;
  student_id: number;
  student_name: string;
  section_id: number | null;
  section_name: string | null;
  course_id: number | null;
  course_name: string | null;
  occurred_on: string;
  status: "present" | "absent" | "tardy" | "excused";
  notes: string | null;
  recorded_by: {
    id: number;
    name: string;
  } | null;
}

export interface GuardianAttendanceResponse {
  summary: GuardianAttendanceSummary;
  records: GuardianAttendanceRecord[];
}

export interface GuardianClassToday {
  student_id: number;
  student_name: string;
  section_id: number;
  section_name: string;
  course_id: number;
  course_name: string;
  weekday: number;
  start_at: string;
  end_at: string;
  location: string | null;
  teachers: Array<{
    id: number;
    name: string;
  }>;
}

export interface GuardianCalendarEvent {
  type: "unit_plan" | "assignment" | "quiz";
  id: number;
  title: string;
  course_id: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  status?: string;
}

export interface GuardianCalendarResponse {
  events: GuardianCalendarEvent[];
}

interface DateRangeOptions {
  startDate?: string;
  endDate?: string;
}

function dateRangeQuery(options?: DateRangeOptions): string {
  if (!options) return "";

  const params = new URLSearchParams();
  if (options.startDate) params.set("start_date", options.startDate);
  if (options.endDate) params.set("end_date", options.endDate);
  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useGuardianStudents(config?: SWRConfiguration<GuardianStudent[]>) {
  return useAppSWR<GuardianStudent[]>("/api/v1/guardian/students", config);
}

export function useGuardianGrades(
  studentId: string | number | null | undefined,
  config?: SWRConfiguration<GuardianGrade[]>,
) {
  return useAppSWR<GuardianGrade[]>(
    studentId ? `/api/v1/guardian/students/${studentId}/grades` : null,
    config,
  );
}

export function useGuardianAssignments(
  studentId: string | number | null | undefined,
  config?: SWRConfiguration<GuardianAssignment[]>,
) {
  return useAppSWR<GuardianAssignment[]>(
    studentId ? `/api/v1/guardian/students/${studentId}/assignments` : null,
    config,
  );
}

export function useGuardianAnnouncements(
  studentId: string | number | null | undefined,
  config?: SWRConfiguration<GuardianAnnouncement[]>,
) {
  return useAppSWR<GuardianAnnouncement[]>(
    studentId ? `/api/v1/guardian/students/${studentId}/announcements` : null,
    config,
  );
}

export function useGuardianAttendance(
  studentId: string | number | null | undefined,
  options?: DateRangeOptions,
  config?: SWRConfiguration<GuardianAttendanceResponse>,
) {
  return useAppSWR<GuardianAttendanceResponse>(
    studentId
      ? `/api/v1/guardian/students/${studentId}/attendance${dateRangeQuery(options)}`
      : null,
    config,
  );
}

export function useGuardianClassesToday(
  studentId: string | number | null | undefined,
  config?: SWRConfiguration<GuardianClassToday[]>,
) {
  return useAppSWR<GuardianClassToday[]>(
    studentId ? `/api/v1/guardian/students/${studentId}/classes_today` : null,
    config,
  );
}

export function useGuardianCalendar(
  studentId: string | number | null | undefined,
  options?: DateRangeOptions,
  config?: SWRConfiguration<GuardianCalendarResponse>,
) {
  return useAppSWR<GuardianCalendarResponse>(
    studentId ? `/api/v1/guardian/students/${studentId}/calendar${dateRangeQuery(options)}` : null,
    config,
  );
}
