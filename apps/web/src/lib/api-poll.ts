interface InvocationResponse {
  status?: string;
  error_message?: string;
  [key: string]: unknown;
}

export async function pollInvocation(
  invocationId: number,
  onComplete: (result: Record<string, unknown>) => void,
  onError: (error: string) => void,
  intervalMs = 2000,
  maxAttempts = 60,
): Promise<void> {
  const { apiFetch } = await import("./api");

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await apiFetch<InvocationResponse>(`/ai_invocations/${invocationId}`);

    if (response.status === "completed") {
      onComplete(response);
      return;
    }

    if (response.status === "failed") {
      onError(response.error_message || "Generation failed");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  onError("Generation timed out");
}
