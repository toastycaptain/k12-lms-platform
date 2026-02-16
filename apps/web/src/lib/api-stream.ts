const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_V1_PREFIX = "/api/v1";

interface StreamEvent {
  token?: string;
  done?: boolean;
  content?: string;
  error?: string;
}

function normalizedBaseUrl(): string {
  return API_BASE_URL.replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  const base = normalizedBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith(API_V1_PREFIX) && normalizedPath.startsWith(API_V1_PREFIX)) {
    return `${base}${normalizedPath.slice(API_V1_PREFIX.length)}`;
  }

  return `${base}${normalizedPath}`;
}

function isAbortError(error: unknown): boolean {
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
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
    signal,
  });

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
