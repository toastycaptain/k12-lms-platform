# Step 6 — School scoping for district-scale correctness (Frontend)

## Outcome

After this step:

- The frontend has a first-class **School Context**.
- Switching schools instantly revalidates cached data and prevents cross-school cache bleed.
- All SWR caches that depend on school are correctly scoped.
- The UI gracefully handles backend enforcement (403/404) when:
  - no school is selected
  - a stored school id is no longer accessible
- District admins can administer multiple schools reliably.

This is critical before rolling out Planning Contexts and Curriculum Documents across districts.

---

## Why the current frontend is risky at district scale

Today:

- `SchoolSelector` stores school id in localStorage.
- `apiFetch` forwards it via `X-School-Id`.
- SWR cache keys are usually just URL strings.

Problem:

- Switching schools does **not change SWR keys**, so cached data from School A can render briefly while School B is selected.
- Some hooks/pages use `useSWR` directly, not always `useAppSWR`.

We need:

- a stable, explicit `SchoolContext` provider
- SWR key scoping by school id

---

## Design decisions

### Decision 1 — School id is part of the SWR cache key
Use SWR tuple keys:

- `["/api/v1/courses", schoolId]`

Fetcher must use only the URL portion.

### Decision 2 — School selection is a provider
Replace ad-hoc localStorage access.

- localStorage is still used for persistence
- but components read selection from `SchoolContext`

### Decision 3 — Changing schools triggers global revalidation
When school changes:

- clear/revalidate SWR caches
- optionally refresh current user

---

## Implementation plan

### 1) Upgrade SWR wrapper to support tuple keys

**Modify:** `apps/web/src/lib/swr.ts`

Changes:

1. Update `defaultFetcher` to accept string OR array.

```ts
export function defaultFetcher<T>(key: string | any[]): Promise<T> {
  const url = Array.isArray(key) ? key[0] : key;
  return apiFetch<T>(url);
}
```

2. Update `useAppSWR` signature:

```ts
import type { Key } from "swr";

export function useAppSWR<Data = unknown, ErrorType = Error>(
  key: Key | null,
  config?: SWRConfiguration<Data, ErrorType>,
) {
  return useSWR<Data, ErrorType>(key, defaultFetcher<Data>, { ...swrConfig, ...config });
}
```

3. Update any direct `useSWR(url, defaultFetcher)` uses if needed.

This change is backwards compatible because string keys still work.

---

### 2) Implement SchoolContext provider

**Create:** `apps/web/src/lib/school-context.tsx`

Responsibilities:

- load accessible schools list
- resolve selected school id
- expose `schoolId`, `schools`, `setSchoolId`

Key rules:

- If no schools exist, `schoolId = null`.
- If stored schoolId is invalid, pick the first accessible school.
- Persist selection into localStorage key `k12.selectedSchoolId`.

Implementation outline:

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { mutate } from "swr";

const STORAGE_KEY = "k12.selectedSchoolId";

interface School { id: number; name: string }
interface SchoolContextValue {
  schools: School[];
  schoolId: string | null;
  setSchoolId: (id: string) => void;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await apiFetch<School[]>("/api/v1/schools");
        setSchools(list);

        if (list.length === 0) {
          setSchoolIdState(null);
          return;
        }

        const stored = window.localStorage.getItem(STORAGE_KEY);
        const valid = stored && list.some((s) => String(s.id) === stored) ? stored : String(list[0].id);
        window.localStorage.setItem(STORAGE_KEY, valid);
        setSchoolIdState(valid);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setSchoolId = (id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setSchoolIdState(id);
    // Clear/revalidate SWR cache immediately
    void mutate(() => true, undefined, { revalidate: true });
  };

  const value = useMemo(() => ({ schools, schoolId, setSchoolId, loading }), [schools, schoolId, loading]);

  return <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be used within SchoolProvider");
  return ctx;
}
```

---

### 3) Wire SchoolProvider into RootLayout

**Modify:** `apps/web/src/app/layout.tsx`

Wrap the existing providers:

```tsx
<SwrProvider>
  <AuthProvider>
    <SchoolProvider>
      <ToastProvider>
        ...
      </ToastProvider>
    </SchoolProvider>
  </AuthProvider>
</SwrProvider>
```

Order:

- SchoolProvider can be inside AuthProvider (so you can later scope schools by user role).

---

### 4) Refactor SchoolSelector to use SchoolContext

**Modify:** `apps/web/src/components/SchoolSelector.tsx`

Replace local internal state + fetch with:

- `const { schools, schoolId, setSchoolId, loading } = useSchool();`

Behavior changes:

- When selection changes, call `setSchoolId(nextSchoolId)`.
- `setSchoolId` must trigger SWR revalidation (already in provider).

Remove duplicated fetching from SchoolSelector.

---

### 5) Update SWR hooks to scope by school id

Create a helper hook:

**Create:** `apps/web/src/lib/useSchoolSWR.ts`

```ts
import { useSchool } from "@/lib/school-context";
import { useAppSWR } from "@/lib/swr";

export function useSchoolSWR<T>(url: string | null) {
  const { schoolId } = useSchool();
  if (!url || !schoolId) return useAppSWR<T>(null);
  return useAppSWR<T>([url, schoolId]);
}
```

Then update high-risk hooks first:

- `useCourses`
- `usePlanningContexts`
- `useCurriculumDocuments`
- `useStandardFrameworks` / frameworks

Example modification:

```ts
return useAppSWR<Course[]>(schoolId ? [`/api/v1/courses${query}`, schoolId] : null);
```

This ensures cache isolation.

---

### 6) Add a “school required” UX guard

Some tenants may have a user with access to zero schools.

Add a reusable component:

**Create:** `apps/web/src/components/SchoolRequired.tsx`

Behavior:

- If `useSchool().loading` → show “Loading school…”
- If `schools.length === 0` → show EmptyState “No schools available”
- Else render children

Wrap school-scoped pages:

- Plan pages
- Teach pages
- Admin pages that are school-scoped

This avoids confusing “403” errors.

---

### 7) Make `apiFetch` resilient to invalid stored school id

`apiFetch` currently reads localStorage directly.

When SchoolProvider owns the value, this is mostly solved.

But you should handle:

- localStorage has stale school id
- backend returns 403 “School not accessible”

Recommended approach:

- When `apiFetch` receives 403/404 and message contains `school`:
  - clear localStorage `k12.selectedSchoolId`
  - force reload or route to `/dashboard`

This is optional but improves robustness.

---

## Testing

### Unit tests

- SchoolProvider:
  - selects default school
  - updates localStorage
  - triggers SWR mutate on change

Mock `apiFetch("/api/v1/schools")`.

### E2E

- Create two schools in seeded data
- Select School A, open `/plan/documents`
- Switch to School B
- Ensure list updates and does not show School A docs

---

## Acceptance criteria

- Switching schools does not show stale data.
- SWR cache keys include school id for school-scoped data.
- If a stored school id is invalid, the UI self-heals to a valid school.
- Teachers/district admins can switch schools and immediately see correct contexts/documents.

---

## Rollout notes

- This step is safe to ship early because it is mostly additive.
- Migrate hooks incrementally: even if some hooks still use string keys, the global mutate-on-school-change reduces risk.
