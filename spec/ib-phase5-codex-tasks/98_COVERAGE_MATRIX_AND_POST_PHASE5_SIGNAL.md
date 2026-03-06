# Coverage Matrix — IB Phase 5 Pack

## Purpose
This file proves that the Phase 5 productionization/governance/pilot-readiness plan was fully expanded into executable Codex tasks and that no material detail from the Phase 5 recommendation was dropped.

## Step 1 — Materialize the canonical IB route tree

### Task 65 — Route Tree Audit and Canonical URL Contract
- `65_IB_PHASE5_ROUTE_TREE_AUDIT_AND_CANONICAL_URL_CONTRACT.md`

**Covered details:**
- A canonical route inventory document checked into the repo under spec/ or docs/ that lists every IB route, the entity it resolves, the required permissions, and the target React/Next page file.
- A route registry module on the frontend that no longer depends on hand-written demo links or ad-hoc href strings embedded in cards.
- A parity checklist between the backend `Ib::Support::RouteBuilder` and the frontend route registry so future drift can be detected.
- A list of deprecated or placeholder `/demo` and hash-anchor destinations that must be removed or redirected in later tasks.

### Task 66 — Shared IB Page Shell, Route Params, and Breadcrumb Contract
- `66_IB_PHASE5_SHARED_IB_PAGE_SHELL_PARAMS_AND_BREADCRUMB_CONTRACT.md`

**Covered details:**
- A shared IB page shell component system under `apps/web/src/features/ib/layout/` or equivalent.
- Route-param utilities for document routes, operational record routes, standards packet routes, and evidence/story routes.
- Common breadcrumb builders and fallback cards for not-found, forbidden, school mismatch, archived record, and feature-disabled states.
- A clear convention for how page-level components receive entity IDs and how they render skeleton, empty, loading, and degraded states.

### Task 67 — PYP Route Materialization and Real Record Pages
- `67_IB_PHASE5_PYP_ROUTE_MATERIALIZATION_AND_REAL_RECORD_PAGES.md`

**Covered details:**
- Real page files for `/ib/pyp/poi`, `/ib/pyp/units/[unitId]`, `/ib/pyp/units/new`, and `/ib/pyp/exhibition`.
- Page wiring that loads real records, renders the correct shell, and supports direct bookmarking and queue navigation.
- Create/open flows that land on actual pages rather than generic `/plan` pages or mock cards.

### Task 68 — MYP Route Materialization and Real Record Pages
- `68_IB_PHASE5_MYP_ROUTE_MATERIALIZATION_AND_REAL_RECORD_PAGES.md`

**Covered details:**
- Real page files for `/ib/myp/units/[unitId]`, `/ib/myp/units/new`, `/ib/myp/interdisciplinary/[id]`, `/ib/myp/projects/[id]`, `/ib/myp/service/[id]`, `/ib/myp/coverage`, `/ib/myp/review`.
- Direct-open support from coordinator queues, student actions, and service/project records.

### Task 69 — DP Route Materialization and Real Record Pages
- `69_IB_PHASE5_DP_ROUTE_MATERIALIZATION_AND_REAL_RECORD_PAGES.md`

**Covered details:**
- Real page files for `/ib/dp/course-maps/[id]`, `/ib/dp/course-maps/new`, `/ib/dp/internal-assessments/[id]`, `/ib/dp/ee/[id]`, `/ib/dp/tok/[id]`, `/ib/dp/cas/records/[id]`, `/ib/dp/coordinator`.
- Deep-link-safe page loading for student/advisor/coordinator access patterns.

### Task 70 — Backend Route Resolution, Entity Lookups, and Safe Redirects
- `70_IB_PHASE5_BACKEND_ROUTE_RESOLUTION_AND_SAFE_REDIRECTS.md`

**Covered details:**
- A lightweight route-resolution API that can accept an entity reference and return the canonical href, route ID, access status, fallback target, and display label.
- Server-side safe redirect logic or redirect metadata for stale/deprecated routes and legacy `/demo` routes.

### Task 71 — Queue Deep-Link Harmonization and Entity Resolution
- `71_IB_PHASE5_QUEUE_DEEPLINK_HARMONIZATION_AND_ENTITY_RESOLUTION.md`

**Covered details:**
- A single queue-link item shape shared by frontend data adapters and backend serializers.
- Migration of queue cards from raw href strings to typed entity refs + canonical route IDs.

## Step 2 — Promote and operationalize the active IB pack

### Task 72 — IB Pack Promotion, Default Selection, and Feature Flag Alignment
- `72_IB_PHASE5_IB_PACK_PROMOTION_DEFAULT_SELECTION_AND_FLAGS.md`

**Covered details:**
- A documented activation plan for `ib_continuum_v1@2026.2` as the canonical pack for IB mode.
- Feature flag changes or defaults necessary for Phase 5 to function safely.
- Tenant/school-level checks that prevent mixed old/new IB pack behavior without explicit migration handling.

### Task 73 — Pack Pinning, Schema Visibility, and Serializer Upgrades
- `73_IB_PHASE5_PACK_PINNING_SCHEMA_VISIBILITY_AND_SERIALIZER_UPGRADES.md`

**Covered details:**
- Serializer fields exposing pack key, pack version, schema key, workflow key/state, and migration status wherever IB studios and queues need them.
- UI treatments showing pack/schema/workflow metadata in page headers and admin readouts without cluttering teacher workflows.

### Task 74 — IB Pack Migration Backfills and Drift Audit
- `74_IB_PHASE5_IB_PACK_MIGRATION_BACKFILLS_AND_DRIFT_AUDIT.md`

**Covered details:**
- A migration audit report checked into `docs/` or `spec/` describing counts of IB documents/records by pack version and schema key.
- Idempotent backfill jobs or rake tasks that upgrade metadata/pinning where safe.
- Explicit lists of records that require manual review rather than unsafe automated mutation.

### Task 75 — Document Type / Workflow Hygiene and Create-Flow Alignment
- `75_IB_PHASE5_DOCUMENT_TYPE_WORKFLOW_HYGIENE_AND_CREATE_FLOW_ALIGNMENT.md`

**Covered details:**
- A verified matrix of IB document types -> schema keys -> workflows -> canonical routes -> allowed create contexts.
- Create-flow updates so every IB creation path launches the correct document type and lands on the correct route.

## Step 3 — Build the real IB admin/coordinator governance layer

### Task 76 — Programme Settings Backend Domain Expansion
- `76_IB_PHASE5_PROGRAMME_SETTINGS_BACKEND_DOMAIN_EXPANSION.md`

**Covered details:**
- Richer backend semantics for programme settings with validation, defaults, auditing, and school/programme scoping.
- APIs for reading/updating programme settings safely.

### Task 77 — Programme Settings Frontend Console
- `77_IB_PHASE5_PROGRAMME_SETTINGS_FRONTEND_CONSOLE.md`

**Covered details:**
- A real settings page or nested route under the IB coordinator/admin area for programme settings.
- Forms for cadence, review owners, thresholds, and defaults with validation and change confirmation.

### Task 78 — Rollout Console Backend Aggregations
- `78_IB_PHASE5_ROLLOUT_CONSOLE_BACKEND_AGGREGATIONS.md`

**Covered details:**
- One or more aggregation endpoints for the rollout console.
- Health/coverage metrics around pack adoption, feature flags, route completeness, school scoping, and legacy usage.

### Task 79 — Rollout Console Frontend and Adoption Visibility
- `79_IB_PHASE5_ROLLOUT_CONSOLE_FRONTEND_AND_ADOPTION_VISIBILITY.md`

**Covered details:**
- A dedicated rollout/governance page under the IB admin/coordinator area.
- Panels showing feature flags, active pack, migration drift, academic year readiness, route completeness, and settings completeness.

### Task 80 — Review Governance Backend Queues, SLA, and Exception Logic
- `80_IB_PHASE5_REVIEW_GOVERNANCE_BACKEND_QUEUES_SLA_AND_EXCEPTION_LOGIC.md`

**Covered details:**
- Backend exception queues and summary metrics for coordinator review governance.
- Query filters by programme, school, workflow state, owner, reviewer, and SLA state.

### Task 81 — Review Governance Frontend Operations Views
- `81_IB_PHASE5_REVIEW_GOVERNANCE_FRONTEND_OPERATIONS_VIEWS.md`

**Covered details:**
- Operations views for approvals, moderation, returned-with-comments, orphaned records, and SLA breaches.
- Batch-oriented action affordances where safe (open next, assign owner, request follow-up, export list).

## Step 4 — Turn Standards & Practices into a real evaluation subsystem

### Task 82 — Standards & Practices Export Domain, Jobs, and Artifact Storage
- `82_IB_PHASE5_STANDARDS_EXPORT_DOMAIN_JOBS_AND_ARTIFACT_STORAGE.md`

**Covered details:**
- Actual export jobs for standards packets/cycles.
- Stored export artifacts and immutable evidence snapshots at export time.
- Version history and audit records for exports.

### Task 83 — Standards Packet APIs, Evidence Snapshots, Reviewer Assignment, and Scoring
- `83_IB_PHASE5_STANDARDS_PACKET_APIS_SNAPSHOTS_ASSIGNMENTS_AND_SCORING.md`

**Covered details:**
- Packet detail endpoints with items, snapshots, reviewer info, states, and export history.
- Cycle comparison payloads and packet completeness/evidence-strength scoring.

### Task 84 — Standards Frontend Packet Routes and Detail UI
- `84_IB_PHASE5_STANDARDS_FRONTEND_PACKET_ROUTES_AND_DETAIL_UI.md`

**Covered details:**
- Real routes such as `/ib/standards-practices`, `/ib/standards-practices/cycles/[cycleId]`, `/ib/standards-practices/packets/[packetId]` (adjusting for the canonical route contract from Task 65).
- Packet detail UI with evidence item drilldown, reviewer assignment, and export history.

### Task 85 — Standards Export Preview, Cycle Comparison, and Approval UX
- `85_IB_PHASE5_STANDARDS_EXPORT_PREVIEW_CYCLE_COMPARISON_AND_APPROVAL_UX.md`

**Covered details:**
- Preview-before-export UI, cycle comparison UI, approve/return actions, and reviewer assignment affordances.
- A clear path from 'gap/weak' to 'ready/approved/exported'.

## Step 5 — Productionize evidence, publishing, and notifications

### Task 86 — Evidence Indexing, Filters, Inbox Summaries, and Query APIs
- `86_IB_PHASE5_EVIDENCE_INDEXING_FILTERS_INBOX_SUMMARIES_AND_QUERY_APIS.md`

**Covered details:**
- Index and query improvements for evidence searches and inbox summaries.
- Backend endpoints that return evidence inbox summaries and filtered evidence lists for teacher/coordinator views.

### Task 87 — Publishing Jobs, Notifications, Digests, Idempotency, and Audits
- `87_IB_PHASE5_PUBLISHING_JOBS_NOTIFICATIONS_DIGESTS_IDEMPOTENCY_AND_AUDITS.md`

**Covered details:**
- Background jobs or service objects for publish-now, scheduled publish, digest generation, and hold/retry flows.
- Notification events and audit records covering publish decisions and outcomes.

### Task 88 — Teacher Inbox and Publishing Queue Operationalization
- `88_IB_PHASE5_TEACHER_INBOX_AND_PUBLISHING_QUEUE_OPERATIONALIZATION.md`

**Covered details:**
- Operational teacher inbox and publishing queue pages/components backed by real APIs.
- Batch actions, refresh behavior, failure states, and state transitions that feel trustworthy.

### Task 89 — Mobile Triage, Offline Resume, and 'Changed Since Last Visit'
- `89_IB_PHASE5_MOBILE_TRIAGE_OFFLINE_RESUME_AND_CHANGE_SINCE_LAST_VISIT.md`

**Covered details:**
- Reliable mutation queue behavior for mobile triage actions.
- 'Changed since last visit' support for queues and console cards using persisted seen-state logic.

## Step 6 — Migrate fully toward the IB document system

### Task 90 — Legacy IB Path Audit, Freeze Policy, and Migration Checklist
- `90_IB_PHASE5_LEGACY_IB_PATH_AUDIT_FREEZE_POLICY_AND_MIGRATION_CHECKLIST.md`

**Covered details:**
- A written audit of legacy IB touchpoints still present in the repo.
- A freeze policy that prohibits new IB feature work on legacy models/routes.
- A migration checklist tying each remaining legacy touchpoint to a cutover path.

### Task 91 — Backend Document Normalization and Backfills
- `91_IB_PHASE5_BACKEND_DOCUMENT_NORMALIZATION_AND_BACKFILLS.md`

**Covered details:**
- Backfills or data normalization scripts that ensure IB operational records, evidence, and stories are linked to the right documents/versions where possible.
- Cleaner backend lookup utilities and route hints based on normalized relationships.

### Task 92 — Frontend IB Route Consolidation Off Legacy Surfaces
- `92_IB_PHASE5_FRONTEND_IB_ROUTE_CONSOLIDATION_OFF_LEGACY_SURFACES.md`

**Covered details:**
- Removal or replacement of IB-facing links that still point at generic `/plan/documents/:id` or legacy pages.
- IB-native page wrappers around any remaining shared generic editor components.

### Task 93 — Editor / Workflow Unification and IB 'Documents Only' Mode
- `93_IB_PHASE5_EDITOR_WORKFLOW_UNIFICATION_AND_IB_DOCUMENTS_ONLY_MODE.md`

**Covered details:**
- A feature-flagged IB 'documents only' mode or equivalent behavior gate that routes all IB planning work through the document engine.
- Unified workflow/action behavior across IB detail pages and generic document operations.

## Step 7 — Add pilot telemetry, readiness reporting, and release controls

### Task 94 — Telemetry Event Taxonomy and Instrumentation
- `94_IB_PHASE5_TELEMETRY_EVENT_TAXONOMY_AND_INSTRUMENTATION.md`

**Covered details:**
- A telemetry taxonomy document plus instrumentation across backend and frontend for critical IB flows.
- Structured events for route hits, save times, transition failures, publish outcomes, export jobs, and pack mismatch detections.

### Task 95 — Pilot Readiness Backend Aggregations and Health Computation
- `95_IB_PHASE5_PILOT_READINESS_BACKEND_AGGREGATIONS_AND_HEALTH_COMPUTATION.md`

**Covered details:**
- Backend readiness endpoints or services that power the Pilot Readiness Console.
- Health scores or explicit readiness sections with transparent component metrics.

### Task 96 — Pilot Readiness Frontend Console and Admin/Coordinator Dashboards
- `96_IB_PHASE5_PILOT_READINESS_FRONTEND_CONSOLE_AND_ADMIN_DASHBOARDS.md`

**Covered details:**
- A pilot-readiness dashboard with route readiness, pack/flag readiness, settings health, queue health, standards/export readiness, publishing reliability, and document migration readiness.
- Admin and coordinator views that can drill into underlying issues.

### Task 97 — Release Controls, Flag Playbooks, E2E Gates, and Go/No-Go Criteria
- `97_IB_PHASE5_RELEASE_CONTROLS_FLAG_PLAYBOOKS_E2E_GATES_AND_GO_NO_GO.md`

**Covered details:**
- A rollout playbook document checked into the repo.
- E2E and regression suites tied to the canonical IB routes and queues.
- Explicit go/no-go criteria for pilot launch and rollback.

## What Phase 5 intentionally finishes
This pack intentionally finishes the transition from “the PYP/MYP/DP slices exist” to “the IB side is production-like enough to pilot safely.” It covers:
- canonical route materialization
- pack activation and schema/workflow visibility
- admin/coordinator governance
- standards/practices export and evaluation tooling
- evidence/publishing operational reliability
- migration toward the document system
- telemetry, readiness, and release controls

## What should happen after Phase 5
After Tasks 65–97 are complete and Task 98 is audited, the next work should be chosen based on the readiness console and pilot findings, not by instinct. The likely next packs are:
1. **IB Pilot Feedback and Hardening Pack**
   - real-school feedback loops
   - performance pain points
   - accessibility and mobile refinements
   - workflow simplification based on actual use
2. **IB Multi-School Rollout / District Governance Pack**
   - cross-school readiness
   - district-level analytics
   - pack/version governance at scale
3. **Cross-Curriculum Leverage Pack**
   - safely export the strongest Phase 5 primitives to American and British modes without making them IB-shaped

## Stop signal
Do not start another large undifferentiated IB feature pack until:
- the Phase 5 readiness console is green enough for the intended pilot scope
- the release controls and E2E gates are in place
- the team has reviewed the telemetry and migration drift surfaced by this pack
