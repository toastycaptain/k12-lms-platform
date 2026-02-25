import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import { apiFetch } from "@/lib/api";

interface SubmissionPayload {
  submission_type: "text" | "url";
  body?: string | null;
  url?: string | null;
}

interface GradePayload {
  grade?: number;
  feedback?: string;
  status?: "graded" | "returned";
}

export function useSubmitAssignmentMutation(assignmentId: number | string | null | undefined) {
  const key = assignmentId ? `/api/v1/assignments/${assignmentId}/submissions` : null;

  return useSWRMutation(key, async (url: string, { arg }: { arg: SubmissionPayload }) => {
    const response = await apiFetch(url, {
      method: "POST",
      body: JSON.stringify(arg),
    });

    await mutate(url);
    return response;
  });
}

export function useGradeSubmissionMutation(submissionId: number | string | null | undefined) {
  const key = submissionId ? `/api/v1/submissions/${submissionId}/grade` : null;

  return useSWRMutation(key, async (url: string, { arg }: { arg: GradePayload }) => {
    const response = await apiFetch(url, {
      method: "POST",
      body: JSON.stringify(arg),
    });

    await mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.includes("/gradebook"));
    return response;
  });
}

export function usePublishUnitMutation(unitId: number | string | null | undefined) {
  const key = unitId ? `/api/v1/unit_plans/${unitId}/publish` : null;

  return useSWRMutation(key, async (url: string) => {
    const response = await apiFetch(url, { method: "POST" });

    await mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.includes("/unit_plans"));
    return response;
  });
}
