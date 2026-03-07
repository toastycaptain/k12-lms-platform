# Phase 6 coverage matrix and post-Phase 6 signal

Use this file as the audit document for the Phase 6 task pack. It maps each major next-step area to the smaller execution files so no part of the plan is lost.

## Step 1 — Lock down build integrity and release discipline

**Phase goal:** Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

**Covered by tasks:**

- **100** `100_REPO_WORKTREE_INTEGRITY_AND_EXPORT_RELIABILITY.md` — Audit the repository state, eliminate missing-file/export drift, and make archive/export behaviour predictable so future Codex phases start from a trustworthy source tree.
- **101** `101_CI_BASELINE_AND_TEST_FAILURE_TRIAGE.md` — Establish a truthful green-or-red baseline across web, core, AI gateway, and IB e2e layers, then remove flaky or hidden failures before declaring a pilot candidate.
- **102** `102_RELEASE_CANDIDATE_GATES_AND_DEPLOYMENT_CHECKLIST.md` — Define a formal IB pilot release gate with required checks, migration sequencing, feature-flag expectations, background job readiness, and deployment validation steps.
- **103** `103_IB_PACK_FREEZE_FEATURE_FLAG_BUNDLE_AND_PILOT_BASELINE_TAGGING.md` — Freeze the active IB runtime contract for pilot tenants by pinning pack versions, defining a coherent feature-flag bundle, and tagging a baseline release state.
- **104** `104_ROLLBACK_RECOVERY_AND_RELEASE_OPERATIONS.md` — Design and implement the rollback/recovery mechanics required to back out a pilot release safely if a migration, export job, publishing operation, or route rollout misbehaves.

**What this step ensures by the end of Phase 6:**

- the repo/export process is trustworthy
- there is a green-or-explicitly-quarantined baseline
- IB pilot release criteria and rollback paths are explicit
- the active IB pack/flag baseline is frozen for pilots

## Step 2 — Move into real pilot-school enablement

**Phase goal:** Convert pilot activation from an engineer-only set of commands into a governed product workflow for admins, coordinators, and support staff.

**Covered by tasks:**

- **105** `105_PILOT_SETUP_DOMAIN_MODEL_AND_STATUS_ENGINE.md` — Define the canonical data model and state machine for setting up an IB pilot school or programme so readiness and onboarding logic has one source of truth.
- **106** `106_PILOT_SETUP_BACKEND_APIS_AND_VALIDATIONS.md` — Expose the setup domain through safe, validated backend APIs that can drive a guided pilot setup wizard and live readiness console.
- **107** `107_PILOT_SETUP_WIZARD_FRONTEND_AND_TASK_FLOW.md` — Create the actual pilot setup wizard experience that guides admins/coordinators through prerequisite completion with minimal confusion and clear recovery when blocked.
- **108** `108_PILOT_READINESS_CHECKLIST_AND_BLOCKERS_ENGINE.md` — Turn readiness into a transparent rules engine with explicit blockers, warnings, health checks, and remediation links that can power consoles and release decisions.
- **109** `109_ROLLOUT_PLAYBOOK_SUPPORT_TOOLING_AND_ADMIN_RUNBOOKS.md` — Package pilot enablement into operator-grade runbooks and support tools so the platform can be rolled out predictably by admins, coordinators, and internal support staff.

**What this step ensures by the end of Phase 6:**

- pilot schools can be set up through governed product flows
- readiness and blockers are computed and visible
- admins/support have rollout runbooks and support tools

## Step 3 — Build migration and import tooling

**Phase goal:** Provide safe, previewable, auditable import pathways so pilot schools can bring in programme structures and historical planning data without starting from zero.

**Covered by tasks:**

- **110** `110_IMPORT_ARCHITECTURE_AND_STAGING_PIPELINE.md` — Create the backend architecture for imports as staged, reviewable operations rather than one-off scripts that mutate live data directly.
- **111** `111_CSV_XLSX_PARSER_LIBRARY_AND_SOURCE_MAPPERS.md` — Build the file ingestion layer for spreadsheet-based imports, including parser abstraction, source-type adapters, and normalised row representations.
- **112** `112_IMPORT_MAPPING_UI_AND_ENTITY_RESOLUTION.md` — Give admins a controlled UI for mapping imported rows to schools, users, planning contexts, document types, and existing records before execution.
- **113** `113_DRY_RUN_VALIDATION_CONFLICT_REPORTING_AND_ROLLBACK.md` — Implement the safety layer that previews import outcomes, reports conflicts precisely, and provides rollback semantics for executed imports.
- **114** `114_IB_DOMAIN_IMPORTERS_FOR_POI_DOCUMENTS_AND_OPERATIONAL_RECORDS.md` — Build the actual domain-specific import executors for the highest-value IB entities, using the staged import pipeline and respecting pack/version/workflow rules.
- **115** `115_IMPORT_TELEMETRY_AUDIT_AND_ADMIN_OPERATIONS.md` — Make imports observable and operable in production with telemetry, audit logs, status dashboards, and support controls.

**What this step ensures by the end of Phase 6:**

- schools can stage, map, validate, dry-run, and execute imports safely
- imports create meaningful IB entities using the live document system
- import operations are observable and auditable

## Step 4 — Add true end-to-end IB workflow testing

**Phase goal:** Exercise real programme workflows across the web app and API so pilot readiness is verified by behavioural tests, not just isolated component/spec coverage.

**Covered by tasks:**

- **116** `116_PLAYWRIGHT_E2E_INFRASTRUCTURE_AUTH_AND_FIXTURES.md` — Strengthen the e2e foundation so IB workflow suites run deterministically with stable auth, seeded data, and environment setup.
- **117** `117_PYP_END_TO_END_WORKFLOWS.md` — Cover the highest-value PYP behaviours end to end so teacher, coordinator, and family flows are protected against regression.
- **118** `118_MYP_END_TO_END_WORKFLOWS.md` — Protect the MYP teacher/coordinator slice with full-stack behavioural tests that cover concept/context, criteria, interdisciplinary, and project/service pathways.
- **119** `119_DP_END_TO_END_WORKFLOWS.md` — Exercise the most operationally sensitive DP flows—course maps, IA checkpoints, TOK/EE/CAS records, and coordinator risk views—through end-to-end tests.
- **120** `120_COORDINATOR_GUARDIAN_AND_FAILURE_PATH_END_TO_END_COVERAGE.md` — Round out the pilot suite with cross-cutting coordinator/admin/guardian flows and explicit failure-path tests for exports, queues, readiness, and permissions.

**What this step ensures by the end of Phase 6:**

- core PYP/MYP/DP/coordinator/guardian workflows are protected end to end
- pilot regressions are more likely to be caught before users encounter them

## Step 5 — Harden the background-job and notification layer

**Phase goal:** Make publishing, digest scheduling, exports, and notifications deterministic, idempotent, observable, and recoverable.

**Covered by tasks:**

- **121** `121_JOB_INVENTORY_QUEUE_TOPOLOGY_AND_IDEMPOTENCY_RULES.md` — Map every IB-relevant background operation, define queue topology and retry semantics, and harden each path with explicit idempotency expectations.
- **122** `122_PUBLISHING_QUEUE_DIGEST_SCHEDULER_AND_RETRY_HARDENING.md` — Make family publishing and digest scheduling reliable, inspectable, and safe to retry under load or partial failure.
- **123** `123_STANDARDS_PACKET_EXPORT_PIPELINE_AND_AUDIT_HARDENING.md` — Turn standards packet export into a dependable production pipeline with real artifacts, queue status, snapshotting, and audit coverage.
- **124** `124_NOTIFICATION_FAN_OUT_PREFERENCES_AND_DEDUPLICATION.md` — Make notification delivery coherent across roles by respecting preferences, deduplicating overlapping events, and clarifying why users were notified.
- **125** `125_FAILED_JOB_OPERATIONS_CONSOLE_AND_REPLAY_CONTROLS.md` — Expose background failure state and safe replay/recovery actions through admin/coordinator tooling so pilot operations do not depend on shell access.

**What this step ensures by the end of Phase 6:**

- publishing, digests, exports, notifications, and retries are deterministic
- failed background operations are visible and recoverable

## Step 6 — Make implementation support a real product surface

**Phase goal:** Reduce training burden through in-product guidance, templates, checklists, and sandboxed starter content.

**Covered by tasks:**

- **126** `126_ONBOARDING_INFORMATION_ARCHITECTURE_AND_CONTENT_MODEL.md` — Design the information architecture for in-product implementation support so guidance, checklists, templates, and help content are consistent and reusable.
- **127** `127_CONTEXTUAL_EMPTY_STATES_CHECKLISTS_AND_GUIDED_SETUP_UI.md` — Turn high-friction empty or partially-configured pages into guided experiences that tell users what to do next and why it matters.
- **128** `128_STARTER_TEMPLATES_SAMPLE_DATA_AND_SANDBOX_SCHOOL.md` — Provide safe starter content and a sandbox mode that help schools understand the product before they commit live data.
- **129** `129_INLINE_HELP_PROGRESSIVE_DISCLOSURE_AND_TRAINING_ANALYTICS.md` — Deliver help where it is needed most and measure whether support content actually reduces friction instead of becoming another ignored layer.

**What this step ensures by the end of Phase 6:**

- onboarding friction is reduced through product surfaces
- sample content and sandboxing support first-run evaluation
- help/checklists/empty states actively guide users

## Step 7 — Add operational analytics that measure teacher friction

**Phase goal:** Measure whether the IB workflows are materially easier to use by instrumenting time, steps, drop-offs, queue health, and turnaround times.

**Covered by tasks:**

- **130** `130_ANALYTICS_EVENT_TAXONOMY_AND_INSTRUMENTATION_CONTRACT.md` — Create the shared event model and instrumentation contract needed to measure IB workflow friction consistently across frontend and backend.
- **131** `131_TEACHER_FRICTION_METRICS_AND_DASHBOARDS.md` — Measure teacher effort across the most important IB workflows so the team can prove lower friction and target the worst bottlenecks.
- **132** `132_COORDINATOR_AND_ADMIN_OPERATIONS_ANALYTICS.md` — Instrument and visualise the operational health of approvals, readiness, publishing, standards packets, and review governance for coordinator/admin users.
- **133** `133_LATENCY_ABANDONMENT_AND_QUEUE_HEALTH_ANALYTICS.md` — Add the system-level metrics that reveal hidden UX or operational pain: slow pages, abandoned workflows, and unhealthy asynchronous backlogs.
- **134** `134_PILOT_SUCCESS_SCORECARD_AND_REVIEW_CADENCE.md` — Translate instrumentation into an operational scorecard and regular review process that guides decisions during the pilot period.

**What this step ensures by the end of Phase 6:**

- teacher and coordinator friction are measurable
- latency/abandonment/backlog data informs support and product work
- pilot success has an explicit scorecard and review cadence

## Step 8 — Expand mobile and quick-action parity

**Phase goal:** Make the two-minute teacher/coordinator/specialist actions excellent on mobile and small screens without over-promising full desktop parity.

**Covered by tasks:**

- **135** `135_MOBILE_PRIORITY_MATRIX_AND_RESPONSIVE_BASELINE.md` — Define exactly which IB tasks must work well on mobile/tablet and establish a responsive baseline across those surfaces.
- **136** `136_TEACHER_MOBILE_QUICK_ACTIONS_FOR_EVIDENCE_AND_PUBLISHING.md` — Make the most common teacher mobile tasks—evidence triage, reflection requests, family publishing decisions—fast, reliable, and easy to complete in two minutes.
- **137** `137_COORDINATOR_SPECIALIST_AND_ADVISOR_MOBILE_TRIAGE.md` — Support the high-value mobile triage actions for non-teacher roles: approvals, exception review, specialist contribution, and advisor follow-up.
- **138** `138_OFFLINE_RESUME_OPTIMISTIC_UI_AND_RECOVERY_PATTERNS.md` — Make mobile and intermittent-network usage trustworthy by standardising draft persistence, optimistic updates, pending state, retry, and recovery UX patterns.
- **139** `139_MOBILE_QA_ACCESSIBILITY_AND_PERFORMANCE_BUDGETS.md` — Define and enforce quality bars for mobile/responsive IB experiences so quick-action parity does not regress once shipped.

**What this step ensures by the end of Phase 6:**

- mobile quick actions are intentionally prioritised and improved
- offline/resume/retry behaviour is clearer on mobile
- responsive quality bars are documented and testable

## Step 9 — Complete the document-system consolidation

**Phase goal:** Finish converging IB workflows onto CurriculumDocument, CurriculumDocumentVersion, PlanningContext, and IB operational models so the IB side has one authoritative architecture.

**Covered by tasks:**

- **140** `140_LEGACY_IB_PATH_INVENTORY_AND_CONSOLIDATION_PLAN.md` — Identify every remaining place where IB mode still depends on older planning paths, generic surfaces, or duplicated logic so consolidation can be executed safely.
- **141** `141_BACKEND_DOCUMENT_SYSTEM_UNIFICATION_AND_ROUTE_NORMALIZATION.md` — Finish the backend convergence so IB workflows resolve through `CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, and canonical route helpers/services.
- **142** `142_FRONTEND_IB_ROUTE_REDIRECTS_AND_EDITOR_SHELL_CONSOLIDATION.md` — Complete the frontend convergence so IB users stay inside IB-native shells while the underlying editor and fetch logic reuses shared document primitives cleanly.
- **143** `143_DATA_BACKFILL_MIGRATIONS_AND_CONSISTENCY_GUARDS.md` — Backfill or normalise historical IB records so document-system consolidation is reflected in real data, not just in new-record code paths.
- **144** `144_DEPRECATION_CLEANUP_OBSERVABILITY_AND_REMOVAL_GATES.md` — Finalize consolidation by adding observability around deprecated paths and defining explicit removal gates before legacy IB code is deleted.

**What this step ensures by the end of Phase 6:**

- IB relies on the document system as the authoritative architecture
- legacy paths are inventoried, redirected/backfilled, and prepared for removal

## Step 10 — Shift to cross-curriculum extraction after pilot hardening

**Phase goal:** Identify and extract the platform primitives proven by IB so the next American/British maturity phases reuse strong shared modules instead of copying IB code.

**Covered by tasks:**

- **145** `145_SHARED_PLATFORM_PRIMITIVE_INVENTORY_AND_EXTRACTION_DESIGN.md` — Catalogue which strong modules emerged from the IB buildout and design how to extract them into pack-neutral platform primitives without starting the next curriculum wave yet.
- **146** `146_GOVERNANCE_EVIDENCE_AND_READINESS_MODULE_EXTRACTION.md` — Extract the most obviously reusable operational modules—governance, evidence/publishing infrastructure, and readiness engines—into cleaner shared seams.
- **147** `147_PACK_NEUTRAL_CONTRACTS_AND_CURRICULUM_ADAPTERS.md` — Formalise the contracts and adapter seams that let shared modules behave differently for IB, American, and British packs without hardcoded branching.
- **148** `148_CROSS_CURRICULUM_QA_MATRIX_AND_READINESS_CRITERIA.md` — Define how the newly extracted shared modules will be validated for reuse in future curricula without confusing this phase with a full American/British buildout.
- **149** `149_POST_PHASE_6_PLATFORMIZATION_AND_NEXT_PHASE_SIGNAL.md` — Close Phase 6 by documenting what was accomplished, what remains for live pilot feedback, and how the next American/British maturity phases should begin from the extracted platform base.

**What this step ensures by the end of Phase 6:**

- shared modules proven by IB are identified and partially extracted
- pack-neutral contracts are clarified for future American/British work
- Phase 6 closes with a clear next-phase signal instead of scope creep

## Post-Phase 6 signal

Phase 6 should end with the IB side in a state where a real pilot can be launched, supported, measured, and hardened.

The **next likely phase after this one is not another giant IB feature wave**. It should be:

1. **live pilot feedback loop**
   - collect school/operator feedback
   - tune workflow friction, performance, support copy, and import edge cases
   - refine dashboards and operations based on actual usage

2. **American and British maturity phases**
   - start from the shared primitives extracted in Tasks 145–148
   - reuse setup/readiness, governance, evidence/publishing, analytics, and mobile quick-action infrastructure
   - build curriculum-specific expressions on top of pack-neutral contracts rather than copying IB code

Do **not** start those phases inside Phase 6 except where Task 145–149 explicitly prepare the platform boundaries for them.
