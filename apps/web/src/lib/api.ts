const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
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
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("/api/v1/me");
}
