# IB Phase 5 — Productionization, Governance, and Pilot Readiness Master Execution

## Purpose
Phase 5 is the transition from “all IB full-stack vertical slices exist” to “a real school can pilot this as an IB operating system.” The focus is not adding another isolated programme feature. The focus is making the IB side coherent, governable, inspectable, and operationally reliable.

This pack turns the current state into a production-like IB mode by addressing seven gaps:

1. **Canonical route coverage**
2. **Promotion of the active IB pack**
3. **Real admin/coordinator governance**
4. **Standards & Practices as a true evaluation subsystem**
5. **Operational reliability for evidence, publishing, and notifications**
6. **Complete migration toward the IB document system**
7. **Pilot telemetry, readiness reporting, and release controls**

## What Phase 5 is not
- It is **not** another PYP/MYP/DP feature invention cycle.
- It is **not** a frontend-only polish sprint.
- It is **not** permission to keep accumulating mock or demo-only routes.
- It is **not** a substitute for rollout discipline.

## Why both frontend and backend are required
The biggest remaining IB gaps are now operational:
- real canonical routes under `/ib/**`
- backend resolution of records, queues, and redirects
- richer pack visibility and migration handling
- coordinator/admin governance payloads
- standards packet export artifacts
- evidence and publishing jobs
- migration off legacy planning surfaces
- pilot-readiness telemetry and release gating

A frontend-only approach would polish the UI while leaving critical trust gaps unresolved.

## Current repo observations that justify this phase
Based on the latest snapshot:
- `apps/core/app/services/ib/support/route_builder.rb` already knows about deep IB routes, but the frontend route tree under `apps/web/src/app/ib` is still only `layout.tsx` and `page.tsx`.
- `apps/web/src/features/ib/data.ts` already assumes a rich IB data model (operations, POI, evidence, guardian, student, programme settings, standards packets), but much of the route tree using that data is still not physically materialized.
- The backend now has real IB models such as `IbEvidenceItem`, `IbLearningStory`, `IbOperationalRecord`, `PypProgrammeOfInquiry`, `IbProgrammeSetting`, `IbStandardsCycle`, and `IbStandardsPacket`.
- The document system exists (`CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`), but Phase 5 must make it the unquestioned source of truth for IB mode.

## Execution order
Do not reorder this pack casually. The tasks are grouped so later tasks build on stable contracts from earlier ones.

### Step 1 — Materialize the canonical IB route tree
- Task 65 — Route tree audit and canonical URL contract
- Task 66 — Shared IB page shell, params, and breadcrumb contract
- Task 67 — PYP route materialization and real record pages
- Task 68 — MYP route materialization and real record pages
- Task 69 — DP route materialization and real record pages
- Task 70 — Backend route resolution and safe redirects
- Task 71 — Queue deep-link harmonization and entity resolution

### Step 2 — Promote and operationalize the active IB pack
- Task 72 — IB pack promotion, default selection, and flags
- Task 73 — Pack pinning, schema visibility, and serializer upgrades
- Task 74 — IB pack migration backfills and drift audit
- Task 75 — Document type/workflow hygiene and create-flow alignment

### Step 3 — Build the real IB admin/coordinator governance layer
- Task 76 — Programme settings backend domain expansion
- Task 77 — Programme settings frontend console
- Task 78 — Rollout console backend aggregations
- Task 79 — Rollout console frontend and adoption visibility
- Task 80 — Review governance backend queues, SLA, and exception logic
- Task 81 — Review governance frontend operations views

### Step 4 — Turn Standards & Practices into a real evaluation subsystem
- Task 82 — Standards export domain, jobs, and artifact storage
- Task 83 — Standards packet APIs, snapshots, assignments, and scoring
- Task 84 — Standards frontend packet routes and detail UI
- Task 85 — Standards export preview, cycle comparison, and approval UX

### Step 5 — Productionize evidence, publishing, and notifications
- Task 86 — Evidence indexing, filters, inbox summaries, and query APIs
- Task 87 — Publishing jobs, notifications, digests, idempotency, and audits
- Task 88 — Teacher inbox and publishing queue operationalization
- Task 89 — Mobile triage, offline resume, and changed-since-last-visit

### Step 6 — Migrate fully toward the IB document system
- Task 90 — Legacy IB path audit, freeze policy, and migration checklist
- Task 91 — Backend document normalization and backfills
- Task 92 — Frontend IB route consolidation off legacy surfaces
- Task 93 — Editor/workflow unification and IB documents-only mode

### Step 7 — Add pilot telemetry, readiness reporting, and release controls
- Task 94 — Telemetry event taxonomy and instrumentation
- Task 95 — Pilot readiness backend aggregations and health computation
- Task 96 — Pilot readiness frontend console and admin/coordinator dashboards
- Task 97 — Release controls, flag playbooks, E2E gates, and go/no-go

### Wrap-up
- Task 98 — Coverage matrix and post-Phase-5 signal
- Task 99 — Codex orchestration prompt

## Required guardrails
### 1) Canonical routes are mandatory
Every IB object that can appear in a queue, dashboard card, notification, or drilldown must have a canonical route or an explicit documented fallback.

### 2) The document system wins
IB mode should continue moving toward `CurriculumDocument` as the source of truth. Do not add new IB functionality that depends primarily on legacy plan objects.

### 3) Keep admin/coordinator work exception-first
Do not regress into giant spreadsheet views with little prioritization. Review and governance surfaces should prioritize “what needs action now.”

### 4) Keep teacher work low-friction
Evidence, publishing, and studio work should continue reducing click count and uncertainty. Avoid Toddle-style friction and ManageBac-style clutter.

### 5) Make rollout state visible
Pack version, feature-flag readiness, route readiness, migration drift, and queue health should be inspectable by admins/coordinators. Hidden operational state is a liability.

### 6) No silent migration magic
Backfills and migrations must be auditable and idempotent. Records needing manual review must be visible.

### 7) Respect school scoping and permissions
Phase 5 is not allowed to bypass the school-scoping and role-boundary work from earlier phases.

## Suggested feature flags to verify or introduce
- `ib_pack_v2`
- `ib_pack_v2_workflows`
- `ib_programme_settings_v1`
- `ib_teacher_console_v1`
- `ib_operations_center_v1`
- `ib_evidence_subsystem_v1`
- `ib_family_publishing_v1`
- `ib_guardian_calm_mode_v1`
- `ib_standards_practices_live_v1`
- `ib_documents_only_v1`
- any new Phase 5 readiness/rollout flags added by Tasks 72, 78, or 97

## Definition of done for Phase 5
Before considering the IB side pilot-ready:
- canonical IB routes physically exist and deep links are stable
- the active IB pack is promoted, visible, and pinned correctly
- programme settings and rollout/governance consoles are real
- standards packet export produces real artifacts with history
- evidence/publishing operations are reliable and auditable
- IB mode can run on the document system without falling back to legacy planning paths
- telemetry and readiness consoles exist
- there is a documented go/no-go process backed by E2E and operational checks

## Stop signal after this pack
After Task 97 and Task 98 are complete, do **not** immediately create another giant broad IB pack in the same Codex session.

The next likely options after Phase 5 should be chosen deliberately based on pilot-readiness findings:
1. **Pilot feedback and hardening pack**
2. **District / multi-school IB rollout pack**
3. **Cross-curriculum parity pack (American/British catch-up using shared primitives)**
4. **Standards & Practices deepening pack if evaluation workflows emerge as the main remaining gap**

## How Codex should execute
- Read this file first.
- Execute Tasks 65–97 sequentially.
- Use Task 98 as the audit proving that no major Phase 5 requirement was dropped.
- Use Task 99 to resume or hand off the work cleanly if the session resets.
