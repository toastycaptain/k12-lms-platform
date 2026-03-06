# IB Phase 2 — Master Execution Plan for Codex

## Purpose
Turn the phase-2 IB design roadmap into a strict sequential implementation program that operationalizes the existing IB direction without losing cross-curriculum integrity.

## Why this phase exists
- The current build has strong IB visual direction but still behaves too much like a set of showcase surfaces layered on top of a generic planner.
- Many deep links and workspace entry points are not yet a coherent route system, and the beautiful IB surfaces still risk diverging from the curriculum document engine.
- The next phase must move from 'beautiful demo screens' to 'daily operational flow' for teachers, specialists, coordinators, and families.

## Required reading order
- Read `00_IB_PHASE2_MASTER_EXECUTION.md` first.
- Implement `01` through `23` in order. Treat `24_ROADMAP_COVERAGE_MATRIX.md` as the final audit checklist, not as an implementation task.
- Use `25_CODEX_ORCHESTRATION_PROMPT.md` only as an optional wrapper prompt for a fresh Codex session or when resuming after context loss.

## Non-negotiable product outcomes
- The IB experience must feel like one coherent product under `/ib/**`, not a patchwork of dashboards and dead-end cards.
- Teacher home must become an action console, not a brochure dashboard.
- Coordinator/admin experiences must become exception-first operations tools, not generic admin tables dressed in IB colors.
- Evidence, planning, review, and family publishing must stay linked so teachers are not forced into duplicate entry.
- The build must explicitly address public pain patterns teachers report with Toddle and ManageBac: too many clicks, lag, hidden state, unclear approvals, weak specialist flow, noisy family output, and brittle mobile usage.

## Global architectural rules
- Do not hard-code IB terminology into globally shared non-IB surfaces. Keep shared primitives generic and mount IB expressions under `apps/web/src/app/ib/**` and `apps/web/src/features/ib/**`.
- Do not invent new backend payloads if Route 3 backend work already exposed contracts. Inspect `packages/contracts/**`, generated frontend types, and existing `apiFetch` usage first.
- Prefer extending `packages/ui` for reusable UI primitives only when the primitive is curriculum-neutral. Keep PYP/MYP/DP-specific composition in the web app.
- Every workflow must honor the click-budget rule established in the roadmap: the common path should take fewer steps than Toddle/ManageBac equivalents.
- Every screen must support loading, empty, error, offline/poor-network, and insufficient-permission states.
- Accessibility is not optional: keyboard navigation, visible focus, screen-reader labels, semantic headings, and color-independent status indicators are required.
- All new data access should go through `apiFetch`, `useAppSWR`, existing auth context, and any route-specific hooks created in this task set.
- Where a task touches mobile behavior, build for high-value triage actions rather than full parity.

## Repo conventions
- If `apps/web/src/app/ib` or `apps/web/src/features/ib` does not exist yet in the latest branch, create them. Keep route files under `app/ib/**` and feature modules under `features/ib/**`.
- If a task needs shared IB infrastructure, prefer `apps/web/src/features/ib/core/**`, `apps/web/src/features/ib/layout/**`, `apps/web/src/features/ib/hooks/**`, and `apps/web/src/features/ib/types/**` rather than scattering files across unrelated generic directories.
- When replacing or wrapping generic pages, preserve backwards compatibility until the `/ib/**` route family is stable. Do not break generic American/British pack routing while implementing IB mode.
- Use generated or contract-backed types where possible. If a type is missing, add it through the normal contracts flow rather than ad hoc frontend-only interfaces.

## Definition of done for every task
- All named routes or components exist and are wired.
- The task ships with loading/empty/error/permission states.
- At least smoke-level tests exist for new major components and route behaviors.
- The task includes click-budget review notes and explicitly states which Toddle/ManageBac pain point it improves.
- The task updates navigation, breadcrumbs, and deep-link patterns if new routes were added.

## Sequence summary
- `01–02`: stabilize route model, shell, context, work modes.
- `03–04`: build teacher/coordinator home consoles.
- `05–10`: operationalize PYP, MYP, and DP studios and core workflows.
- `11–13`: specialist flow, evidence inbox, family publishing queue.
- `14–18`: coordinator power tools, governance, standards/practices, review workflows, reporting.
- `19–23`: calm-mode student/guardian refinement, mobile triage, AI guardrails, performance/reliability, QA and release gates.

## Coordination rules for Codex
- Do not skip ahead to later tasks because the UI 'looks ready'. Several later tasks assume route conventions, shell context, and operation panels introduced early in this sequence.
- When a task depends on a backend feature that exists but is not clearly typed in the frontend, stop and inspect contracts before adding frontend-only fallbacks.
- If an assumption about the backend cannot be verified in repo code or contracts, add a TODO contract note and keep the UI behind a mock adapter that is easy to replace.

## Full task sequence
1. `01_IB_ROUTE_MAP_AND_PRODUCT_ARCHITECTURE.md`
2. `02_IB_APP_SHELL_STICKY_CONTEXT_AND_WORK_MODES.md`
3. `03_IB_TEACHER_HOME_ACTION_CONSOLE.md`
4. `04_IB_COORDINATOR_HOME_AND_OVERSIGHT_SUMMARY.md`
5. `05_IB_PYP_UNIT_STUDIO_V2_INFORMATION_MODEL.md`
6. `06_IB_PYP_WEEKLY_FLOW_PUBLISH_READINESS_AND_EXHIBITION.md`
7. `07_IB_MYP_UNIT_STUDIO_V2_CONCEPT_CONTEXT_CRITERIA.md`
8. `08_IB_MYP_INTERDISCIPLINARY_SERVICE_AND_PROJECT_LINKS.md`
9. `09_IB_DP_COURSE_MAP_AND_IA_RISK_WORKSPACE.md`
10. `10_IB_DP_CORE_EE_TOK_CAS_AND_FAMILY_SUPPORT.md`
11. `11_IB_SPECIALIST_MODE_AND_CROSS_GRADE_WORKFLOWS.md`
12. `12_IB_EVIDENCE_INBOX_AND_TRIAGE.md`
13. `13_IB_FAMILY_PUBLISHING_QUEUE_AND_CALM_DIGESTS.md`
14. `14_IB_PROGRAMME_OPERATIONS_CENTER.md`
15. `15_IB_PYP_POI_GOVERNANCE_AND_CURRICULUM_COHERENCE.md`
16. `16_IB_STANDARDS_AND_PRACTICES_EVIDENCE_CENTER.md`
17. `17_IB_APPROVAL_MODERATION_AND_REVIEW_WORKFLOWS.md`
18. `18_IB_EXCEPTION_BASED_REPORTING_AND_DRILLDOWN.md`
19. `19_IB_STUDENT_AND_GUARDIAN_CALM_MODE_REFINEMENT.md`
20. `20_IB_MOBILE_TRIAGE_POOR_NETWORK_AND_QUICK_ACTIONS.md`
21. `21_IB_AI_ASSISTANCE_GUARDRAILS_AND_DIFF_BASED_APPLY.md`
22. `22_IB_PERFORMANCE_RELIABILITY_AND_TELEMETRY_HARDENING.md`
23. `23_IB_DESIGN_QA_CLICK_BUDGET_AND_RELEASE_GATES.md`

## Shared repo touchpoints to inspect before coding
- `apps/web/src/components/AppShell.tsx` — existing global shell and nav logic that still reflects generic K–12 structure.
- `apps/web/src/lib/api.ts`, `apps/web/src/lib/swr.ts`, `apps/web/src/lib/swr-mutations.ts` — shared API and data-fetching layer.
- `apps/web/src/lib/auth-context.tsx` — current user, roles, curriculum runtime, and school context.
- `apps/web/src/components/SchoolSelector.tsx` and `TopRightQuickActions.tsx` — current shared affordances that may be reused or wrapped.
- `apps/web/src/components/StudentProgressView.tsx` — current generic progress presentation that will need IB-specific overlays or replacements.
- `apps/web/src/app/dashboard`, `apps/web/src/app/plan`, `apps/web/src/app/learn`, `apps/web/src/app/guardian`, `apps/web/src/app/admin` — generic route families to inspect before creating IB-specific replacements.
- `packages/contracts/**` — source of truth for runtime curriculum packs, document schemas, workflows, and backend contract expectations.
- `packages/ui/**` — neutral UI primitives to extend carefully where it reduces duplication without baking in IB semantics.

## Final note
This phase is deliberately sequenced. The goal is not just to add more IB screens; it is to operationalize the existing IB direction into a calmer, faster, more trustworthy daily-use system for teachers, specialists, coordinators, students, and families.
