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
  roles: string[];
}

interface MeResponse {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
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
  };
}
