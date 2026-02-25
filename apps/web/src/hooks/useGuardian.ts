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
