const DEFAULT_API_BASE_URL = "http://localhost:3001";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/[<>]/g, "");
const API_V1_PREFIX = "/api/v1";
const CSRF_PATH = `${API_V1_PREFIX}/csrf`;

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

function normalizedBaseUrl(): string {
  return API_BASE_URL.replace(/\/+$/, "");
}

export function getApiOrigin(): string {
  return normalizedBaseUrl().replace(/\/api\/v1$/, "");
}

export function buildApiUrl(path: string): string {
  const base = normalizedBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (base.endsWith(API_V1_PREFIX) && normalizedPath.startsWith(API_V1_PREFIX)) {
    return `${base}${normalizedPath.slice(API_V1_PREFIX.length)}`;
  }

  return `${base}${normalizedPath}`;
}

function isMutationMethod(method?: string): boolean {
  const verb = (method || "GET").toUpperCase();
  return verb === "POST" || verb === "PATCH" || verb === "PUT" || verb === "DELETE";
}

async function requestCsrfToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && csrfTokenCache) {
    return csrfTokenCache;
  }

  if (!forceRefresh && csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = fetch(buildApiUrl(CSRF_PATH), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new ApiError(response.status, "Unable to fetch CSRF token");
      }

      const data = (await response.json()) as { token?: string };
      if (!data.token) {
        throw new ApiError(500, "CSRF token missing from response");
      }

      csrfTokenCache = data.token;
      return data.token;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
}

export async function getCsrfToken(forceRefresh = false): Promise<string> {
  return requestCsrfToken(forceRefresh);
}

async function parseErrorMessage(response: Response): Promise<string> {
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

  return message;
}

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
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const selectedSchoolId =
    typeof window !== "undefined" && typeof window.localStorage?.getItem === "function"
      ? window.localStorage.getItem("k12.selectedSchoolId")
      : null;
  const method = (options.method || "GET").toUpperCase();
  const mutationRequest = isMutationMethod(method);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (selectedSchoolId && !headers.has("X-School-Id")) {
    headers.set("X-School-Id", selectedSchoolId);
  }

  if (hasBody && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (mutationRequest && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", await requestCsrfToken());
  }

  const doRequest = async (): Promise<Response> => {
    return fetch(url, {
      ...options,
      method,
      credentials: "include",
      cache: options.cache ?? "no-store",
      headers,
    });
  };

  let response = await doRequest();

  if (!response.ok && mutationRequest && (response.status === 403 || response.status === 422)) {
    try {
      headers.set("X-CSRF-Token", await requestCsrfToken(true));
      response = await doRequest();
    } catch {
      // If token refresh fails, return original response below.
    }
  }

  if (!response.ok) {
    const message = await parseErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getAuthUrl(): string {
  return `${getApiOrigin()}/auth/google_oauth2`;
}

export function getSamlAuthUrl(tenantSlug: string): string {
  const query = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : "";
  return `${getApiOrigin()}/auth/saml${query}`;
}

export function getSignOutUrl(): string {
  return `${getApiOrigin()}/api/v1/session`;
}

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: number;
  roles: string[];
  district_admin?: boolean;
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
    district_admin?: boolean;
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
    district_admin: data.user.district_admin ?? data.user.roles.includes("district_admin"),
    google_connected: data.user.google_connected ?? false,
    onboarding_complete: data.user.onboarding_complete ?? false,
    preferences: data.user.preferences ?? {},
  };
}

export function __resetApiClientStateForTests() {
  csrfTokenCache = null;
  csrfTokenPromise = null;
}
