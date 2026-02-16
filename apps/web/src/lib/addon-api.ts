import { ApiError, buildApiUrl, getAuthUrl } from "@/lib/api";

export function resolveAddonToken(searchParams: URLSearchParams): string {
  return (
    searchParams.get("token") ||
    searchParams.get("addonToken") ||
    process.env.NEXT_PUBLIC_ADDON_TOKEN ||
    ""
  );
}

export async function addonApiFetch<T>(
  path: string,
  addonToken: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (options.body && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (addonToken) {
    headers.set("Authorization", `Bearer ${addonToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = "Addon API request failed";
    try {
      const body = (await response.json()) as { error?: string; detail?: string; message?: string };
      message = body.error || body.detail || body.message || message;
    } catch {
      // Keep fallback message.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function openAddonSignInPopup() {
  if (typeof window === "undefined") return;
  const authUrl = getAuthUrl();
  window.open(authUrl, "k12-addon-auth", "width=540,height=700,noopener,noreferrer");
}
