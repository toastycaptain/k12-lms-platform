# IB Phase 4 — MYP and DP Full-Stack Vertical Slices Master Execution

## Purpose
This pack executes the **next two IB vertical slices** after the operational substrate (Steps 1–8) and the first PYP vertical slice are complete. Its job is to turn the MYP and DP sides of the platform from “live enough to demo” into **daily-use operational systems** for teachers, coordinators, students, specialists/advisors, and families.

The pack is intentionally split into two slices:
- **Step 10 — MYP full-stack vertical slice**
- **Step 11 — DP full-stack vertical slice**

The MYP slice must prove that the product can run a real middle-years experience built around:
- subject-group unit planning
- key/related concepts
- global contexts
- statement of inquiry and inquiry questions
- criteria and ATL planning
- interdisciplinary planning
- projects and service-as-action
- coordinator coverage and risk oversight
- student and guardian visibility in a calm, useful form

The DP slice must prove that the product can run a real diploma experience built around:
- course maps and teaching operations
- internal assessments
- extended essay supervision
- TOK checkpoints and deliverables
- CAS experience/project/reflection/advisor review workflows
- coordinator/advisor risk and completion oversight
- student next-action systems
- family support summaries that are permission-safe and actually useful

## Read this pack as a continuation, not a restart
This pack assumes **Phase 3 is complete**. Codex should not re-open foundational debates already resolved in prior packs.

### Required preconditions
Before starting Task 42, the following should already be true in the repo:
- live IB route architecture exists and `/demo` links are gone
- the IB pack supports PYP/MYP/DP document types and workflows
- teacher console, operations center, evidence, family publishing, POI, interdisciplinary, DP core domain objects, standards/practices, and document-system cutover work are in place
- the PYP full-stack vertical slice is complete and green behind its flag

If any of those are not true, stop and reconcile Phase 3 first.

## Required execution order
Do not parallelize this pack blindly. The tasks are grouped so Codex can move with minimal rework.

### Step 10 — MYP full-stack vertical slice
1. **Tasks 42–51**
   - define slice scope and route model
   - bind MYP unit creation and subject-unit studio to real records
   - make concept/context/inquiry, criteria/ATL/assessment, interdisciplinary planning, projects, and service work end-to-end
   - complete coordinator, student, and guardian outcomes

### Step 11 — DP full-stack vertical slice
2. **Tasks 52–62**
   - define slice scope and route model
   - bind DP course-map and teaching workspaces to real records
   - make IA, EE, TOK, and CAS work end-to-end
   - complete coordinator, student, and guardian outcomes
   - verify telemetry, release criteria, and no-regression coverage across PYP + MYP + DP

### Wrap-up
3. **Tasks 63–64**
   - coverage audit
   - orchestration prompt / resume prompt

## Global product guardrails
Every task in this pack must respect these rules.

### 1) Do not regress into Toddle-style friction
For both MYP and DP, common teacher actions must be faster than competitors:
- fewer clicks to open the right record
- no dead-end drilldowns
- no repeated form filling across similar objects
- no hidden required steps
- no forcing users through generic jargon when a programme-native launch path exists

### 2) Do not regress into ManageBac-style clutter
Coordinator/admin and teacher surfaces must remain:
- exception-first
- next-action-oriented
- route-consistent
- visually prioritized
- digestible on laptops without sprawling form fatigue

### 3) MYP and DP are not the same product mode
Do not flatten them into one “secondary IB planner.”
- MYP must preserve concept/context/criteria/ATL and interdisciplinary logic.
- DP must preserve serious operational treatment of IA, EE, TOK, and CAS.

### 4) Keep shared primitives shared
Even though this pack is highly IB-specific, keep platform primitives curriculum-neutral wherever practical:
- document/version infrastructure
- feed/event systems
- comments/presence/review notes
- evidence primitives
- workflow execution
- family publishing primitives

IB-specific behaviour should continue to live through pack definitions, document types, routes, and feature modules.

### 5) Every visible state must be persisted or derivable on the backend
No frontend-only pseudo-states for:
- risk
- readiness
- awaiting advisor/coordinator
- project milestone completion
- service approval
- authenticity / reflection completion
- guardian visibility

## Current codebase assumptions and anchors
This pack assumes the repo already contains or has been modified by Phase 3 outputs around:
- `CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, link/relationship models
- pack-driven workflows and framework bindings
- IB workspace routes under `apps/web/src/app/ib/*`
- feature modules under `apps/web/src/features/ib/*`
- evidence, family publishing, coordinator operations, POI/exhibition, MYP interdisciplinary/project/service, DP core/risk, standards/practices, and PYP slice outputs
- the IB curriculum pack file at `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or its successor version

## Recommended feature flags
Continue the umbrella strategy from Phase 3 and add or use the following:
- `ib_myp_vertical_slice_v1`
- `ib_myp_interdisciplinary_slice_v1`
- `ib_myp_projects_slice_v1`
- `ib_myp_service_slice_v1`
- `ib_dp_vertical_slice_v1`
- `ib_dp_ia_slice_v1`
- `ib_dp_ee_slice_v1`
- `ib_dp_tok_slice_v1`
- `ib_dp_cas_slice_v1`

The DP/MYP slices can still roll up under a single tenant-facing “IB Phase 4” enablement switch, but keep sub-flags available for safe rollout and selective debugging.

## Definition of done for Step 10 — MYP slice
Before Task 52 begins, the following must be true:
- real MYP subject-unit routes, launchers, and studio flows exist
- concept/context/statement-of-inquiry and inquiry-question data is live
- criteria/ATL/assessment planning is persisted and reviewable
- interdisciplinary unit relationships and co-planning are operational
- project and service-as-action flows are operational enough for real tracking
- coordinator operations surfaces show live MYP coverage and risk
- student and guardian views are live, scoped, and calm

## Definition of done for Step 11 — DP slice
Before Task 63 begins, the following must be true:
- real DP course-map and teaching workspaces exist on live data
- IA, EE, TOK, and CAS are operational from teacher/advisor/coordinator/student perspectives
- coordinator and advisor risk dashboards reflect real workflow state and due-date pressure
- student next-action systems are live and understandable
- guardian/family support surfaces are live and permission-safe
- telemetry, QA, release-gate, and no-regression checks cover all three IB programmes

## Stop signal after this pack
After Tasks 42–62 are complete and Task 63 is audited:
- **do not immediately improvise another giant IB pack in the same Codex run**
- the next work should be chosen deliberately based on what these slices reveal

The likely next options after this pack are:
1. whole-continuum IB hardening and release polish
2. standards/practices + evaluation/evidence export deepening
3. cross-programme analytics and district-scale rollout refinement
4. then only after IB stabilizes further, carry the strongest shared primitives back into American/British parity work

## Files in this pack
- Task **42–51** = Step 10 (MYP full-stack vertical slice)
- Task **52–62** = Step 11 (DP full-stack vertical slice)
- Task **63** = coverage matrix and post-slice signal
- Task **64** = Codex orchestration prompt / resume prompt

## How Codex should execute
- Read this file first.
- Execute Tasks 42–62 in order.
- Use Task 63 as the audit proving that no part of the MYP/DP vertical-slice plan was dropped.
- Use Task 64 if the Codex session needs to be resumed, handed off, or re-anchored.
