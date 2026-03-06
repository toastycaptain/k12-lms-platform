import { clearStoredSchoolId, readStoredSchoolId } from "@/lib/school-storage";

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

interface ParsedErrorResponse {
  message: string;
  details?: unknown;
}

async function parseErrorResponse(response: Response): Promise<ParsedErrorResponse> {
  let message = `API error: ${response.statusText}`;
  let details: unknown;

  try {
    const errorBody = await response.json();
    details = errorBody?.details;
    if (errorBody?.error) {
      message = String(errorBody.error);
    } else if (errorBody?.message) {
      message = String(errorBody.message);
    } else if (Array.isArray(errorBody?.errors) && errorBody.errors.length > 0) {
      message = String(errorBody.errors[0]);
    }
  } catch {
    // Fall through to generic status text when body is empty or not JSON.
  }

  return { message, details };
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function shouldResetSchoolSelection(
  status: number,
  message: string,
  schoolId: string | null,
): boolean {
  if (!schoolId || (status !== 403 && status !== 404)) {
    return false;
  }

  return /school/i.test(message);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildApiUrl(path);
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const selectedSchoolId = readStoredSchoolId();
  const method = (options.method || "GET").toUpperCase();
  const mutationRequest = isMutationMethod(method);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest");
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

  if (!response.ok) {
    const initialError = await parseErrorResponse(response.clone());
    if (shouldResetSchoolSelection(response.status, initialError.message, selectedSchoolId)) {
      clearStoredSchoolId();
      headers.delete("X-School-Id");
      response = await doRequest();
    }
  }

  if (!response.ok && mutationRequest && (response.status === 403 || response.status === 422)) {
    try {
      headers.set("X-CSRF-Token", await requestCsrfToken(true));
      response = await doRequest();
    } catch {
      // If token refresh fails, return original response below.
    }
  }

  if (!response.ok) {
    const { message, details } = await parseErrorResponse(response);
    throw new ApiError(response.status, message, details);
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

export interface CurriculumRuntimePayload {
  profile_key?: string;
  profile_version?: string;
  pack_key?: string;
  pack_version?: string;
  selected_from?: string;
  terminology?: Record<string, string>;
  navigation?: Record<string, string[]>;
  visible_navigation?: string[];
  feature_flags?: Record<string, boolean>;
  pack_payload_source?: "tenant_release" | "system" | "fallback";
  pack_release_id?: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: number;
  roles: string[];
  district_admin?: boolean;
  impersonating?: boolean;
  impersonator?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  google_connected: boolean;
  onboarding_complete: boolean;
  preferences: Record<string, unknown>;
  curriculum_default_profile_key?: string;
  curriculum_default_profile_version?: string;
  curriculum_runtime?: CurriculumRuntimePayload;
}

interface MeResponse {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
    district_admin?: boolean;
    impersonating?: boolean;
    impersonator?: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    } | null;
    google_connected?: boolean;
    onboarding_complete?: boolean;
    preferences?: Record<string, unknown>;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
    curriculum_default_profile_key?: string;
    curriculum_default_profile_version?: string;
    curriculum_runtime?: CurriculumRuntimePayload;
  };
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const data = await apiFetch<MeResponse>("/api/v1/me");
  const currentUser: CurrentUser = {
    id: data.user.id,
    email: data.user.email,
    first_name: data.user.first_name,
    last_name: data.user.last_name,
    tenant_id: data.tenant.id,
    roles: data.user.roles,
    district_admin: data.user.district_admin ?? data.user.roles.includes("district_admin"),
    impersonating: data.user.impersonating ?? false,
    impersonator: data.user.impersonator ?? null,
    google_connected: data.user.google_connected ?? false,
    onboarding_complete: data.user.onboarding_complete ?? false,
    preferences: data.user.preferences ?? {},
  };

  if (data.tenant.curriculum_default_profile_key) {
    currentUser.curriculum_default_profile_key = data.tenant.curriculum_default_profile_key;
  }
  if (data.tenant.curriculum_default_profile_version) {
    currentUser.curriculum_default_profile_version = data.tenant.curriculum_default_profile_version;
  }
  if (data.tenant.curriculum_runtime) {
    currentUser.curriculum_runtime = data.tenant.curriculum_runtime;
  }

  return currentUser;
}

export function __resetApiClientStateForTests() {
  csrfTokenCache = null;
  csrfTokenPromise = null;
}
