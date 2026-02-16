# Codex Instructions — Frontend Testing (Vitest + React Testing Library)

## Objective

Add comprehensive frontend tests to the K-12 LMS platform. The application has 79 pages, 10 components, and 6 lib files, but currently only 6 test suites exist. This task builds out a complete test suite covering shared test utilities, all components, critical page flows, API layer modules, and accessibility. The target is at least 40% code coverage with zero test failures.

---

## What Already Exists

### Frontend Stack
- Next.js 16.1.6, React 19, TypeScript 5
- All pages use `"use client"`, `ProtectedRoute`, `AppShell` wrappers
- `apiFetch` in `src/lib/api.ts` is the sole HTTP layer (never call real APIs)
- Auth via `AuthProvider` / `useAuth()` from `src/lib/auth-context.tsx`

### Test Stack (already installed and configured)
- Vitest 4 + `@vitest/coverage-v8` (see `vitest.config.ts`)
- `@testing-library/react` + `@testing-library/jest-dom`
- `vitest-axe` + `axe-core`
- jsdom environment, globals enabled
- Setup file at `src/test/setup.ts` (imports jest-dom matchers + vitest-axe extend-expect, runs cleanup after each test)
- Path alias `@/` resolves to `./src/`

### Existing Test Files (6 total)
1. `src/components/ProtectedRoute.test.tsx` — 4 tests (loading, redirect, render, role check)
2. `src/lib/api.test.ts` — 3 tests (success, 401, non-JSON error)
3. `src/lib/__tests__/api.test.ts` — 1 smoke test (importable)
4. `src/lib/auth-context.test.tsx` — 3 tests (load user, error, sign out)
5. `src/app/__tests__/a11y.test.tsx` — 2 tests (AppShell a11y, GlobalSearch a11y)
6. `src/app/dashboard/page.test.tsx` — 1 test (renders dashboard data)

### Vitest Config Notes
- Coverage currently excludes `src/app/**`, `AppShell.tsx`, `AiAssistantPanel.tsx`, `GoogleDrivePicker.tsx`
- Coverage threshold: `lines: 10`

### Key Mocking Patterns (follow exactly)

**Mock `next/navigation`:**
```typescript
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
```

**Mock `@/lib/auth-context`:**
```typescript
vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));
```

**Mock `@/lib/api` (inline implementation):**
```typescript
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  getAuthUrl: vi.fn(() => "http://localhost:3001/auth/google_oauth2"),
  getSamlAuthUrl: vi.fn((slug: string) => `http://localhost:3001/auth/saml?tenant=${slug}`),
  getSignOutUrl: vi.fn(() => "http://localhost:3001/api/v1/session"),
  fetchCurrentUser: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = "ApiError";
    }
  },
}));
```

**Mock `@/lib/api-stream`:**
```typescript
vi.mock("@/lib/api-stream", () => ({
  apiFetchStream: vi.fn(),
  isAbortError: vi.fn((e: unknown) => e instanceof DOMException && (e as DOMException).name === "AbortError"),
}));
```

**Mock wrapper components for page tests:**
```typescript
vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

**Mock `next/link`:**
```typescript
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));
```

---

## Task 1: Test Infrastructure

### 1a. Shared Test Utilities

**Create:** `apps/web/src/test/utils.tsx`

Provide reusable helpers that wrap common mocking patterns. Every helper must be fully typed.

```typescript
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { CurrentUser } from "@/lib/api";

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
  const { useAuth } = require("@/lib/auth-context") as { useAuth: ReturnType<typeof vi.fn> };
  const value = {
    user: options.user ?? createMockUser(),
    loading: options.loading ?? false,
    error: options.error ?? null,
    signOut: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  };
  useAuth.mockReturnValue(value);
  return value;
}

// ---------------------------------------------------------------------------
// Router mock helper
// ---------------------------------------------------------------------------
export function mockRouter(overrides: Record<string, unknown> = {}) {
  const nav = require("next/navigation") as {
    useRouter: ReturnType<typeof vi.fn>;
    usePathname: ReturnType<typeof vi.fn>;
    useSearchParams: ReturnType<typeof vi.fn>;
  };
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...overrides,
  };
  nav.useRouter.mockReturnValue(router);
  return router;
}

export function mockPathname(pathname: string) {
  const nav = require("next/navigation") as {
    usePathname: ReturnType<typeof vi.fn>;
  };
  nav.usePathname.mockReturnValue(pathname);
}

export function mockSearchParams(params: Record<string, string> = {}) {
  const nav = require("next/navigation") as {
    useSearchParams: ReturnType<typeof vi.fn>;
  };
  nav.useSearchParams.mockReturnValue(new URLSearchParams(params));
}

// ---------------------------------------------------------------------------
// API fetch mock helper
// ---------------------------------------------------------------------------
export function mockApiFetch(handlers: Record<string, unknown>) {
  const { apiFetch } = require("@/lib/api") as { apiFetch: ReturnType<typeof vi.fn> };
  apiFetch.mockImplementation(async (path: string) => {
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
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { ...options });
}
```

### 1b. Mock Data Factories

**Create:** `apps/web/src/test/factories.ts`

Typed factory functions for every core domain entity used in tests. Each factory returns a plain object matching the API response shape and accepts partial overrides.

```typescript
// factories.ts — typed mock data for test suites

export function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    email: "teacher@example.com",
    first_name: "Taylor",
    last_name: "Teacher",
    tenant_id: 1,
    roles: ["teacher"],
    google_connected: false,
    onboarding_complete: true,
    preferences: {},
    ...overrides,
  };
}

export function buildCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Biology 101",
    code: "BIO-101",
    description: "Introductory biology",
    school_id: 1,
    teacher_id: 1,
    status: "active",
    ...overrides,
  };
}

export function buildUnitPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Biology",
    status: "draft",
    course_id: 1,
    grade_band: "9-10",
    subject: "Science",
    created_at: "2026-02-15T12:00:00Z",
    updated_at: "2026-02-15T12:00:00Z",
    ...overrides,
  };
}

export function buildLessonPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Introduction to Cells",
    unit_plan_id: 1,
    position: 1,
    duration_minutes: 45,
    objectives: "Students will identify cell structures.",
    activities: "Lecture and lab.",
    materials: "Microscopes, slides",
    ...overrides,
  };
}

export function buildAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Diagram",
    description: "Draw and label a cell diagram.",
    course_id: 1,
    module_id: 1,
    due_date: "2026-03-01T23:59:00Z",
    points_possible: 100,
    status: "published",
    submission_type: "online",
    ...overrides,
  };
}

export function buildQuiz(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Cell Biology Quiz",
    description: "Test on cell structures.",
    course_id: 1,
    time_limit_minutes: 30,
    attempts_allowed: 2,
    status: "published",
    questions_count: 10,
    ...overrides,
  };
}

export function buildQuizAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    quiz_id: 1,
    student_id: 2,
    status: "in_progress",
    started_at: "2026-02-15T10:00:00Z",
    finished_at: null,
    score: null,
    answers: [],
    ...overrides,
  };
}

export function buildQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    question_bank_id: 1,
    question_type: "multiple_choice",
    prompt: "What is the powerhouse of the cell?",
    options: [
      { id: "a", text: "Mitochondria" },
      { id: "b", text: "Nucleus" },
      { id: "c", text: "Ribosome" },
      { id: "d", text: "Golgi apparatus" },
    ],
    correct_answer: "a",
    points: 10,
    ...overrides,
  };
}

export function buildNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "New Assignment",
    message: "Cell Diagram has been posted.",
    url: "/learn/courses/1/assignments/1",
    read_at: null,
    created_at: "2026-02-15T10:00:00Z",
    ...overrides,
  };
}

export function buildSchool(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "Lincoln High School",
    slug: "lincoln-high",
    ...overrides,
  };
}

export function buildModule(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Module 1: Foundations",
    course_id: 1,
    position: 1,
    status: "published",
    items: [],
    ...overrides,
  };
}

export function buildStandard(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    code: "NGSS-MS-LS1-1",
    description: "Conduct an investigation to provide evidence that living things are made of cells.",
    subject: "Science",
    grade_band: "6-8",
    framework: "NGSS",
    ...overrides,
  };
}

export function buildSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    assignment_id: 1,
    student_id: 2,
    student_name: "Sam Student",
    status: "submitted",
    submitted_at: "2026-02-14T15:00:00Z",
    grade: null,
    feedback: null,
    ...overrides,
  };
}

export function buildMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subject: "Question about homework",
    body: "Can I get an extension?",
    sender_id: 2,
    sender_name: "Sam Student",
    recipient_id: 1,
    read_at: null,
    created_at: "2026-02-15T09:00:00Z",
    ...overrides,
  };
}

export function buildAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    title: "Welcome to the course",
    body: "Please review the syllabus.",
    course_id: 1,
    author_id: 1,
    author_name: "Taylor Teacher",
    created_at: "2026-02-10T08:00:00Z",
    ...overrides,
  };
}

export function buildThread(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subject: "Question about homework",
    participants: [
      { id: 1, name: "Taylor Teacher" },
      { id: 2, name: "Sam Student" },
    ],
    last_message_at: "2026-02-15T09:00:00Z",
    unread_count: 1,
    ...overrides,
  };
}

export function buildSearchResult(overrides: Record<string, unknown> = {}) {
  return {
    type: "unit_plan",
    id: 1,
    title: "Cell Biology",
    url: "/plan/units/1",
    ...overrides,
  };
}

export function buildAiTaskPolicy(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    task_type: "lesson_plan",
    enabled: true,
    ...overrides,
  };
}

export function buildSamlConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    idp_entity_id: "https://idp.example.com/saml",
    idp_sso_url: "https://idp.example.com/sso",
    idp_certificate: "MIICpDCCAYwCCQD...",
    sp_entity_id: "https://lms.example.com/saml/metadata",
    enabled: true,
    ...overrides,
  };
}
```

---

## Task 2: Component Tests (10 components)

Create a test file for each component in `apps/web/src/components/`. Place test files adjacent to the component: `src/components/<ComponentName>.test.tsx`.

For **ProtectedRoute**, the test file already exists — extend it with additional cases.

### Required mocks for every component test file

At the top of every component test file, include the relevant `vi.mock()` calls for `next/navigation`, `next/link`, `@/lib/auth-context`, and `@/lib/api` as shown in the "Key Mocking Patterns" section above. Only include mocks the component actually imports.

### 2a. AppShell.test.tsx

**File:** `apps/web/src/components/AppShell.test.tsx`

Mock `NotificationBell`, `SchoolSelector`, `GlobalSearch`, `LiveRegion` as simple stubs (the existing a11y test demonstrates this pattern).

**Tests:**

1. **renders nav items filtered by user role (teacher)** — a teacher user should see Plan, Teach, Assess, Report, Communicate, but NOT Admin
2. **renders nav items filtered by user role (admin)** — admin should see all nav sections including Admin
3. **renders nav items filtered by user role (student)** — student should see Learn and Communicate only
4. **highlights active route** — when pathname is `/plan/units`, the Plan link should have `aria-current="page"`
5. **expands child nav items for active section** — when pathname starts with `/plan/`, child links (Units, Calendar, etc.) should be visible
6. **does not show child nav for inactive section** — child links for non-active sections should not render
7. **toggles mobile sidebar** — clicking the open/close button toggles sidebar visibility
8. **renders sign out button when user is present** — "Sign out" button should be in the document
9. **does not render search, notifications, sign out when no user** — when `useAuth` returns `user: null`
10. **displays skip navigation link** — "Skip to main content" link should be present

### 2b. GlobalSearch.test.tsx

**File:** `apps/web/src/components/GlobalSearch.test.tsx`

Mock `@/lib/api` and `@/components/LiveRegion` (mock `announce` as `vi.fn()`).

**Tests:**

1. **does not search when query is shorter than 2 characters** — type a single char, verify `apiFetch` is NOT called
2. **debounces search by 300ms** — type "cell", advance timers by 300ms, verify `apiFetch` is called once with `/api/v1/search?q=cell`
3. **renders search results grouped by type** — provide results with `unit_plan` and `course` types, verify group headings appear
4. **renders empty state when no results** — API returns `{ results: [] }`, verify "No results" text
5. **navigates on result click** — click a result item, verify `router.push` is called with the result URL
6. **keyboard ArrowDown/ArrowUp navigates results** — verify `aria-activedescendant` updates
7. **keyboard Enter navigates to active result** — press Enter on an active result, verify `router.push`
8. **keyboard Escape closes dropdown** — press Escape, verify dropdown closes
9. **announces result count to screen reader** — verify `announce` is called with the count message
10. **has combobox ARIA attributes** — verify `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete`

Use `vi.useFakeTimers()` / `vi.advanceTimersByTime(300)` for debounce tests.

### 2c. NotificationBell.test.tsx

**File:** `apps/web/src/components/NotificationBell.test.tsx`

Mock `@/lib/api`, `next/navigation`, `next/link`, `@/components/LiveRegion`.

**Tests:**

1. **renders bell button with unread count badge** — `apiFetch` returns `{ count: 3 }`, verify badge shows "3"
2. **hides badge when unread count is 0** — verify no badge element
3. **toggles notification panel on click** — click bell, verify panel opens; click again, verify it closes
4. **fetches and renders notifications when panel opens** — verify list of notification titles
5. **renders empty state when no notifications** — API returns `[]`, verify "No notifications yet." text
6. **marks individual notification as read** — click a notification, verify PATCH call to `/api/v1/notifications/:id/read`
7. **marks all notifications as read** — click "Mark all read", verify POST to `/api/v1/notifications/mark_all_read`
8. **closes panel on Escape key and returns focus to bell** — press Escape, verify panel closes, verify `document.activeElement` is the bell button
9. **polls unread count at intervals** — use fake timers, advance by 30s, verify second `apiFetch` call to unread_count
10. **has correct ARIA attributes** — verify `aria-haspopup`, `aria-expanded`, `aria-controls`, `aria-label` with count

### 2d. SchoolSelector.test.tsx

**File:** `apps/web/src/components/SchoolSelector.test.tsx`

Mock `@/lib/api`.

**Tests:**

1. **renders loading state initially** — verify "Loading school..." text
2. **renders single school name without dropdown** — API returns 1 school, verify plain text, no `<select>`
3. **renders dropdown for multiple schools** — API returns 2+ schools, verify `<select>` element with `<option>` elements
4. **selects school from localStorage if valid** — set `k12.selectedSchoolId` in localStorage, verify it is pre-selected
5. **defaults to first school when localStorage value is invalid** — set invalid ID, verify first school is selected
6. **persists selection to localStorage on change** — change select value, verify localStorage updated
7. **renders "No school" when API returns empty array** — verify "No school" text
8. **handles API error gracefully** — mock `apiFetch` to throw, verify "No school" text

### 2e. AiAssistantPanel.test.tsx

**File:** `apps/web/src/components/AiAssistantPanel.test.tsx`

Mock `@/lib/api`, `@/lib/api-stream`.

**Tests:**

1. **renders task type dropdown with all options** — verify all 5 task types in `<select>`
2. **loads AI task policies on mount** — verify `apiFetch` called with `/api/v1/ai_task_policies`
3. **disables task types that are disabled by policy** — policy returns `enabled: false` for a type, verify option is disabled
4. **shows policy hint on 403 error** — mock 403, verify policy restriction message
5. **generates via stream on Generate click** — click Generate with prompt, verify `apiFetchStream` called
6. **displays streamed tokens incrementally** — simulate onToken callbacks, verify text appears
7. **stop button aborts generation** — click Stop during streaming, verify abort behavior
8. **falls back to non-streaming API on stream failure** — stream errors, verify `apiFetch` POST to `/api/v1/ai_invocations`
9. **disables Generate when prompt is empty** — verify button is disabled
10. **copy to clipboard button** — set response text, mock `navigator.clipboard.writeText`, click Copy, verify called

### 2f. GoogleDrivePicker.test.tsx

**File:** `apps/web/src/components/GoogleDrivePicker.test.tsx`

Mock `@/lib/api`. Mock `window.google` and `window.gapi` on `globalThis`.

**Tests:**

1. **renders children as button content** — render `<GoogleDrivePicker onSelect={fn}>Pick a file</GoogleDrivePicker>`, verify button text
2. **shows loading state while picker loads** — click, verify "Loading..." appears
3. **fetches picker token on click** — click, verify `apiFetch` called with `/api/v1/drive/picker_token`
4. **calls onSelect with file data when user picks a file** — simulate picker callback with `action: "picked"`, verify `onSelect` called with file object
5. **handles API error gracefully** — mock `apiFetch` to throw, verify loading state clears, no crash

### 2g. FocusTrap.test.tsx

**File:** `apps/web/src/components/FocusTrap.test.tsx`

No API mocks needed.

**Tests:**

1. **focuses first focusable element when active** — render with `active={true}`, verify first button is focused
2. **does not focus when inactive** — render with `active={false}`, verify no focus change
3. **wraps Tab focus from last to first** — press Tab on last element, verify focus moves to first
4. **wraps Shift+Tab focus from first to last** — press Shift+Tab on first element, verify focus moves to last
5. **calls onEscape when Escape is pressed** — provide `onEscape` callback, press Escape, verify called
6. **does not trap when deactivated** — set `active={false}`, verify Tab moves normally

### 2h. LiveRegion.test.tsx

**File:** `apps/web/src/components/LiveRegion.test.tsx`

No API mocks needed.

**Tests:**

1. **renders with aria-live="polite" and aria-atomic="true"** — verify attributes on the container
2. **displays message when sr-announce event is dispatched** — dispatch event, verify text appears
3. **clears message after timeout** — dispatch event, advance timers by 1000ms, verify text is cleared
4. **replaces previous message on rapid dispatch** — dispatch twice quickly, verify only second message shows
5. **announce() helper dispatches the event** — call `announce("hello")`, verify LiveRegion shows "hello"

### 2i. ProtectedRoute.test.tsx (extend existing)

**File:** `apps/web/src/components/ProtectedRoute.test.tsx` (already exists)

Add the following tests to the existing file:

5. **redirects to /setup when onboarding is incomplete** — user with `onboarding_complete: false`, pathname is `/dashboard`, verify redirect to `/setup`
6. **does not redirect to /setup for exempt paths** — user with `onboarding_complete: false`, pathname is `/setup`, verify children render (no redirect)
7. **redirects from /setup to /dashboard when onboarding is already complete** — user with `onboarding_complete: true`, pathname is `/setup`, verify redirect to `/dashboard`
8. **accepts custom unauthorizedRedirect path** — set `unauthorizedRedirect="/forbidden"`, verify redirect goes there

---

## Task 3: Critical Flow Page Tests (15 pages)

Place page test files adjacent to the page: `src/app/<path>/page.test.tsx`.

For **dashboard**, the test file already exists at `src/app/dashboard/page.test.tsx` — extend it.

Every page test file MUST mock at the top level:
- `next/navigation` (useRouter, usePathname, useSearchParams)
- `next/link`
- `@/lib/auth-context`
- `@/lib/api`
- `@/components/AppShell` (passthrough wrapper)
- `@/components/ProtectedRoute` (passthrough wrapper)
- Any other imported components that have their own API calls

Use helpers from `src/test/utils.tsx` and `src/test/factories.ts` for mock data and setup.

### 3a. Login Page

**File:** `apps/web/src/app/login/page.test.tsx`

**Tests:**

1. **renders Google sign-in link** — verify "Sign in with Google" link is present
2. **renders SSO button** — verify "Sign in with SSO" button is present
3. **shows school code input when SSO is clicked** — click SSO button, verify input appears
4. **shows error when SSO submitted without school code** — click Continue with SSO with empty input, verify error text
5. **redirects authenticated user to /dashboard** — mock `useAuth` with a user, verify `router.push("/dashboard")`
6. **shows auth error from URL params** — set `?error=failed`, verify error message renders
7. **renders loading state while auth is resolving** — mock `loading: true`, verify "Loading..." text

### 3b. Dashboard Page (extend existing)

**File:** `apps/web/src/app/dashboard/page.test.tsx` (already exists)

Add:

2. **renders loading skeleton initially** — verify loading state before API resolves
3. **renders empty state when no units or courses** — API returns empty arrays
4. **handles API error gracefully** — `apiFetch` throws, verify no crash, loading clears

### 3c. Plan Units List Page

**File:** `apps/web/src/app/plan/units/page.test.tsx`

**Tests:**

1. **renders list of unit plans** — mock 3 units, verify all titles appear
2. **renders empty state when no units** — verify empty state message
3. **search filters displayed units** — type in search, verify filtered results (client-side or verify API call with query)
4. **shows create button linking to /plan/units/new** — verify link href
5. **displays status badges for each unit** — verify badge text matches unit status

### 3d. Plan Unit Editor Page

**File:** `apps/web/src/app/plan/units/[id]/page.test.tsx`

Mock `useParams` returning `{ id: "1" }`:
```typescript
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({ id: "1" })),
}));
```

**Tests:**

1. **renders unit plan details** — verify title, grade band, subject display
2. **renders associated standards** — mock standards data, verify code/description displayed
3. **renders lesson plans list** — mock lessons, verify lesson titles
4. **shows AI assistant panel** — verify "AI Assistant" heading is present (mock AiAssistantPanel if needed)
5. **handles loading state** — verify loading indicator before API resolves

### 3e. Teach Course Home Page

**File:** `apps/web/src/app/teach/courses/[courseId]/page.test.tsx`

Mock `useParams` returning `{ courseId: "1" }`.

**Tests:**

1. **renders course name and code** — verify course heading
2. **renders module list** — mock modules, verify module titles
3. **renders upcoming assignments section** — mock assignments, verify due dates
4. **shows empty state when no modules** — verify empty state message

### 3f. Assignment Management Page

**File:** `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.test.tsx`

Mock `useParams` returning `{ courseId: "1", assignmentId: "1" }`.

**Tests:**

1. **renders assignment details** — verify title, description, due date, points
2. **renders submissions list** — mock submissions, verify student names
3. **shows submission status badges** — verify correct statuses displayed
4. **handles missing assignment (404)** — mock API error, verify error state

### 3g. Gradebook Page

**File:** `apps/web/src/app/teach/courses/[courseId]/gradebook/page.test.tsx`

Mock `useParams` returning `{ courseId: "1" }`.

**Tests:**

1. **renders student grade rows** — mock grade data, verify student names and scores
2. **renders assignment column headers** — verify assignment titles as headers
3. **handles empty gradebook** — no students, verify empty state
4. **handles loading state** — verify loading indicator

### 3h. Student Course View Page

**File:** `apps/web/src/app/learn/courses/[courseId]/page.test.tsx`

Mock `useParams` returning `{ courseId: "1" }`.

**Tests:**

1. **renders course name for student** — verify course heading
2. **renders module list with progress** — mock modules with completion data
3. **renders upcoming assignments** — verify assignment titles and due dates
4. **shows empty state when no modules** — verify empty state

### 3i. Quiz Attempt Page

**File:** `apps/web/src/app/assess/quizzes/[quizId]/take/page.test.tsx`

Mock `useParams` returning `{ quizId: "1" }`.

**Tests:**

1. **renders quiz title and instructions** — verify quiz name
2. **renders questions** — mock questions, verify prompts displayed
3. **renders timer when time limit is set** — verify timer UI present
4. **allows answer selection** — click an option, verify it is selected (aria-checked or visual change)
5. **submits quiz on finish** — click submit button, verify POST API call

### 3j. Quiz Management Page

**File:** `apps/web/src/app/assess/quizzes/[quizId]/page.test.tsx`

Mock `useParams` returning `{ quizId: "1" }`.

**Tests:**

1. **renders quiz details** — verify title, description, time limit
2. **renders question count** — verify question count displayed
3. **renders attempt results section** — mock attempt results
4. **handles quiz not found** — mock 404, verify error state

### 3k. Communicate Page

**File:** `apps/web/src/app/communicate/page.test.tsx`

**Tests:**

1. **renders Announcements tab by default** — verify announcements tab is selected
2. **switches to Messages tab** — click Messages tab, verify messages content renders
3. **renders announcement list** — mock announcements, verify titles
4. **renders thread list in Messages tab** — mock threads, verify subjects
5. **shows empty state for no announcements** — verify empty state message

### 3l. Admin Users Page

**File:** `apps/web/src/app/admin/users/page.test.tsx`

**Tests:**

1. **renders user table** — mock users, verify email and role columns
2. **shows create user button** — verify button or link is present
3. **renders role badges** — verify roles displayed for each user
4. **handles empty user list** — verify empty state
5. **handles API error** — mock error, verify error message

### 3m. Admin SAML Page

**File:** `apps/web/src/app/admin/integrations/saml/page.test.tsx`

**Tests:**

1. **renders SAML configuration form** — verify form fields (entity ID, SSO URL, certificate)
2. **loads existing SAML config** — mock config data, verify fields are populated
3. **submits SAML configuration** — fill form, submit, verify PUT/POST API call
4. **shows validation errors** — submit with empty required fields, verify error messages

### 3n. Admin Standards Page

**File:** `apps/web/src/app/admin/standards/page.test.tsx`

**Tests:**

1. **renders standards list** — mock standards, verify codes and descriptions
2. **shows import CSV button** — verify button is present
3. **renders framework filter** — verify filter dropdown or tabs
4. **handles empty standards list** — verify empty state

### 3o. Report Page

**File:** `apps/web/src/app/report/page.test.tsx`

**Tests:**

1. **renders report dashboard heading** — verify page title
2. **renders data summary cards** — mock report data, verify card values
3. **handles loading state** — verify loading indicator
4. **handles API error** — mock error, verify error message

---

## Task 4: API Layer Tests

### 4a. api.ts (extend existing)

**File:** `apps/web/src/lib/api.test.ts` (already exists)

Add the following tests to the existing file (do NOT duplicate existing tests):

4. **returns undefined for 204 No Content responses** — verify return value is `undefined`
5. **sets X-School-Id header from localStorage** — set `k12.selectedSchoolId`, verify header is sent
6. **does not set Content-Type for FormData bodies** — pass `FormData` body, verify no Content-Type header
7. **includes credentials: "include" on every request** — verify all calls include credentials
8. **buildUrl handles double /api/v1 prefix** — test with base URL ending in `/api/v1` and path starting with `/api/v1`
9. **getAuthUrl returns correct URL** — verify return value
10. **getSamlAuthUrl includes tenant parameter** — verify query string
11. **getSignOutUrl returns session URL** — verify return value
12. **fetchCurrentUser maps API response to CurrentUser shape** — mock fetch, verify all fields mapped

### 4b. api-stream.ts

**File:** `apps/web/src/lib/api-stream.test.ts`

**Tests:**

1. **calls onToken for each streamed token** — simulate SSE `data: {"token":"hello"}` chunks, verify `onToken` callback
2. **calls onDone when stream completes with done event** — simulate `data: {"done":true,"content":"full text"}`, verify `onDone`
3. **calls onDone with accumulated text on reader completion** — stream ends without explicit done, verify `onDone` with concatenated tokens
4. **calls onError for stream error events** — simulate `data: {"error":"rate limit"}`, verify `onError`
5. **calls onError for HTTP error responses** — mock 500 response, verify `onError` and thrown error
6. **handles abort signal** — pass `AbortSignal.abort()`, verify `isAbortError` returns true
7. **ignores non-data SSE lines** — include `: comment` and empty lines, verify only data lines parsed
8. **ignores [DONE] sentinel** — include `data: [DONE]`, verify no parse attempt

### 4c. api-poll.ts

**File:** `apps/web/src/lib/api-poll.test.ts`

**Tests:**

1. **calls onComplete when status is "completed"** — mock first poll returns completed, verify callback
2. **polls until completion** — first call returns `{ status: "processing" }`, second returns `{ status: "completed" }`, verify two API calls
3. **calls onError when status is "failed"** — mock failed response with error_message, verify callback
4. **calls onError on timeout** — set `maxAttempts: 2`, mock all responses as processing, verify "Generation timed out"
5. **respects custom interval** — pass `intervalMs: 500`, verify setTimeout called with 500
6. **uses dynamic import for apiFetch** — verify the function works correctly with the lazy import pattern

### 4d. auth-context.tsx (extend existing)

**File:** `apps/web/src/lib/auth-context.test.tsx` (already exists)

Add:

4. **refresh reloads the user** — call `refresh()`, verify `fetchCurrentUser` called again and user updates
5. **handles non-Error rejection in refresh** — mock `fetchCurrentUser` rejecting with a string, verify error message is "Unable to fetch current user"

---

## Task 5: Accessibility Tests

### 5a. Extend a11y.test.tsx

**File:** `apps/web/src/app/__tests__/a11y.test.tsx` (already exists)

Add axe tests for additional components. The file already tests `AppShell` and `GlobalSearch`. Add:

3. **NotificationBell has no violations** — render NotificationBell with mocked API, run axe
4. **SchoolSelector has no violations** — render with 2 schools
5. **FocusTrap has no violations** — render with focusable children
6. **LiveRegion has no violations** — render LiveRegion
7. **AiAssistantPanel has no violations** — render with mocked policies
8. **Login page has no violations** — render login page with mocks

### 5b. Keyboard Navigation Tests

**Create:** `apps/web/src/app/__tests__/keyboard-nav.test.tsx`

**Tests:**

1. **Tab navigation through AppShell landmarks** — render AppShell, verify tab order visits skip link, nav items, main content
2. **GlobalSearch keyboard flow** — Tab to search, type query, ArrowDown through results, Enter to select, Escape to close
3. **NotificationBell keyboard flow** — Tab to bell, Enter to open, Tab through items, Escape to close, focus returns to bell
4. **FocusTrap captures Tab cycle** — activate trap, verify Tab and Shift+Tab cycle within container

### 5c. ARIA Attribute Tests

**Create:** `apps/web/src/app/__tests__/aria.test.tsx`

**Tests:**

1. **AppShell landmarks** — verify `<nav aria-label="Main navigation">`, `<main role="main">`, `<header role="banner">`, `<aside aria-label="Sidebar">`
2. **GlobalSearch combobox pattern** — verify `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`, `role="option"`
3. **NotificationBell menu pattern** — verify `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`, `role="menu"`, `role="menuitem"`
4. **Active nav item has aria-current="page"** — verify attribute on active link
5. **Skip navigation link** — verify `<a href="#main-content">Skip to main content</a>` exists

---

## Task 6: Verify

### 6a. Run Tests and Coverage

```bash
cd apps/web && npm run test:coverage
```

- All tests must pass (zero failures)
- Coverage must be above 40% (the existing threshold in vitest.config.ts is `lines: 10`; do NOT lower it)

### 6b. Update Coverage Config

**Modify:** `apps/web/vitest.config.ts`

Update the coverage config to include pages and previously excluded components now that tests exist:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "lcov"],
  include: ["src/**"],
  exclude: [
    // Remove AppShell, AiAssistantPanel, GoogleDrivePicker from excludes
    // Keep only files that truly cannot be tested
  ],
  thresholds: {
    lines: 40,
  },
},
```

### 6c. Build Check

```bash
cd apps/web && npm run build
```

Verify zero TypeScript errors.

---

## Architecture Rules

1. **Do NOT modify application source code** — only add test files and modify `vitest.config.ts`
2. **Mock all API calls** — never make real HTTP requests; always mock `apiFetch`, `fetch`, or `apiFetchStream`
3. **Mock `next/navigation`** — every test using `useRouter`, `usePathname`, `useSearchParams`, or `useParams` must mock them
4. **Use `act()` for state updates** — wrap interactions that trigger state updates in `act()` or use RTL utilities that handle it (e.g., `fireEvent`, `userEvent`)
5. **Use fake timers for debounce/interval/timeout** — call `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`
6. **Follow existing test patterns exactly** — match the mock style, assertion style, and structure of the existing 6 test files
7. **Use `@/` path alias** — all imports must use the `@/` alias, not relative paths
8. **Respect `"use client"` awareness** — components are client components; render them directly with RTL's `render()`
9. **Clean up after each test** — `cleanup()` is already called in `src/test/setup.ts` via `afterEach`; call `vi.clearAllMocks()` in `afterEach` within each test file
10. **Use factory functions from `src/test/factories.ts`** — do not inline large mock data objects; call factory functions for consistency
11. **Use helpers from `src/test/utils.tsx`** — use `createMockUser()`, `mockAuth()`, `mockRouter()`, `mockPathname()`, `mockApiFetch()` instead of repeating mock setup
12. **File placement** — component tests go in `src/components/<Name>.test.tsx`; page tests go in `src/app/<path>/page.test.tsx`; lib tests go in `src/lib/<name>.test.ts`

---

## Testing Commands

```bash
# Run all tests
cd apps/web && npm run test

# Run tests in watch mode
cd apps/web && npm run test:watch

# Run tests with coverage report
cd apps/web && npm run test:coverage

# Run a specific test file
cd apps/web && npx vitest run src/components/AppShell.test.tsx

# Run tests matching a pattern
cd apps/web && npx vitest run --reporter=verbose -t "renders nav"

# Type check
cd apps/web && npm run typecheck

# Full build
cd apps/web && npm run build
```

---

## Definition of Done

### Infrastructure
- [ ] `src/test/utils.tsx` created with `createMockUser`, `mockAuth`, `mockRouter`, `mockPathname`, `mockSearchParams`, `mockApiFetch`, `renderWithProviders`
- [ ] `src/test/factories.ts` created with typed factory functions for all domain entities (User, Course, UnitPlan, LessonPlan, Assignment, Quiz, QuizAttempt, Question, Notification, School, Module, Standard, Submission, Message, Announcement, Thread, SearchResult, AiTaskPolicy, SamlConfig)

### Component Tests (10 components, ~80 tests)
- [ ] `AppShell.test.tsx` — 10 tests covering role filtering, active route, mobile toggle, sign out
- [ ] `GlobalSearch.test.tsx` — 10 tests covering debounce, grouping, keyboard nav, ARIA, empty state
- [ ] `NotificationBell.test.tsx` — 10 tests covering count, mark read, polling, keyboard, ARIA
- [ ] `SchoolSelector.test.tsx` — 8 tests covering single/multi school, localStorage, error
- [ ] `AiAssistantPanel.test.tsx` — 10 tests covering task types, policies, streaming, fallback, abort
- [ ] `GoogleDrivePicker.test.tsx` — 5 tests covering trigger, token fetch, selection, error
- [ ] `FocusTrap.test.tsx` — 6 tests covering focus trapping, escape, activation
- [ ] `LiveRegion.test.tsx` — 5 tests covering announcements, auto-clear, aria attributes
- [ ] `ProtectedRoute.test.tsx` — extended to 8 tests total (4 existing + 4 new: onboarding redirect, exempt paths, custom redirect)

### Page Tests (15 pages, ~60 tests)
- [ ] `login/page.test.tsx` — 7 tests
- [ ] `dashboard/page.test.tsx` — extended to 4 tests total
- [ ] `plan/units/page.test.tsx` — 5 tests
- [ ] `plan/units/[id]/page.test.tsx` — 5 tests
- [ ] `teach/courses/[courseId]/page.test.tsx` — 4 tests
- [ ] `teach/courses/[courseId]/assignments/[assignmentId]/page.test.tsx` — 4 tests
- [ ] `teach/courses/[courseId]/gradebook/page.test.tsx` — 4 tests
- [ ] `learn/courses/[courseId]/page.test.tsx` — 4 tests
- [ ] `assess/quizzes/[quizId]/take/page.test.tsx` — 5 tests
- [ ] `assess/quizzes/[quizId]/page.test.tsx` — 4 tests
- [ ] `communicate/page.test.tsx` — 5 tests
- [ ] `admin/users/page.test.tsx` — 5 tests
- [ ] `admin/integrations/saml/page.test.tsx` — 4 tests
- [ ] `admin/standards/page.test.tsx` — 4 tests
- [ ] `report/page.test.tsx` — 4 tests

### API Layer Tests (~25 tests)
- [ ] `api.test.ts` — extended to 12 tests total (3 existing + 9 new)
- [ ] `api-stream.test.ts` — 8 tests
- [ ] `api-poll.test.ts` — 6 tests
- [ ] `auth-context.test.tsx` — extended to 5 tests total (3 existing + 2 new)

### Accessibility Tests (~15 tests)
- [ ] `a11y.test.tsx` — extended to 8 tests total (2 existing + 6 new)
- [ ] `keyboard-nav.test.tsx` — 4 tests
- [ ] `aria.test.tsx` — 5 tests

### Verification
- [ ] `npm run test:coverage` passes with 0 failures and >40% line coverage
- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] `vitest.config.ts` updated: coverage includes pages/components, threshold set to 40%
- [ ] No application source code was modified (only test files and vitest.config.ts)
- [ ] All test files use `@/` path alias
- [ ] All test files follow the existing mock patterns from the codebase
