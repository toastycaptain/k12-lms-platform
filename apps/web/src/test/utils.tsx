import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import type { CurrentUser } from "@/lib/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

// ---------------------------------------------------------------------------
// Mock user factory
// ---------------------------------------------------------------------------
export function createMockUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: 1,
    email: "teacher@example.com",
    first_name: "Taylor",
    last_name: "Teacher",
    tenant_id: 1,
    roles: ["teacher"],
    district_admin: false,
    google_connected: false,
    onboarding_complete: true,
    preferences: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Auth context mock helper
// ---------------------------------------------------------------------------
export interface MockAuthOptions {
  user?: CurrentUser | null;
  loading?: boolean;
  error?: string | null;
}

export function mockAuth(options: MockAuthOptions = {}) {
  const value = {
    user: options.user ?? createMockUser(),
    loading: options.loading ?? false,
    error: options.error ?? null,
    signOut: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  };

  vi.mocked(useAuth).mockReturnValue(value);
  return value;
}

// ---------------------------------------------------------------------------
// Router mock helper
// ---------------------------------------------------------------------------
export function mockRouter(overrides: Record<string, unknown> = {}) {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  };

  vi.mocked(useRouter).mockReturnValue(router as never);
  return router;
}

export function mockPathname(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
}

export function mockSearchParams(params: Record<string, string> = {}) {
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(params) as never);
}

// ---------------------------------------------------------------------------
// API fetch mock helper
// ---------------------------------------------------------------------------
export function mockApiFetch(handlers: Record<string, unknown>) {
  vi.mocked(apiFetch).mockImplementation(async (path: string) => {
    for (const [pattern, response] of Object.entries(handlers)) {
      if (path === pattern || path.startsWith(pattern)) {
        if (response instanceof Error) throw response;
        return response;
      }
    }

    throw new Error(`Unexpected apiFetch call: ${path}`);
  });

  return apiFetch;
}

// ---------------------------------------------------------------------------
// renderWithProviders — renders a component with typical page-level mocks
// already applied. Callers MUST still call vi.mock() at the top of their
// test files; this helper simply renders the element.
// ---------------------------------------------------------------------------
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options });
}
