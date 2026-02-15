const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const selectedSchoolId =
    typeof window !== "undefined" ? window.localStorage.getItem("k12.selectedSchoolId") : null;

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (selectedSchoolId && !headers.has("X-School-Id")) {
    headers.set("X-School-Id", selectedSchoolId);
  }

  if (hasBody && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    cache: options.cache ?? "no-store",
    headers,
  });

  if (!response.ok) {
    let message = `API error: ${response.statusText}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = String(errorBody.error);
      } else if (errorBody?.message) {
        message = String(errorBody.message);
      }
    } catch {
      // Fall through to generic status text when body is empty or not JSON.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getAuthUrl(): string {
  return `${API_BASE_URL}/auth/google_oauth2`;
}

export function getSignOutUrl(): string {
  return `${API_BASE_URL}/api/v1/session`;
}

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: number;
  roles: string[];
  google_connected: boolean;
  onboarding_complete: boolean;
  preferences: Record<string, unknown>;
}

interface MeResponse {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    google_connected?: boolean;
    onboarding_complete?: boolean;
    preferences?: Record<string, unknown>;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
  };
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const data = await apiFetch<MeResponse>("/api/v1/me");
  return {
    id: data.user.id,
    email: data.user.email,
    first_name: data.user.first_name,
    last_name: data.user.last_name,
    tenant_id: data.tenant.id,
    roles: data.user.roles,
    google_connected: data.user.google_connected ?? false,
    onboarding_complete: data.user.onboarding_complete ?? false,
    preferences: data.user.preferences ?? {},
  };
}
