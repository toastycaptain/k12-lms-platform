import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface Assignment {
  id: number;
  course_id: number;
  title: string;
  due_at: string | null;
  points_possible: number | string | null;
  status?: string;
}

export interface UseAssignmentsParams {
  page?: number;
  per_page?: number;
  status?: string;
  course_id?: number;
}

export function useAssignments(
  params: UseAssignmentsParams = {},
  config?: SWRConfiguration<Assignment[]>,
) {
  const query = buildQueryString(params);
  return useAppSWR<Assignment[]>(`/api/v1/assignments${query}`, config);
}

export function useAssignment(
  assignmentId: string | number | null | undefined,
  config?: SWRConfiguration<Assignment>,
) {
  return useAppSWR<Assignment>(assignmentId ? `/api/v1/assignments/${assignmentId}` : null, config);
}

export function useCourseAssignments(
  courseId: string | number | null | undefined,
  config?: SWRConfiguration<Assignment[]>,
) {
  return useAppSWR<Assignment[]>(
    courseId ? `/api/v1/courses/${courseId}/assignments` : null,
    config,
  );
}
