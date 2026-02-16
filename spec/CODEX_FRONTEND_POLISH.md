# Codex Instructions — Frontend UI Polish

## Objective

Add UI polish across the Next.js frontend to replace placeholder patterns with production-quality components. The current app has 79 pages using `"use client"`, `ProtectedRoute`, and `AppShell`. Most pages show plain `"Loading..."` text, bare `"No X found"` messages, inline success/error banners, and no pagination. This task introduces six reusable components — Skeleton, ErrorBoundary, Pagination, EmptyState, Toast, and ResponsiveTable — and integrates them across every relevant page.

---

## What Already Exists

### Frontend Stack
- Next.js 16.1.6, React 19.2.4, TypeScript 5 — app at `apps/web/`
- Tailwind CSS 4 (via `@tailwindcss/postcss`) — no custom CSS files beyond `globals.css`
- 79 page files across `/plan/`, `/teach/`, `/learn/`, `/assess/`, `/admin/`, `/communicate/`, `/report/`, `/notifications/`, `/dashboard/`
- 10 components in `apps/web/src/components/`: AppShell, GlobalSearch, NotificationBell, SchoolSelector, ProtectedRoute, FocusTrap, LiveRegion, AiAssistantPanel, GoogleDrivePicker
- API helper: `apiFetch<T>(path, options)` in `apps/web/src/lib/api.ts` — all data fetching uses this
- Test stack: Vitest 4 + @testing-library/react + @testing-library/jest-dom + vitest-axe
- Root layout at `apps/web/src/app/layout.tsx` wraps children in `<AuthProvider>`

### Current Patterns (to be replaced)
- **Loading states**: ~80 instances of `<p className="text-sm text-gray-500">Loading...</p>` or similar across all pages
- **Empty states**: ~50 instances of bare `"No X found"` / `"No X yet"` text in `<p>` tags
- **Inline banners**: `{error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}` and `{success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}` used across ~60 pages
- **No pagination**: Backend supports `page`/`per_page` params via `Paginatable` concern (default 50, max 200) but no frontend page sends these params
- **No error boundaries**: No `error.tsx` files exist in any route segment; uncaught errors crash the entire page
- **Tables**: 11 pages use `<table>` elements with no mobile responsiveness

### Backend Pagination (read-only reference)
The Rails backend at `apps/core/` includes a `Paginatable` concern (`app/controllers/concerns/paginatable.rb`):
```ruby
module Paginatable
  DEFAULT_PER_PAGE = 50
  MAX_PER_PAGE = 200

  def paginate(relation)
    return relation unless pagination_requested?
    page = [params.fetch(:page, 1).to_i, 1].max
    per_page = params.fetch(:per_page, DEFAULT_PER_PAGE).to_i
    per_page = DEFAULT_PER_PAGE if per_page <= 0
    per_page = [per_page, MAX_PER_PAGE].min
    relation.offset((page - 1) * per_page).limit(per_page)
  end

  def pagination_requested?
    params[:page].present? || params[:per_page].present?
  end
end
```
Controllers return all records when no `page` param is present. When `page` is passed, they paginate. You must pass `page` and `per_page` as query string parameters on the `apiFetch` URL (e.g., `/api/v1/unit_plans?page=1&per_page=25`). The response is the paginated array — total count is not returned in a header by default, so use the array length plus page number to determine if more pages exist (if returned items equal per_page, assume there may be more).

---

## Task 1: Loading Skeletons

Replace all `"Loading..."` text with animated skeleton placeholders that approximate the shape of the loaded content.

### 1a. Create Skeleton Component

**Create:** `apps/web/src/components/Skeleton.tsx`

```typescript
"use client";

interface SkeletonProps {
  variant?: "line" | "circle" | "rectangle";
  width?: string;   // Tailwind width class, e.g. "w-full", "w-48"
  height?: string;  // Tailwind height class, e.g. "h-4", "h-10"
  className?: string;
}

export function Skeleton({ variant = "line", width, height, className = "" }: SkeletonProps) {
  const base = "animate-pulse bg-gray-200";

  const variantClasses: Record<string, string> = {
    line: `${base} rounded ${width || "w-full"} ${height || "h-4"}`,
    circle: `${base} rounded-full ${width || "w-10"} ${height || "h-10"}`,
    rectangle: `${base} rounded-lg ${width || "w-full"} ${height || "h-24"}`,
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### 1b. Create Page-Specific Skeleton Layouts

**Create:** `apps/web/src/components/skeletons/DashboardSkeleton.tsx`
- Mimic the dashboard layout: 2-column grid with card-shaped rectangles for unit plans and courses sections
- Include skeleton lines for headings and skeleton rectangles for each card

**Create:** `apps/web/src/components/skeletons/ListSkeleton.tsx`
- Generic list skeleton reusable across unit list, course list, quiz list, question bank list
- Props: `count` (number of skeleton rows, default 5), `showHeader` (boolean)
- Each row: a skeleton line for the title + a shorter skeleton line for the subtitle

**Create:** `apps/web/src/components/skeletons/CourseHomeSkeleton.tsx`
- Mimic the course home page: heading skeleton, a row of stat cards (3 rectangles), then a list of module skeletons

**Create:** `apps/web/src/components/skeletons/GradebookSkeleton.tsx`
- Mimic the gradebook table: skeleton header row + 8 skeleton data rows, each with 4 columns of skeleton lines

**Create:** `apps/web/src/components/skeletons/QuizSkeleton.tsx`
- Mimic the quiz editor/detail page: heading, metadata line, then 5 question card rectangles

**Create:** `apps/web/src/components/skeletons/StandardsSkeleton.tsx`
- Mimic the standards page: sidebar skeleton list + main content area with tree-like indented skeleton lines

### 1c. Apply Skeletons to Every Page

Search for every instance of `"Loading"` text in `apps/web/src/app/` and replace with the appropriate skeleton. Specific mappings:

| Page | Skeleton to use |
|------|----------------|
| `dashboard/page.tsx` | `DashboardSkeleton` |
| `plan/units/page.tsx` | `ListSkeleton` |
| `plan/units/[id]/page.tsx` | `QuizSkeleton` (similar layout) |
| `plan/units/[id]/preview/page.tsx` | `CourseHomeSkeleton` (similar layout) |
| `plan/units/[id]/lessons/new/page.tsx` | `ListSkeleton count={3}` |
| `plan/units/[id]/lessons/[lessonId]/page.tsx` | `ListSkeleton count={3}` |
| `plan/templates/page.tsx` | `ListSkeleton` |
| `plan/templates/[id]/page.tsx` | `QuizSkeleton` |
| `plan/templates/[id]/use/page.tsx` | `ListSkeleton count={3}` |
| `plan/standards/page.tsx` | `StandardsSkeleton` |
| `plan/calendar/page.tsx` | `GradebookSkeleton` |
| `teach/courses/page.tsx` | `ListSkeleton` |
| `teach/courses/[courseId]/page.tsx` | `CourseHomeSkeleton` |
| `teach/courses/[courseId]/gradebook/page.tsx` | `GradebookSkeleton` |
| `teach/courses/[courseId]/roster/page.tsx` | `ListSkeleton` |
| `teach/courses/[courseId]/submissions/page.tsx` | `ListSkeleton` |
| `teach/courses/[courseId]/discussions/page.tsx` | `ListSkeleton` |
| `teach/courses/[courseId]/discussions/[discussionId]/page.tsx` | `ListSkeleton count={3}` |
| `teach/courses/[courseId]/modules/[moduleId]/page.tsx` | `ListSkeleton` |
| `teach/courses/[courseId]/quiz-performance/page.tsx` | `GradebookSkeleton` |
| `teach/courses/[courseId]/quizzes/[quizId]/analytics/page.tsx` | `GradebookSkeleton` |
| `teach/courses/[courseId]/assignments/[assignmentId]/page.tsx` | `QuizSkeleton` |
| `teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx` | `ListSkeleton count={3}` |
| `teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx` | `ListSkeleton count={3}` |
| `teach/submissions/page.tsx` | `ListSkeleton` |
| `teach/submissions/[submissionId]/grade/page.tsx` | `ListSkeleton count={3}` |
| `learn/dashboard/page.tsx` | `DashboardSkeleton` |
| `learn/courses/page.tsx` | `ListSkeleton` |
| `learn/courses/[courseId]/page.tsx` | `CourseHomeSkeleton` |
| `learn/courses/[courseId]/assignments/[assignmentId]/page.tsx` | `QuizSkeleton` |
| `learn/courses/[courseId]/discussions/[discussionId]/page.tsx` | `ListSkeleton count={3}` |
| `learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx` | `QuizSkeleton` |
| `learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx` | `ListSkeleton` |
| `learn/grades/page.tsx` | `GradebookSkeleton` |
| `assess/quizzes/page.tsx` | `ListSkeleton` |
| `assess/quizzes/new/page.tsx` | `ListSkeleton count={3}` |
| `assess/quizzes/[quizId]/page.tsx` | `QuizSkeleton` |
| `assess/quizzes/[quizId]/take/page.tsx` | `QuizSkeleton` |
| `assess/quizzes/[quizId]/results/page.tsx` | `GradebookSkeleton` |
| `assess/banks/page.tsx` | `ListSkeleton` |
| `assess/banks/[bankId]/page.tsx` | `QuizSkeleton` |
| `assess/attempts/[attemptId]/page.tsx` | `QuizSkeleton` |
| `assess/attempts/[attemptId]/grade/page.tsx` | `ListSkeleton count={3}` |
| `assess/attempts/[attemptId]/results/page.tsx` | `ListSkeleton` |
| `admin/users/page.tsx` | `ListSkeleton` |
| `admin/dashboard/page.tsx` | `DashboardSkeleton` |
| `admin/school/page.tsx` | `ListSkeleton count={4}` |
| `admin/standards/page.tsx` | `StandardsSkeleton` |
| `admin/integrations/page.tsx` | `ListSkeleton` |
| `admin/integrations/sync/page.tsx` | `ListSkeleton` |
| `admin/integrations/saml/page.tsx` | `ListSkeleton count={3}` |
| `admin/lti/page.tsx` | `ListSkeleton` |
| `admin/retention/page.tsx` | `ListSkeleton count={3}` |
| `admin/approvals/page.tsx` | `ListSkeleton` |
| `admin/ai/page.tsx` | `ListSkeleton count={3}` |
| `admin/ai/templates/page.tsx` | `ListSkeleton` |
| `admin/ai/policies/page.tsx` | `ListSkeleton` |
| `admin/curriculum-map/page.tsx` | `StandardsSkeleton` |
| `communicate/page.tsx` | `ListSkeleton` |
| `communicate/threads/[threadId]/page.tsx` | `ListSkeleton count={3}` |
| `notifications/page.tsx` | `ListSkeleton` |
| `report/page.tsx` | `GradebookSkeleton` |
| `report/standards-coverage/page.tsx` | `StandardsSkeleton` |

For each page:
1. Import the skeleton component
2. Replace the `"Loading..."` text/element with the skeleton component
3. Preserve the existing loading state logic (`if (loading) return ...`)

---

## Task 2: Error Boundary

Add error handling at the route-section level so a crash in one section does not take down the entire app.

### 2a. Create ErrorBoundary Component

**Create:** `apps/web/src/components/ErrorBoundary.tsx`

```typescript
"use client";

import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              An unexpected error occurred. Please try again.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-700">
                {this.state.error.message}
                {"\n"}
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2b. Create Next.js error.tsx Files

Create an `error.tsx` file in each of these route segment directories:

- `apps/web/src/app/plan/error.tsx`
- `apps/web/src/app/teach/error.tsx`
- `apps/web/src/app/learn/error.tsx`
- `apps/web/src/app/assess/error.tsx`
- `apps/web/src/app/admin/error.tsx`
- `apps/web/src/app/communicate/error.tsx`
- `apps/web/src/app/report/error.tsx`
- `apps/web/src/app/notifications/error.tsx`
- `apps/web/src/app/dashboard/error.tsx`

Each `error.tsx` must follow the Next.js App Router convention:

```typescript
"use client";

import { useEffect } from "react";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Section error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          An unexpected error occurred in this section. Your other sections are unaffected.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-700">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Try again"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

### 2c. Wrap Section Layouts

**Modify** each section layout file to wrap `{children}` in the `ErrorBoundary` component:

- `apps/web/src/app/plan/layout.tsx`
- `apps/web/src/app/teach/layout.tsx`
- `apps/web/src/app/learn/layout.tsx`
- `apps/web/src/app/assess/layout.tsx`
- `apps/web/src/app/admin/layout.tsx`

Import `ErrorBoundary` from `@/components/ErrorBoundary` and wrap the children:
```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

// In the layout's return:
<ErrorBoundary>{children}</ErrorBoundary>
```

For sections without a layout file (`communicate/`, `report/`, `notifications/`, `dashboard/`), the `error.tsx` alone is sufficient — Next.js will handle it at the route segment level.

---

## Task 3: Pagination UI

Add client-side pagination to every list page that fetches collections from the API.

### 3a. Create Pagination Component

**Create:** `apps/web/src/components/Pagination.tsx`

```typescript
"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  perPage,
  perPageOptions = [10, 25, 50],
  onPerPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page numbers: always show first, last, current, and neighbors
  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 pt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          Previous
        </button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-400" aria-hidden="true">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      {perPage && onPerPageChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="per-page-select" className="text-sm text-gray-600">
            Per page:
          </label>
          <select
            id="per-page-select"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
```

### 3b. Add Pagination to List Pages

For each page listed below, make these changes:

1. Add state: `const [page, setPage] = useState(1);` and `const [perPage, setPerPage] = useState(25);` and `const [totalPages, setTotalPages] = useState(1);`
2. Modify the `apiFetch` call to include `?page=${page}&per_page=${perPage}` in the URL
3. After receiving results, calculate totalPages: `setTotalPages(results.length < perPage ? page : page + 1);` (heuristic since backend does not return total count)
4. Add `page` and `perPage` to the `useEffect` dependency array so changing page re-fetches
5. When `perPage` changes, reset `page` to 1
6. Render `<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} perPage={perPage} onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }} />` below the list

**Target pages:**

| Page file | API endpoint |
|-----------|-------------|
| `apps/web/src/app/plan/units/page.tsx` | `/api/v1/unit_plans` |
| `apps/web/src/app/teach/courses/page.tsx` | `/api/v1/courses` |
| `apps/web/src/app/assess/quizzes/page.tsx` | `/api/v1/quizzes` |
| `apps/web/src/app/assess/banks/page.tsx` | `/api/v1/question_banks` |
| `apps/web/src/app/admin/users/page.tsx` | `/api/v1/users` |
| `apps/web/src/app/communicate/page.tsx` | `/api/v1/message_threads` (threads tab) |
| `apps/web/src/app/notifications/page.tsx` | `/api/v1/notifications` |
| `apps/web/src/app/admin/integrations/sync/page.tsx` | `/api/v1/sync_runs` |
| `apps/web/src/app/teach/submissions/page.tsx` | `/api/v1/submissions` |
| `apps/web/src/app/admin/lti/page.tsx` | `/api/v1/lti_registrations` |
| `apps/web/src/app/plan/templates/page.tsx` | `/api/v1/unit_plan_templates` |
| `apps/web/src/app/learn/courses/page.tsx` | `/api/v1/courses` |

---

## Task 4: Empty States

Replace bare "No X found" text with illustrated, actionable empty state components.

### 4a. Create EmptyState Component

**Create:** `apps/web/src/components/EmptyState.tsx`

```typescript
"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ icon, title, description, actionLabel, onAction, actionHref }: EmptyStateProps) {
  const defaultIcon = (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008V15zm-3 0h.008v.008H9.75V15zm0-3h.008v.008H9.75V12zm3 0h.008v.008h-.008V12zM6.75 19.5h10.5A2.25 2.25 0 0019.5 17.25V6.75A2.25 2.25 0 0017.25 4.5H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5z"
      />
    </svg>
  );

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center">
      {icon || defaultIcon}
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {actionLabel && (onAction || actionHref) && (
        actionHref ? (
          <a
            href={actionHref}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {actionLabel}
          </a>
        ) : (
          <button
            onClick={onAction}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
```

### 4b. Apply Empty States to All List Pages

Replace every `"No X found"` / `"No X yet"` text with the `EmptyState` component. Use contextual messaging:

| Page | title | description | actionLabel / actionHref |
|------|-------|-------------|------------------------|
| `plan/units/page.tsx` | "No unit plans yet" | "Create your first unit plan to start building curriculum." | "Create Unit Plan" / `/plan/units/new` |
| `plan/templates/page.tsx` | "No templates available" | "Create a reusable template to speed up unit planning." | "Create Template" / `/plan/templates/new` |
| `plan/units/[id]/page.tsx` (lessons) | "No lessons yet" | "Add lessons to build out this unit plan." | "Add Lesson" (onAction if button exists) |
| `plan/standards/page.tsx` | "No standard frameworks available" | "Import or configure standard frameworks in admin settings." | (none) |
| `teach/courses/page.tsx` | "No courses found" | "Courses will appear here once they are created or assigned to you." | (none) |
| `teach/courses/[courseId]/page.tsx` (modules) | "No modules yet" | "Create modules to organize your course content." | (none) |
| `teach/courses/[courseId]/gradebook/page.tsx` | "No gradebook records yet" | "Grades will appear here as students submit assignments." | (none) |
| `teach/courses/[courseId]/discussions/page.tsx` | "No discussions yet" | "Start a discussion to engage with your students." | "New Discussion" (onAction) |
| `teach/courses/[courseId]/roster/page.tsx` | "No students enrolled" | "Students will appear here once they are enrolled in this course." | (none) |
| `assess/quizzes/page.tsx` | "No quizzes found" | "Create a quiz to assess student understanding." | "Create Quiz" / `/assess/quizzes/new` |
| `assess/quizzes/[quizId]/page.tsx` (questions) | "No questions added yet" | "Add questions to build out this quiz." | (none) |
| `assess/quizzes/[quizId]/results/page.tsx` | "No attempts found" | "Results will appear here once students take this quiz." | (none) |
| `assess/banks/page.tsx` | "No question banks yet" | "Create a question bank to organize reusable questions." | "Create Bank" / `/assess/banks/new` |
| `assess/banks/[bankId]/page.tsx` | "No questions yet" | "Add questions to this bank." | (none) |
| `admin/users/page.tsx` | "No users found" | "Users matching the current filter will appear here." | (none) |
| `admin/dashboard/page.tsx` (sync history) | "No sync history yet" | "Sync history will appear after your first data sync." | (none) |
| `admin/dashboard/page.tsx` (audit logs) | "No audit entries found" | "Audit log entries will appear as actions are performed." | (none) |
| `admin/lti/page.tsx` | "No registrations yet" | "Add an LTI registration to connect external tools." | (none) |
| `admin/standards/page.tsx` | "No standard frameworks found" | "Import or add standard frameworks to get started." | (none) |
| `admin/integrations/sync/page.tsx` | "No sync runs found" | "Sync runs will appear after you configure and trigger a sync." | (none) |
| `communicate/page.tsx` (announcements) | "No announcements yet" | "Create an announcement to share with your audience." | (none) |
| `communicate/page.tsx` (threads) | "No message threads yet" | "Start a conversation by composing a new message." | "Compose Message" / `/communicate/compose` |
| `communicate/threads/[threadId]/page.tsx` | "No messages yet" | "Send the first message to start the conversation." | (none) |
| `notifications/page.tsx` | "No notifications" | "You're all caught up! Notifications will appear here." | (none) |
| `dashboard/page.tsx` (units) | "No unit plans yet" | "Create your first unit plan to get started." | "Create Unit Plan" / `/plan/units/new` |
| `dashboard/page.tsx` (courses) | "No courses found" | "Courses will appear here once they are assigned." | (none) |
| `learn/dashboard/page.tsx` (grades) | "No graded work yet" | "Your grades will appear here as assignments are graded." | (none) |
| `learn/grades/page.tsx` | "No grade data available" | "Grade data will appear once your work has been graded." | (none) |
| `learn/courses/[courseId]/page.tsx` | "No published modules yet" | "Course modules will appear here once they are published." | (none) |
| `learn/courses/[courseId]/discussions/[discussionId]/page.tsx` | "No posts yet" | "Be the first to contribute to this discussion." | (none) |
| `report/page.tsx` (quizzes) | "No completed quizzes yet" | "Quiz reports will populate once students complete quizzes." | (none) |
| `report/page.tsx` (submissions) | "No submissions yet" | "Submission data will appear once students submit work." | (none) |
| `report/standards-coverage/page.tsx` | "No coverage data available" | "Standards coverage data will appear as curriculum is mapped." | (none) |

---

## Task 5: Toast Notifications

Replace inline success/error banners with a centralized toast notification system.

### 5a. Create Toast System

**Create:** `apps/web/src/components/Toast.tsx`

```typescript
"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [remaining, setRemaining] = useState(toast.duration);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 100) {
          onDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [toast.duration, onDismiss]);

  const colors: Record<ToastType, { bg: string; border: string; text: string; progress: string }> = {
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", progress: "bg-green-500" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", progress: "bg-red-500" },
    warning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", progress: "bg-yellow-500" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", progress: "bg-blue-500" },
  };

  const c = colors[toast.type];
  const progressPercent = (remaining / toast.duration) * 100;

  return (
    <div
      className={`${c.bg} ${c.border} pointer-events-auto w-80 overflow-hidden rounded-lg border shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-3">
        <p className={`${c.text} flex-1 text-sm`}>{toast.message}</p>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-1 w-full bg-gray-200">
        <div
          className={`${c.progress} h-full transition-all duration-100 ease-linear`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

### 5b. Add ToastProvider to Root Layout

**Modify:** `apps/web/src/app/layout.tsx`

Wrap the existing `<AuthProvider>` children with `<ToastProvider>`:

```tsx
import { ToastProvider } from "@/components/Toast";

// In the return:
<AuthProvider>
  <ToastProvider>{children}</ToastProvider>
</AuthProvider>
```

### 5c. Migrate Inline Banners to Toasts

For every page that uses the pattern:
```tsx
const [success, setSuccess] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
// ...
{error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
{success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}
```

Replace with:
1. Import `useToast` from `@/components/Toast`
2. Call `const { addToast } = useToast();` at the top of the component
3. Replace `setSuccess("message")` with `addToast("success", "message")`
4. Replace `setError("message")` with `addToast("error", "message")` — but ONLY for transient action results (create, update, delete). Keep inline error display for page-level load errors (e.g., `if (error) return <div>...error...</div>`)
5. Remove the `success` state variable and its inline banner JSX
6. Remove the `error` state variable and its inline banner JSX ONLY when that error is exclusively used for action feedback. If `error` is also used for page-load failures, keep the state but remove the inline banner for action errors and route those through `addToast` instead.

**Priority pages to migrate** (pages with both success and error inline banners):
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/admin/school/page.tsx`
- `apps/web/src/app/admin/lti/page.tsx`
- `apps/web/src/app/admin/retention/page.tsx`
- `apps/web/src/app/admin/ai/page.tsx`
- `apps/web/src/app/admin/integrations/saml/page.tsx`
- `apps/web/src/app/communicate/page.tsx` (announcement create)
- `apps/web/src/app/communicate/compose/page.tsx`
- `apps/web/src/app/plan/units/[id]/page.tsx`
- `apps/web/src/app/plan/templates/[id]/page.tsx`
- `apps/web/src/app/assess/quizzes/[quizId]/page.tsx`
- `apps/web/src/app/assess/banks/[bankId]/page.tsx`
- `apps/web/src/app/teach/courses/[courseId]/page.tsx`
- `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx`
- `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx`
- `apps/web/src/app/setup/page.tsx`

Also migrate pages that only have error inline banners (where the error is from an action, not a page load):
- All remaining pages from the ~60 that use `{error && <div className="rounded-md bg-red-50...`

**Guideline**: If a page calls `setError(...)` in a `catch` block during a user-triggered action (button click, form submit), migrate it to `addToast("error", ...)`. If `setError(...)` is called during initial data loading in `useEffect`, keep it as inline display (the page cannot render without data, so a toast would be confusing).

---

## Task 6: Responsive Tables

Make table-based pages work well on mobile viewports.

### 6a. Create ResponsiveTable Component

**Create:** `apps/web/src/components/ResponsiveTable.tsx`

```typescript
"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  primary?: boolean;  // Shown as the card title on mobile
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  caption?: string;
  onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const primaryCol = columns.find((c) => c.primary) || columns[0];

  return (
    <>
      {/* Desktop: standard table */}
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold text-gray-700" scope="col">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`border-b last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                role={onRowClick ? "button" : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card layout */}
      <div className="space-y-3 md:hidden" role="list">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className={`rounded-lg border border-gray-200 bg-white p-4 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }
                : undefined
            }
            role={onRowClick ? "button" : "listitem"}
          >
            <div className="font-medium text-gray-900">{primaryCol.render(row)}</div>
            <dl className="mt-2 space-y-1">
              {columns
                .filter((col) => col !== primaryCol)
                .map((col) => (
                  <div key={col.key} className="flex justify-between text-sm">
                    <dt className="font-medium text-gray-500">{col.header}</dt>
                    <dd className="text-gray-700">{col.render(row)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
```

### 6b. Apply ResponsiveTable to Table Pages

Refactor each page that currently uses raw `<table>` elements to use `ResponsiveTable`:

| Page | Columns |
|------|---------|
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx` | Student (primary), Assignment, Status, Grade |
| `apps/web/src/app/teach/courses/[courseId]/roster/page.tsx` | Student Name (primary), Email, Role, Status |
| `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx` | Student (primary), Assignment, Submitted At, Status, Grade |
| `apps/web/src/app/teach/submissions/page.tsx` | Student (primary), Assignment, Course, Status |
| `apps/web/src/app/assess/quizzes/page.tsx` | Title (primary), Course, Questions, Status |
| `apps/web/src/app/assess/quizzes/[quizId]/results/page.tsx` | Student (primary), Score, Started At, Completed At |
| `apps/web/src/app/teach/courses/[courseId]/quiz-performance/page.tsx` | Quiz (primary), Student, Score, Date |
| `apps/web/src/app/teach/courses/[courseId]/quizzes/[quizId]/analytics/page.tsx` | Question (primary), Correct %, Avg Score |
| `apps/web/src/app/admin/integrations/sync/page.tsx` | Provider (primary), Status, Started At, Records |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx` | Student (primary), Submitted At, Status |
| `apps/web/src/app/admin/curriculum-map/page.tsx` | Standard (primary), Coverage, Courses |

For each page:
1. Import `ResponsiveTable` from `@/components/ResponsiveTable`
2. Define the columns array with `key`, `header`, `render`, and `primary` fields
3. Replace the `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<td>` markup with `<ResponsiveTable columns={columns} data={data} keyExtractor={...} />`
4. Preserve any existing click handlers by passing `onRowClick`
5. Preserve any existing conditional styling (status badges, etc.) within the `render` functions

---

## Task 7: Verify

After completing Tasks 1-6, run the following verification steps:

### 7a. Build Check
```bash
cd apps/web && npm run build
```
Must complete with 0 errors. Warnings are acceptable but should be reviewed.

### 7b. Lint Check
```bash
cd apps/web && npm run lint
```
Must complete with 0 errors.

### 7c. Type Check
```bash
cd apps/web && npm run typecheck
```
Must complete with 0 errors.

### 7d. Test Suite
```bash
cd apps/web && npm run test
```
All existing tests must pass. If any tests break due to UI changes (e.g., tests that assert on `"Loading..."` text), update those tests to match the new skeleton/component structure.

### 7e. Manual Verification Checklist

Open the running app and verify:

1. **Skeletons**: Navigate to Dashboard, Unit List, Course Home, Gradebook — confirm animated skeleton placeholders appear during loading instead of "Loading..." text
2. **Error Boundary**: Temporarily throw an error in a page component — confirm the error UI appears with "Something went wrong" and "Try again" button, and that other sections still work
3. **Pagination**: Navigate to Unit Plans list — confirm page numbers appear, Previous/Next buttons work, per-page selector changes results count
4. **Empty States**: Filter a list to show zero results — confirm illustrated empty state with contextual message appears instead of plain text
5. **Toasts**: Create/update/delete an item — confirm a toast notification appears at bottom-right, auto-dismisses after 5 seconds, shows progress bar
6. **Responsive Tables**: Resize browser to mobile width on Gradebook — confirm table converts to card-based layout with labeled fields

---

## Architecture Rules

1. **No custom CSS** — use only Tailwind utility classes. No additions to `globals.css` beyond what already exists.
2. **Semantic HTML** — use `<nav>`, `<main>`, `<section>`, `<article>`, `<table>`, `<dl>`, `<dt>`, `<dd>` where appropriate.
3. **WCAG 2.1 AA** — all new components must include proper ARIA attributes, keyboard support, and sufficient color contrast.
4. **No backend changes** — do NOT modify any files in `apps/core/`. Frontend only.
5. **Small, focused components** — each new component is in its own file, under 200 lines, single responsibility.
6. **Existing patterns** — follow the existing code style: `"use client"` directive, named exports for components, `apiFetch` for data, `ProtectedRoute` + `AppShell` wrappers.
7. **Incremental changes** — each page modification should be a surgical replacement of the specific pattern (loading text, empty text, inline banner, or table). Do not refactor surrounding logic.
8. **Preserve functionality** — no user-facing behavior should change. Loading still shows during fetch, errors still display, lists still render. Only the visual treatment changes.

---

## Testing

```bash
cd apps/web && npm run lint && npm run typecheck && npm run build && npm run test
```

---

## Definition of Done

- [ ] `Skeleton` component created at `src/components/Skeleton.tsx` with line, circle, rectangle variants
- [ ] 6 page-specific skeleton layouts created in `src/components/skeletons/`
- [ ] All ~80 "Loading..." instances across all pages replaced with appropriate skeletons
- [ ] `ErrorBoundary` component created at `src/components/ErrorBoundary.tsx`
- [ ] `error.tsx` files created in all 9 route segment directories (plan, teach, learn, assess, admin, communicate, report, notifications, dashboard)
- [ ] Section layouts wrap children in `ErrorBoundary`
- [ ] Error UI shows "Something went wrong", error details in dev mode, and "Try again" button
- [ ] `Pagination` component created at `src/components/Pagination.tsx` with Previous/Next, page numbers, per-page selector
- [ ] Pagination integrated into all 12 target list pages with `page`/`per_page` query params on `apiFetch` calls
- [ ] `EmptyState` component created at `src/components/EmptyState.tsx` with icon, title, description, optional action
- [ ] All ~50 "No X found/yet" instances replaced with contextual `EmptyState` components
- [ ] `Toast` component and `ToastProvider` created at `src/components/Toast.tsx` with success/error/warning/info types
- [ ] `ToastProvider` added to root layout wrapping all children
- [ ] `useToast()` hook exported and functional
- [ ] Inline success/error banners migrated to toast notifications on all action-triggered feedback (~16 priority pages + remaining)
- [ ] Toasts auto-dismiss after 5 seconds with visible progress bar
- [ ] Multiple toasts stack vertically at bottom-right
- [ ] `ResponsiveTable` component created at `src/components/ResponsiveTable.tsx` with desktop table / mobile card modes
- [ ] All 11 table-based pages refactored to use `ResponsiveTable`
- [ ] Mobile card layout shows labeled field pairs using `<dl>`/`<dt>`/`<dd>`
- [ ] `npm run build` completes with 0 errors
- [ ] `npm run lint` completes with 0 errors
- [ ] `npm run typecheck` completes with 0 errors
- [ ] `npm run test` — all tests pass
- [ ] No custom CSS added — Tailwind utilities only
- [ ] All new components include ARIA attributes and keyboard support
- [ ] No backend files modified
