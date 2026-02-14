# Prioritized Delivery Backlog (No Stack Changes)

This backlog translates the current assessment into executable work items.
It keeps the existing stack (Rails + Next.js + FastAPI) and focuses on reliability, security, and product-completion sequencing.

## Prioritization Rules

- `P0`: Blocks stable production usage, security posture, or core user flows.
- `P1`: Needed for spec parity and workflow completeness after stabilization.
- `P2`: Structural alignment, scale-readiness, and long-tail hardening.

## P0 (Execute First)

### P0-1 Auth Callback Completion
- Problem: OAuth callback redirects to `/auth/callback`, but route does not exist in web.
- Scope:
  - Add callback route/page in web and finalize post-login redirect to `/dashboard`.
  - Handle callback error states with explicit UI.
- Acceptance Criteria:
  - Google sign-in completes without 404.
  - Session cookie is established and `GET /api/v1/me` succeeds after callback.
  - Failed callback renders actionable error state.
- Dependencies: None.

### P0-2 Dead Route and Navigation Parity
- Problem: App shell and action links point to missing routes.
- Scope:
  - Resolve top-nav dead links (`/report`, `/communicate`, `/assess/quizzes` list).
  - Resolve planner dead links (`/plan/units/new`, `/plan/units/:id/lessons/new`).
  - If a feature is deferred, route must exist with explicit deferred state.
- Acceptance Criteria:
  - No clickable app navigation path returns 404.
  - UX parity gaps are either implemented or visibly marked deferred.
- Dependencies: None.

### P0-3 API Base URL Consistency
- Problem: mixed API defaults in web (`3001` vs `3000`) create environment breakage.
- Scope:
  - Standardize API base URL usage through shared API client.
  - Remove endpoint-level hardcoded base URL fallbacks.
- Acceptance Criteria:
  - All web API calls route through a single consistent base URL strategy.
  - QTI import and Google connect behave identically across environments.
- Dependencies: None.

### P0-4 RBAC Hardening Wave 2 (High-Risk Policies)
- Problem: broad `scope.all` remains in many policies.
- Scope:
  - Prioritize policies that expose broad academic or student data first:
    - `assignment`, `submission`, `discussion`, `quiz`, `quiz_attempt`, `question_bank`, `integration_config`, `sync_*`.
  - Add role-and-ownership scoped resolution.
- Acceptance Criteria:
  - Non-privileged users cannot enumerate data outside enrolled/owned context.
  - Request specs verify cross-role/cross-course denial for hardened policies.
- Dependencies: None.

### P0-5 CI Gate Completion for Core Runtime Behavior
- Problem: CI currently runs Core static checks but not Core RSpec.
- Scope:
  - Add Core test job (`bundle exec rspec`) in CI.
  - Add root shortcut for full CI parity including Core tests.
- Acceptance Criteria:
  - PR CI fails on Core behavior regression (not only lint/security static checks).
  - Root CI command executes web + ai-gateway + core checks.
- Dependencies: None.

### P0-6 Session/CSRF Hardening for Cookie-Based Auth
- Problem: cookie-session auth is active; CSRF protections are not clearly enforced in API controller layer.
- Scope:
  - Implement and validate CSRF protections for state-changing endpoints under current cookie auth pattern.
  - Ensure OmniAuth and session destroy flows remain functional after hardening.
- Acceptance Criteria:
  - State-changing requests without valid CSRF protection are rejected.
  - Login/logout and normal app workflows continue to pass.
- Dependencies: P0-1.

### P0-7 Submissions Inbox Performance/API Shape
- Problem: web page performs nested sequential fetches and uses placeholder student identities.
- Scope:
  - Add aggregated submissions endpoint for inbox use case (course + assignment + student display data).
  - Replace `Student #id` UI fallback with real names where authorized.
- Acceptance Criteria:
  - Inbox loads with bounded query count and no nested request waterfall.
  - Student-facing identifiers render as names in authorized contexts.
- Dependencies: P0-4.

## P1 (Spec Parity and Workflow Completion)

### P1-1 Planner-First Shell Completion
- Scope:
  - Implement top bar school selector, search, and notifications behavior.
  - Implement right context panel behavior on planner screens.
- Acceptance Criteria:
  - App shell matches UX spec expectations for planner-first workflows.

### P1-2 Teacher Workflow Finish
- Scope:
  - Complete missing teacher-surface screens/routes: quiz list, calendar, create flows.
  - Remove silent-failure patterns and add user-visible error states.
- Acceptance Criteria:
  - All primary teacher workflows are reachable and resilient to API failure.

### P1-3 Student Surface Expansion
- Scope:
  - Add student dashboard and course module navigation parity.
  - Ensure role-aware rendering and policy-backed data access.
- Acceptance Criteria:
  - Student role can complete end-to-end dashboard → module → assignment/quiz flows.

### P1-4 Admin Surface Completion
- Scope:
  - Add admin dashboard, school setup, users & roles, standards management screens.
- Acceptance Criteria:
  - Admin workflows listed in UX spec are reachable and policy-enforced.

### P1-5 AI Product Integration (Core + Web)
- Scope:
  - Add tenant-level AI provider/policy config in Core + Admin UI.
  - Persist invocation metadata (task type, actor, provider, usage, status).
  - Integrate planner “assist” actions with policy enforcement.
- Acceptance Criteria:
  - Admin can manage AI settings in-app.
  - Teacher can invoke approved AI actions with auditable persistence.

### P1-6 AI Safety and Error-Path Expansion
- Scope:
  - Expand ai-gateway tests for stream failures, auth edge cases, and safety filter edge patterns.
  - Add deterministic response behavior for provider-error streaming frames.
- Acceptance Criteria:
  - AI gateway error/safety paths are test-covered and stable under CI.

## P2 (Structural Alignment and Scale Readiness)

### P2-1 Spec/Schema Reconciliation
- Scope:
  - Reconcile TECH spec entities not represented in schema (`permissions`, `guardian_links`, `messages/threads`, `question_versions`, AI governance tables).
  - For each: implement now or explicitly defer with documented rationale.
- Acceptance Criteria:
  - No unresolved mismatch between technical spec and actual data model intent.

### P2-2 Contract Coverage Expansion
- Scope:
  - Expand OpenAPI contracts from baseline/high-traffic to broad active `/api/v1` and `/v1` surfaces.
  - Add contract update checks to CI.
- Acceptance Criteria:
  - Contracts are kept in sync with shipped endpoints and reviewed in PRs.

### P2-3 Shared UI Package Foundation
- Scope:
  - Populate `packages/ui` with reused primitives from web app.
  - Migrate duplicated styles/components incrementally.
- Acceptance Criteria:
  - Shared design components are consumed by web with reduced duplication.

### P2-4 Observability and Runbook Hardening
- Scope:
  - Add explicit runbooks for integration sync failures and AI provider failures.
  - Define baseline metrics and alert thresholds (latency/error rate/failure queue).
- Acceptance Criteria:
  - On-call/operator can diagnose sync and AI issues from documented paths and telemetry.

### P2-5 Search and Content Retrieval Strategy
- Scope:
  - Implement initial FTS strategy and query endpoints aligned with TECH spec direction.
- Acceptance Criteria:
  - Standards/unit/template discovery supports scalable search use cases.

## Suggested Execution Order

1. `P0-1` to `P0-3` (critical user-path and routing stability)
2. `P0-4` and `P0-6` (security hardening)
3. `P0-5` and `P0-7` (regression prevention + performance)
4. `P1-1` to `P1-4` (UX/spec parity)
5. `P1-5` and `P1-6` (AI product completion)
6. `P2-*` (structural and scale-focused hardening)

## Definition of Done (All Tickets)

- Requirement and spec IDs referenced in PR.
- Tenant scoping and policy checks included for all persisted/read paths.
- Tests added at the appropriate layer and passing in CI.
- `docs/TRACEABILITY.md` updated to reflect status change.
