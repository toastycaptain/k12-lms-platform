import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  submitted_at: string | null;
  updated_at?: string;
  status?: string;
  grade?: string | number | null;
  feedback?: string | null;
}

export interface UseSubmissionsParams {
  page?: number;
  per_page?: number;
  status?: string;
  assignment_id?: number;
}

export function useSubmissions(
  params: UseSubmissionsParams = {},
  config?: SWRConfiguration<Submission[]>,
) {
  const query = buildQueryString(params);
  return useAppSWR<Submission[]>(`/api/v1/submissions${query}`, config);
}

export function useSubmission(
  submissionId: string | number | null | undefined,
  config?: SWRConfiguration<Submission>,
) {
  return useAppSWR<Submission>(submissionId ? `/api/v1/submissions/${submissionId}` : null, config);
}

export function useAssignmentSubmissions(
  assignmentId: string | number | null | undefined,
  config?: SWRConfiguration<Submission[]>,
) {
  return useAppSWR<Submission[]>(
    assignmentId ? `/api/v1/assignments/${assignmentId}/submissions` : null,
    config,
  );
}
