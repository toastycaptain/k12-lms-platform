# Phase 6 — IB pilot launch, adoption, hardening, and platform extraction

## What this phase is for

This phase starts **after** the IB vertical slices and Phase 5 productionization/governance work are complete. The product now needs to prove it can be adopted by real schools with low operational pain, predictable rollout mechanics, safe import pathways, deterministic jobs/notifications, measurable teacher/coordinator friction, and a clear path to reusable shared modules for future American and British maturity work.

This phase is **not** a new big wave of PYP/MYP/DP feature invention.

It is a **full-stack operationalisation and launch-readiness phase** focused on:

1. build integrity and release discipline
2. pilot-school setup and rollout tooling
3. import/migration architecture
4. end-to-end behavioural reliability
5. jobs/notifications/export hardening
6. in-product implementation support
7. friction analytics
8. mobile quick-action parity
9. document-system consolidation
10. cross-curriculum extraction planning and shared-module hardening

## Read this pack in order

- Read this file first.
- Execute **100 → 149** in strict order unless a task explicitly says a narrow part may run in parallel.
- Use **150_COVERAGE_MATRIX_AND_POST_PHASE6_SIGNAL.md** as the audit file.
- Use **151_CODEX_ORCHESTRATION_PROMPT.md** to start or resume Codex sessions cleanly.

## Global execution rules

1. **Prefer real systems over new mocks.**  
   If a task touches an existing IB surface, bind it to the real document/evidence/queue/export/readiness systems already in the repo.

2. **Do not start a new feature wave disguised as hardening.**  
   This phase is about launchability, operability, reliability, and reuse.

3. **Preserve the active IB pack/runtime contract.**  
   Do not casually create a new IB pack version unless a task proves it is necessary. Prefer operationalising the strongest current pack baseline.

4. **Keep shared layers pack-neutral when the task says to.**  
   If extracting shared modules, preserve IB-specific behaviour through adapters/configuration rather than hardcoded branching.

5. **Do not bypass school/tenant permissions.**  
   All setup, readiness, import, export, replay, or support actions must honour scoping and leave audit trails.

6. **Every major mutation path needs tests.**  
   Request specs, service specs, Vitest, and/or Playwright must be added where the task calls for them. Do not ship critical operator mutations with no verification.

7. **Avoid silent state.**  
   Background jobs, imports, exports, retries, publish decisions, and readiness evaluations should expose enough visible status for operators.

8. **Optimise for future pilot support.**  
   Every operational feature should answer: how would a school admin, coordinator, or support engineer understand and recover from this?

## Required completion evidence for every task

Each task should leave behind:

- code changes
- tests
- updated docs/runbooks when operational behaviour changes
- enough UI/API observability to prove the task works
- a short completion note in the PR/commit message summarising what changed and any residual risk

## Phase grouping and execution ranges

### Step 1 — Build integrity and release discipline
- 100 repo worktree integrity and export reliability
- 101 CI baseline and test failure triage
- 102 release candidate gates and deployment checklist
- 103 IB pack freeze, feature-flag bundle, and pilot baseline tagging
- 104 rollback, recovery, and release operations

### Step 2 — Real pilot-school enablement
- 105 pilot setup domain model and status engine
- 106 pilot setup backend APIs and validations
- 107 pilot setup wizard frontend and task flow
- 108 pilot readiness checklist and blockers engine
- 109 rollout playbook, support tooling, and admin runbooks

### Step 3 — Migration and import tooling
- 110 import architecture and staging pipeline
- 111 CSV/XLSX parser library and source mappers
- 112 import mapping UI and entity resolution
- 113 dry-run validation, conflict reporting, and rollback
- 114 IB domain importers for POI, documents, and operational records
- 115 import telemetry, audit, and admin operations

### Step 4 — True end-to-end IB workflow testing
- 116 Playwright e2e infrastructure, auth, and fixtures
- 117 PYP e2e workflows
- 118 MYP e2e workflows
- 119 DP e2e workflows
- 120 coordinator, guardian, and failure-path e2e coverage

### Step 5 — Background-job and notification hardening
- 121 job inventory, queue topology, and idempotency rules
- 122 publishing queue, digest scheduler, and retry hardening
- 123 standards packet export pipeline and audit hardening
- 124 notification fan-out, preferences, and deduplication
- 125 failed-job operations console and replay controls

### Step 6 — Implementation support as product surface
- 126 onboarding information architecture and content model
- 127 contextual empty states, checklists, and guided setup UI
- 128 starter templates, sample data, and sandbox school
- 129 inline help, progressive disclosure, and training analytics

### Step 7 — Operational analytics for friction
- 130 analytics event taxonomy and instrumentation contract
- 131 teacher friction metrics and dashboards
- 132 coordinator and admin operations analytics
- 133 latency, abandonment, and queue health analytics
- 134 pilot success scorecard and review cadence

### Step 8 — Mobile and quick-action parity
- 135 mobile priority matrix and responsive baseline
- 136 teacher mobile quick actions for evidence and publishing
- 137 coordinator, specialist, and advisor mobile triage
- 138 offline, resume, optimistic UI, and recovery patterns
- 139 mobile QA, accessibility, and performance budgets

### Step 9 — Document-system consolidation
- 140 legacy IB path inventory and consolidation plan
- 141 backend document-system unification and route normalization
- 142 frontend IB route redirects and editor-shell consolidation
- 143 data backfill migrations and consistency guards
- 144 deprecation cleanup, observability, and removal gates

### Step 10 — Cross-curriculum extraction after pilot hardening
- 145 shared platform primitive inventory and extraction design
- 146 governance, evidence, and readiness module extraction
- 147 pack-neutral contracts and curriculum adapters
- 148 cross-curriculum QA matrix and readiness criteria
- 149 post-Phase 6 platformization and next-phase signal

## Recommended commit/checkpoint rhythm

Do not wait until the end of the phase to see whether work holds together.

Use at least these checkpoints:

- after 104: release baseline checkpoint
- after 109: pilot setup/readiness checkpoint
- after 115: import pipeline checkpoint
- after 120: e2e reliability checkpoint
- after 125: jobs/notifications checkpoint
- after 134: analytics + support checkpoint
- after 144: consolidation checkpoint
- after 149: phase closeout checkpoint

## Phase 6 exit criteria

Phase 6 is complete when:

- the repo/export/build baseline is trustworthy
- a pilot school can be enabled through product flows, not tribal engineering knowledge
- schools can import staged data safely through preview/review/rollback-aware tooling
- core PYP/MYP/DP and coordinator/guardian workflows are covered by e2e tests
- publishing, export, notification, and retry behaviour are deterministic and observable
- onboarding/support surfaces reduce first-run friction
- teacher/coordinator friction is measurable and reported
- mobile quick actions are viable on the highest-value tasks
- IB relies on the document system as the authoritative architecture
- extracted shared modules and contracts are ready to support future non-IB phases

## Explicit non-goals for this phase

- building a fresh wave of net-new IB programme surfaces
- full American or British maturity implementation
- replacing every manual support process with a fully automated control plane
- perfect native-mobile parity for all planning studios
- abstract architecture that is not grounded in code already proven by the IB buildout
