import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface Quiz {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
  points_possible: number | null;
  course_id?: number;
}

export interface UseQuizzesParams {
  page?: number;
  per_page?: number;
  status?: string;
}

export function useQuizzes(
  courseId?: string | number | null,
  params: UseQuizzesParams = {},
  config?: SWRConfiguration<Quiz[]>,
) {
  const query = buildQueryString(params);
  const path = courseId ? `/api/v1/courses/${courseId}/quizzes` : "/api/v1/quizzes";
  return useAppSWR<Quiz[]>(`${path}${query}`, config);
}

export function useQuiz(
  quizId: string | number | null | undefined,
  config?: SWRConfiguration<Quiz>,
) {
  return useAppSWR<Quiz>(quizId ? `/api/v1/quizzes/${quizId}` : null, config);
}
