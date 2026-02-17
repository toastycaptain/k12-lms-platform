# CODEX_DATA_FETCHING_LAYER — Add SWR for Client-Side Data Fetching

**Priority:** P0
**Effort:** Medium (6–10 hours)
**Spec Refs:** TECH-2.1, PRD-23 (Performance), UX-3.1 (clean CTAs and statuses)
**Depends on:** None

---

## Problem

All 80 frontend pages use raw `apiFetch()` inside `useEffect` hooks for data loading. This pattern creates:

1. **Request waterfalls** — nested sequential fetches (e.g., load course → then load modules → then load items)
2. **No caching** — navigating away and back re-fetches everything
3. **No revalidation** — stale data persists until manual refresh
4. **Duplicate loading/error state** — every page re-implements `useState` for loading, error, and data
5. **No optimistic updates** — mutations feel slow with full round-trip wait

---

## Solution

Add **SWR** (stale-while-revalidate) as the data fetching layer. SWR is lightweight (~4KB), works with the existing `apiFetch` client, and provides:

- Automatic caching and deduplication
- Background revalidation on focus/reconnect
- Optimistic mutation support
- Built-in loading/error states via `useSWR` hook

**Why SWR over React Query:** Smaller bundle, simpler API, better fit for the existing `apiFetch` wrapper pattern. No need for query client provider or complex cache configuration.

---

## Tasks

### 1. Install SWR

```bash
cd apps/web && npm install swr
```

### 2. Create SWR Fetcher and Hooks

Create `apps/web/src/lib/swr.ts`:

```typescript
import useSWR, { type SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { apiFetch } from "./api";

// Default fetcher that uses apiFetch
export const fetcher = <T>(path: string): Promise<T> => apiFetch<T>(path);

// Typed hook for GET requests
export function useApi<T>(path: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(path, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    ...config,
  });
}

// Typed hook for mutations (POST/PATCH/DELETE)
export function useApiMutation<T, A = Record<string, unknown>>(
  path: string,
  method: "POST" | "PATCH" | "DELETE" = "POST"
) {
  return useSWRMutation<T, Error, string, A>(
    path,
    (url: string, { arg }: { arg: A }) =>
      apiFetch<T>(url, { method, body: JSON.stringify(arg) })
  );
}
```

### 3. Create Domain-Specific Hooks

Create hooks for the most-used data patterns. Place in `apps/web/src/lib/hooks/`:

```
hooks/
  use-courses.ts      — useCourses(), useCourse(id)
  use-units.ts        — useUnits(), useUnit(id)
  use-assignments.ts  — useAssignments(courseId), useAssignment(id)
  use-submissions.ts  — useSubmissions(assignmentId)
  use-quizzes.ts      — useQuizzes(courseId), useQuiz(id)
  use-notifications.ts — useNotifications(), useUnreadCount()
  use-standards.ts    — useStandards(frameworkId)
```

Each hook should:
- Accept filter/pagination params
- Return `{ data, error, isLoading, mutate }` from SWR
- Build the API path with query parameters
- Use `null` key to conditionally skip fetching

### 4. Migrate High-Traffic Pages (Phase 1 — 10 pages)

Convert these pages from raw `apiFetch` + `useEffect` to SWR hooks:

| Page | Current Pattern | Target |
|------|----------------|--------|
| `/dashboard` | useEffect + apiFetch | `useApi("/courses")` + `useApi("/notifications")` |
| `/plan/units` | useEffect + apiFetch | `useUnits()` |
| `/plan/units/[id]` | useEffect + apiFetch | `useUnit(id)` |
| `/teach/courses` | useEffect + apiFetch | `useCourses()` |
| `/teach/courses/[courseId]` | useEffect + apiFetch | `useCourse(id)` |
| `/teach/courses/[courseId]/gradebook` | useEffect + apiFetch | `useApi(gradebookPath)` |
| `/learn/dashboard` | useEffect + apiFetch | `useCourses()` |
| `/learn/courses/[courseId]` | useEffect + apiFetch | `useCourse(id)` |
| `/assess/quizzes` | useEffect + apiFetch | `useApi("/quizzes")` |
| `/communicate` | useEffect + apiFetch | `useApi("/message_threads")` |

For each page:
- Replace `useState` + `useEffect` + `apiFetch` with the appropriate SWR hook
- Remove manual loading state management
- Use SWR's `isLoading` and `error` states
- Keep existing JSX/UI unchanged
- Ensure existing tests still pass (mock SWR responses in tests)

### 5. Migrate Remaining Pages (Phase 2 — 70 pages)

Convert all remaining pages to SWR hooks. Group by section:
- Plan section (12 pages)
- Teach section (15 pages)
- Learn section (10 pages)
- Assess section (12 pages)
- Admin section (15 pages)
- Communicate section (3 pages)
- Report section (2 pages)

### 6. Add Mutation Revalidation

For create/update/delete operations, trigger cache revalidation:

```typescript
import { mutate } from "swr";

// After creating an assignment:
await apiFetch("/courses/1/assignments", { method: "POST", body });
mutate("/courses/1/assignments"); // revalidate the list
```

### 7. Update Test Utilities

Update `apps/web/src/test/utils.tsx` to provide SWR test wrapper:

```typescript
import { SWRConfig } from "swr";

export function TestWrapper({ children }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
    </SWRConfig>
  );
}
```

### 8. Add Tests for SWR Hooks

Create `apps/web/src/lib/__tests__/swr.test.ts`:
- Test `useApi` returns data on success
- Test `useApi` returns error on failure
- Test `useApi` returns isLoading initially
- Test `useApi` with null key skips fetch
- Test `useApiMutation` triggers mutation
- Test cache deduplication (same key = single fetch)

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/lib/swr.ts` | Core SWR fetcher and hooks |
| `apps/web/src/lib/hooks/use-courses.ts` | Course data hooks |
| `apps/web/src/lib/hooks/use-units.ts` | Unit plan data hooks |
| `apps/web/src/lib/hooks/use-assignments.ts` | Assignment data hooks |
| `apps/web/src/lib/hooks/use-submissions.ts` | Submission data hooks |
| `apps/web/src/lib/hooks/use-quizzes.ts` | Quiz data hooks |
| `apps/web/src/lib/hooks/use-notifications.ts` | Notification data hooks |
| `apps/web/src/lib/hooks/use-standards.ts` | Standards data hooks |
| `apps/web/src/lib/__tests__/swr.test.ts` | SWR hook tests |

## Files to Modify

All 80 page files under `apps/web/src/app/` — migrate from raw apiFetch to SWR hooks.

---

## Definition of Done

- [ ] `swr` package installed and importable
- [ ] Core `useApi` and `useApiMutation` hooks created and tested
- [ ] 8 domain-specific hook files created
- [ ] All 80 pages migrated from raw `apiFetch` + `useEffect` to SWR hooks
- [ ] No manual `useState` for loading/error where SWR provides it
- [ ] All 256+ existing tests still pass
- [ ] No TypeScript errors (`npm run typecheck` passes)
- [ ] No lint errors (`npm run lint` passes)
- [ ] Build succeeds (`npm run build` passes)
- [ ] Cache revalidation works on navigation (no stale data on back button)
