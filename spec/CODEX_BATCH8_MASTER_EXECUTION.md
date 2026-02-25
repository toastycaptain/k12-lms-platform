# CODEX Batch 8 — Master Execution Instructions

**Date:** 2026-02-25
**Total Specs:** 7
**Estimated Effort:** 47–62 hours
**Prerequisite:** All Batch 1–7 specs complete (78 total), platform live with real users

---

## Execution Protocol

### Before Starting

1. Read `AGENTS.md` and `CLAUDE.md` at the project root for critical rules and patterns.
2. Read `CODEX_BATCH8_PLAN.md` for the full plan and dependency graph.
3. Run all existing tests to confirm green baseline:
   ```bash
   cd apps/core && bundle exec rspec
   cd apps/web && npm run typecheck && npm run lint
   cd apps/ai-gateway && pytest
   cd apps/web && npx playwright test e2e/workflows/
   ```
4. If any tests fail, fix them before proceeding. Do not start Batch 8 on a broken baseline.

### For Each Task

Follow this cycle for every spec file listed below:

1. **Read the spec** — Open the spec file from `spec/` and read it completely.
2. **Create a feature branch** — Branch from `main`:
   ```bash
   git checkout main && git pull origin main
   git checkout -b batch8/<task-number>-<short-name>
   ```
3. **Execute all tasks** in the spec — Create files, modify files, write tests, exactly as described.
4. **Run tests** — Verify the Definition of Done:
   ```bash
   # Rails specs
   cd apps/core && bundle exec rspec

   # Rubocop
   cd apps/core && bundle exec rubocop

   # TypeScript + lint
   cd apps/web && npm run typecheck
   cd apps/web && npm run lint

   # AI gateway (if modified)
   cd apps/ai-gateway && pytest

   # E2E (if frontend pages changed)
   cd apps/web && npx playwright test e2e/workflows/
   ```
5. **Fix any failures** — Do not proceed until all tests pass and all linting is clean.
6. **Commit and push**:
   ```bash
   git add -A
   git commit -m "Batch 8 Task <N>: <Spec Title>

   Implements spec/<SPEC_FILENAME>.md
   - <1-line summary of what was built>
   - All tests passing"
   git push origin batch8/<task-number>-<short-name>
   ```
7. **Merge to main**:
   ```bash
   git checkout main
   git merge batch8/<task-number>-<short-name>
   git push origin main
   ```
8. **Proceed to next task** — Only after the merge is confirmed on main.

---

## Task Sequence

Execute tasks in this exact order. Respect dependencies.

---

### Phase A — Cleanup (Task 1)

Phase A has no dependencies and must run before Phase B.

#### Task 1: Duplicate Migration Cleanup

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_MIGRATION_CLEANUP.md` |
| Priority | P0 |
| Effort | Tiny (1–2h) |
| Depends On | None |
| Branch | `batch8/1-migration-cleanup` |
| Commit Message | `Batch 8 Task 1: Duplicate Migration Cleanup` |

**What to build:** Identify and remove the 7 duplicate migration files (20260216 duplicates of 20260215 migrations). Verify `bundle exec rails db:migrate:status` shows all UP. Update CI schema verification step to enforce no duplicate timestamps. Add a Rubocop custom cop or CI shell check that fails if two migration files share a timestamp prefix.

**Why this is P0:** Duplicate migrations can cause `db:migrate` to run previously applied migrations in some environments, silently creating duplicate indexes or constraints. Must be resolved before new engineers join and run fresh setup.

**After commit, verify:**
- [ ] `bundle exec rails db:migrate:status` shows all UP with no DUPLICATE entries
- [ ] `bundle exec rspec` passes
- [ ] `bundle exec rubocop` passes
- [ ] No migration file timestamps are duplicated
- [ ] Pushed and merged to main

---

### Phase B — Developer Experience (Tasks 2–5)

Phase B starts after Phase A is merged to main. All four tasks are independent and may execute in parallel.

#### Task 2: SWR Data Fetching Layer

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_SWR_DATA_FETCHING.md` |
| Priority | P1 |
| Effort | Medium (8–10h) |
| Depends On | **Task 1** (clean migration baseline) |
| Branch | `batch8/2-swr-data-fetching` |
| Commit Message | `Batch 8 Task 2: SWR Data Fetching Layer` |

**What to build:** Install SWR. Create custom hooks (`useUnit`, `useCourse`, `useSubmissions`, `useGradebook`, `useAnalytics`, etc.) that wrap `useSWR()` with the existing `apiFetch()` client. Migrate all pages away from raw `useState`/`useEffect` for server data. Implement `useSWRMutation()` for create/update/delete operations with optimistic UI. Add global SWR configuration (deduplication interval, revalidation on focus, error retry). Write hook tests with `renderHook`.

**Migration scope:** All pages in `Plan`, `Teach`, `Learn`, `Assess`, `Report`, and `Admin` sections that currently use `useState`/`useEffect` for data fetching.

**After commit, verify:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No page uses `useEffect` + `apiFetch()` for data loading (grep check)
- [ ] SWR hooks tested for loading/error/success states
- [ ] Optimistic updates work for at least 3 key mutations (submit assignment, grade submission, publish unit)
- [ ] Pushed and merged to main

---

#### Task 3: Shared UI Package

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_SHARED_UI_PACKAGE.md` |
| Priority | P1 |
| Effort | Medium (10–12h) |
| Depends On | None (runs in parallel with Tasks 2, 4, 5) |
| Branch | `batch8/3-shared-ui-package` |
| Commit Message | `Batch 8 Task 3: Shared UI Package` |

**What to build:** Populate `packages/ui` with a proper TypeScript component library. Extract and consolidate these components from the web app: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Modal`, `Card`, `Badge`, `Spinner`, `Skeleton`, `Toast`/`useToast`, `EmptyState`, `Pagination`, `ErrorBoundary`. Set up `packages/ui/package.json` with `@k12/ui` package name, TypeScript build with declaration files, Tailwind peer dependency. Update `apps/web/tsconfig.json` to resolve `@k12/ui` from the packages directory. Replace all in-app duplicates with imports from `@k12/ui`. Write Storybook stories or Vitest component tests for each component.

**After commit, verify:**
- [ ] `packages/ui` builds without errors
- [ ] `@k12/ui` components importable in `apps/web`
- [ ] No duplicate Button/Input/Modal/Card/Toast implementations remain in `apps/web/src`
- [ ] `npm run typecheck` passes in both `apps/web` and `packages/ui`
- [ ] All component tests pass
- [ ] Pushed and merged to main

---

#### Task 4: Postgres Full-Text Search Depth

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_POSTGRES_FULL_TEXT_SEARCH.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | None (runs in parallel with Tasks 2, 3, 5) |
| Branch | `batch8/4-postgres-fts` |
| Commit Message | `Batch 8 Task 4: Postgres Full-Text Search Depth` |

**What to build:** Add `tsvector` columns and GIN indexes to `unit_versions` (title, description, objectives), `lesson_versions` (title, learning_objectives, content), `standards` (code, description), `templates` (title, description), `questions` (content, explanation), `assignments` (title, description). Create triggers to keep `tsvector` columns current on insert/update. Update `SearchController` to use `@@` full-text match operator with `ts_rank` ordering. Add language stemming (English default, configurable per tenant). Write model scopes (`UnitVersion.search("fractions")`) and controller specs verifying ranked results. Update `GlobalSearch` component to show result type icons and highlighted match context.

**After commit, verify:**
- [ ] GIN indexes on `tsvector` columns in schema
- [ ] `bundle exec rspec spec/controllers/api/v1/search_controller_spec.rb` passes with FTS scenarios
- [ ] Search returns results for partial words (stemming) and multiple terms
- [ ] `bundle exec rubocop` passes
- [ ] Pushed and merged to main

---

#### Task 5: Network Resilience

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_NETWORK_RESILIENCE.md` |
| Priority | P1 |
| Effort | Small (4–6h) |
| Depends On | None (runs in parallel with Tasks 2, 3, 4) |
| Branch | `batch8/5-network-resilience` |
| Commit Message | `Batch 8 Task 5: Network Resilience` |

**What to build:** `useNetworkStatus` hook that listens to `navigator.onLine` and emits events. `ConnectionBanner` component that appears at the top of the page when offline and auto-dismisses 3 seconds after reconnect. SWR retry configuration (3 retries with exponential backoff on 5xx errors, no retry on 4xx). Mutation queue: if a user submits an assignment while offline, queue the request and execute when connection restores. Offline-safe pages: `/dashboard`, `/plan/units`, `/learn/courses` serve stale SWR cache when offline. Playwright E2E test using `context.setOffline(true/false)` to verify banner appears/clears. Vitest test for `useNetworkStatus` hook.

**After commit, verify:**
- [ ] `ConnectionBanner` appears within 2s of going offline in E2E test
- [ ] Banner auto-clears 3s after reconnect
- [ ] Failed POST (assignment submit) while offline is queued and retried on reconnect
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

### Phase C — User-Facing Features (Tasks 6–7)

Phase C starts after Phase B is merged to main.

#### Task 6: Gradebook Depth

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_GRADEBOOK_DEPTH.md` |
| Priority | P1 |
| Effort | Medium (6–8h) |
| Depends On | **Task 2** (SWR Data Fetching — gradebook uses SWR for live updates) |
| Branch | `batch8/6-gradebook-depth` |
| Commit Message | `Batch 8 Task 6: Gradebook Depth` |

**What to build:**

*Backend:*
- `GradeCategory` model (name, weight percentage, course scoped)
- `GradeCategory` belongs to `Course`; `Assignment` belongs to `GradeCategory` (nullable)
- `GradebookController#export_csv` — streams CSV of all student grades (name, assignment, score, percentage)
- `GradebookController#bulk_grade` — accepts array of `{submission_id, grade, feedback}` and grades all in one request
- `MissingWorkJob` — runs nightly, flags past-due assignments with no submission as "missing"
- `Submission#missing?` scope

*Frontend:*
- Weighted category column groups in gradebook spreadsheet
- "Grade Curve" modal: apply +N points or multiply by factor to all submissions for an assignment
- "Export CSV" button streaming the CSV response via `window.location.href`
- "Bulk Entry" mode: tab-navigable cells with keyboard entry, saves on blur
- "Missing" badge on past-due assignments with no submission (red pill)
- Category weight editor panel (sidebar, drag-and-drop weight allocation)

*Tests:*
- `spec/models/grade_category_spec.rb`
- `spec/controllers/api/v1/gradebook_controller_spec.rb` (bulk_grade, export_csv)
- `spec/jobs/missing_work_job_spec.rb`
- Frontend tests for bulk entry and CSV export

**After commit, verify:**
- [ ] `GradeCategory` model specs pass
- [ ] CSV export returns valid CSV with correct columns
- [ ] Bulk grade endpoint updates multiple submissions in one request
- [ ] Missing work job flags past-due assignments
- [ ] `bundle exec rspec` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

#### Task 7: Guardian Portal

| Field | Value |
|-------|-------|
| Spec File | `spec/CODEX_GUARDIAN_PORTAL.md` |
| Priority | P2 |
| Effort | Large (12–16h) |
| Depends On | **Batch 7 Task 1** (Security Audit must be complete before handling guardian PII) |
| Branch | `batch8/7-guardian-portal` |
| Commit Message | `Batch 8 Task 7: Guardian Portal` |

**What to build:** Complete parent/guardian read-only portal. Full spec in `spec/CODEX_GUARDIAN_PORTAL.md`.

*Backend:*
- `GuardianLink` model (guardian → student, tenant-scoped, with RLS)
- `GuardianController` with 4 endpoints: `students`, `grades`, `assignments`, `announcements`
- `GuardianPolicy` (guardian role + active link required)
- 3 serializers: `GuardianGradeSerializer`, `GuardianAssignmentSerializer`, `StudentSummarySerializer`
- Routes under `/api/v1/guardian/`

*Frontend:*
- `apps/web/src/app/guardian/` section with layout, dashboard, student detail, grades, assignments
- AppShell guardian-specific nav (simplified — only "My Students")
- Admin user management: guardian role, guardian links panel, "Link Guardian" action on student records

*Tests:*
- `spec/models/guardian_link_spec.rb`
- `spec/policies/guardian_policy_spec.rb`
- `spec/requests/api/v1/guardian_controller_spec.rb`
- Frontend page tests for guardian dashboard and student detail

**After commit, verify:**
- [ ] Guardian can log in and see only their linked students
- [ ] Guardian cannot access another student's data (tested in policy spec)
- [ ] Guardian cannot see Plan, Teach, Assess, or Admin nav items
- [ ] All guardian API endpoints return 403 for non-guardian users
- [ ] `bundle exec rspec` passes (including guardian specs)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] Pushed and merged to main

---

## Final Verification

After all 7 tasks are merged to main, run the complete test suite one final time:

```bash
# Pull latest main
git checkout main && git pull origin main

# Rails — full suite
cd apps/core && bundle exec rspec
cd apps/core && bundle exec rubocop

# Next.js — full checks
cd apps/web && npm run typecheck
cd apps/web && npm run lint
cd apps/web && npm run build

# AI Gateway — full suite
cd apps/ai-gateway && pytest

# E2E — full workflow suite (must still pass from Batch 7)
cd apps/web && npx playwright test e2e/workflows/
```

If all checks pass, Batch 8 is complete. Update `CODEX_REMAINING_WORK_MASTER_INDEX.md` to mark all Batch 8 tasks as complete.

---

## Summary

| Task | Spec | Phase | Depends On | Status |
|------|------|-------|------------|--------|
| 1 | CODEX_MIGRATION_CLEANUP | A | — | [x] |
| 2 | CODEX_SWR_DATA_FETCHING | B | 1 | [x] |
| 3 | CODEX_SHARED_UI_PACKAGE | B | — | [x] |
| 4 | CODEX_POSTGRES_FULL_TEXT_SEARCH | B | — | [x] |
| 5 | CODEX_NETWORK_RESILIENCE | B | — | [x] |
| 6 | CODEX_GRADEBOOK_DEPTH | C | 2 | [x] |
| 7 | CODEX_GUARDIAN_PORTAL | C | Batch 7 #1 | [x] |
