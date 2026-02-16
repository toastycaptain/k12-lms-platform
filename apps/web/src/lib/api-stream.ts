import { buildApiUrl, getCsrfToken } from "@/lib/api";

interface StreamEvent {
  token?: string;
  done?: boolean;
  content?: string;
  error?: string;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function apiFetchStream(
  path: string,
  body: Record<string, unknown>,
  onToken: (token: string) => void,
  onDone?: (fullText: string) => void,
  onError?: (error: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("X-CSRF-Token", await getCsrfToken());

  const requestOptions: RequestInit = {
    method: "POST",
    headers,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
    signal,
  };

  let response = await fetch(buildApiUrl(path), requestOptions);

  if (!response.ok && (response.status === 403 || response.status === 422)) {
    headers.set("X-CSRF-Token", await getCsrfToken(true));
    response = await fetch(buildApiUrl(path), requestOptions);
  }

  if (!response.ok || !response.body) {
    const text = await response.text();
    const message = text || `Stream request failed (${response.status})`;
    onError?.(message);
    throw new Error(message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let errorNotified = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (!data || data === "[DONE]") continue;

        let parsed: StreamEvent | null = null;
        try {
          parsed = JSON.parse(data) as StreamEvent;
        } catch {
          continue;
        }

        if (parsed.error) {
          errorNotified = true;
          onError?.(parsed.error);
          throw new Error(parsed.error);
        }

        if (parsed.done) {
          onDone?.(parsed.content || fullText);
          return;
        }

        if (parsed.token) {
          fullText += parsed.token;
          onToken(parsed.token);
        }
      }
    }

    onDone?.(fullText);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (!errorNotified) {
      const message = error instanceof Error ? error.message : "Stream request failed";
      onError?.(message);
    }

    throw error;
  } finally {
    reader.releaseLock();
  }
}
