import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface CourseSection {
  id: number;
  name: string;
  term_id: number;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
  sections?: CourseSection[];
}

export interface UseCoursesParams {
  page?: number;
  per_page?: number;
  role?: string;
  q?: string;
}

export function useCourses(params: UseCoursesParams = {}, config?: SWRConfiguration<Course[]>) {
  const query = buildQueryString(params);
  return useAppSWR<Course[]>(`/api/v1/courses${query}`, config);
}

export function useCourse(
  courseId: string | number | null | undefined,
  config?: SWRConfiguration<Course>,
) {
  return useAppSWR<Course>(courseId ? `/api/v1/courses/${courseId}` : null, config);
}
