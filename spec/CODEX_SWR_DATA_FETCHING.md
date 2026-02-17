# CODEX_SWR_DATA_FETCHING — Replace useEffect+fetch with SWR Hooks

**Priority:** P1
**Effort:** Large (10–12 hours)
**Spec Refs:** PRD-23 (Performance), PRD-8 (Drive attach < 30s, responsive UI)
**Depends on:** None

---

## Problem

Every frontend page uses the same pattern: `useState` + `useEffect` + `apiFetch()` with manual loading/error state management. This creates:

1. **No caching** — navigating away and back re-fetches every time
2. **No revalidation** — stale data persists until manual refresh
3. **No deduplication** — multiple components fetching same data issue parallel requests
4. **Boilerplate** — every page repeats 15-20 lines of fetch/loading/error logic
5. **No optimistic updates** — mutations wait for server round-trip before UI updates
6. **No background refresh** — data goes stale during long sessions

---

## Tasks

### 1. Install SWR

```bash
cd apps/web && npm install swr
```

### 2. Create Core SWR Fetcher and Provider

Create `apps/web/src/lib/swr.ts`:

```typescript
import useSWR, { SWRConfiguration } from "swr";
import { apiFetch } from "./api";

export const defaultFetcher = (url: string) =>
  apiFetch(url).then((r) => r.json());

export const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
};
```

Add `<SWRConfig>` wrapper in root layout.

### 3. Create Domain Hooks (Phase 1 — High-Traffic)

Create `apps/web/src/hooks/` with typed hooks:

```typescript
// hooks/useCourses.ts
export function useCourses() {
  return useSWR<Course[]>("/api/v1/courses");
}

export function useCourse(id: string) {
  return useSWR<Course>(id ? `/api/v1/courses/${id}` : null);
}
```

Priority hooks to create:
- `useCourses`, `useCourse`
- `useUnitPlans`, `useUnitPlan`
- `useAssignments`, `useAssignment`
- `useSubmissions`, `useSubmission`
- `useGradebook`
- `useNotifications`
- `useQuizzes`, `useQuiz`
- `useStandards`, `useStandardFrameworks`
- `useCurrentUser` (replace useAuth fetch pattern)
- `useCalendar`

### 4. Create Mutation Helpers

Create `apps/web/src/lib/swr-mutations.ts`:

```typescript
import { mutate } from "swr";

export async function createAndRevalidate<T>(
  url: string,
  body: Record<string, unknown>,
  listKey: string
): Promise<T> {
  const res = await apiFetch(url, { method: "POST", body: JSON.stringify(body) });
  const data = await res.json();
  mutate(listKey); // revalidate list
  return data as T;
}
```

### 5. Migrate Pages (Phase 1 — 10 High-Traffic Pages)

Replace useEffect+fetch pattern with SWR hooks in:
1. `/learn/dashboard` — student dashboard
2. `/learn/courses` — course listing
3. `/teach/courses` — teacher courses
4. `/plan/units` — unit library
5. `/plan/standards` — standards browser
6. `/teach/courses/[courseId]` — course home
7. `/teach/courses/[courseId]/gradebook` — gradebook
8. `/assess/banks` — question banks
9. `/assess/quizzes` — quizzes
10. `/communicate` — messages

### 6. Migrate Pages (Phase 2 — Remaining Pages)

Migrate remaining ~40 data-fetching pages to SWR hooks. Each migration follows the same pattern: replace useState/useEffect/loading/error with the appropriate domain hook.

### 7. Add Tests

- `apps/web/src/hooks/__tests__/useCourses.test.ts`
- `apps/web/src/hooks/__tests__/useUnitPlans.test.ts`
- `apps/web/src/lib/__tests__/swr.test.ts`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/lib/swr.ts` | SWR config and fetcher |
| `apps/web/src/lib/swr-mutations.ts` | Mutation + revalidation helpers |
| `apps/web/src/hooks/useCourses.ts` | Course hooks |
| `apps/web/src/hooks/useUnitPlans.ts` | Unit plan hooks |
| `apps/web/src/hooks/useAssignments.ts` | Assignment hooks |
| `apps/web/src/hooks/useSubmissions.ts` | Submission hooks |
| `apps/web/src/hooks/useGradebook.ts` | Gradebook hook |
| `apps/web/src/hooks/useNotifications.ts` | Notification hooks |
| `apps/web/src/hooks/useQuizzes.ts` | Quiz hooks |
| `apps/web/src/hooks/useStandards.ts` | Standards hooks |
| `apps/web/src/hooks/useCalendar.ts` | Calendar hook |
| `apps/web/src/hooks/useCurrentUser.ts` | Auth user hook |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Add swr dependency |
| `apps/web/src/app/layout.tsx` | Add SWRConfig provider |
| 50+ page files | Replace useEffect+fetch with SWR hooks |

---

## Definition of Done

- [ ] SWR installed and configured with apiFetch-based fetcher
- [ ] SWRConfig provider in root layout
- [ ] 12 domain hooks created with proper TypeScript types
- [ ] Mutation helpers with list revalidation
- [ ] Phase 1: 10 high-traffic pages migrated
- [ ] Phase 2: remaining pages migrated
- [ ] Caching works (navigate away and back shows cached data instantly)
- [ ] Background revalidation on window focus
- [ ] No TypeScript errors
- [ ] Hook tests pass
