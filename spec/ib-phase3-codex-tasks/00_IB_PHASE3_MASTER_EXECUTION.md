# IB Phase 3 — Full-Stack Operationalization Master Execution

## Purpose
This pack turns the IB side of the product from a polished programme-specific frontend into a **full-stack operational system**. The previous phases built the IB shell, PYP/MYP/DP workspaces, teacher and guardian experiences, and coordinator-facing product framing. This phase must make those surfaces **real, stateful, performant, and trustworthy**.

The immediate goals are:

- remove presentation-only and mock-driven behaviour from the IB experience
- bind IB screens to `CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, workflow, and framework services
- expand the IB curriculum pack so the data model can actually express the product we already designed
- create real teacher operations and coordinator operations layers
- make evidence, family publishing, POI, exhibition, interdisciplinary planning, and DP core operations work on live data
- make standards/practices evidence and exports work from real operational sources
- consolidate the planning stack around the generic document architecture for IB mode
- only after all of the above, build the first full-stack vertical slice: **PYP Unit → Evidence → Family Window → Coordinator Review**

## Do not skip this execution order
This pack is intentionally sequenced. Codex should not jump directly to the PYP slice without first finishing the operational platform work in Steps 1–8.

### Required order
1. **Tasks 01–05** — bind the IB product to live route and record flows
2. **Tasks 06–10** — expand the IB pack so the backend can describe the IB domain properly
3. **Tasks 11–15** — make teacher operations real
4. **Tasks 16–18** — make coordinator/admin operations real
5. **Tasks 19–21** — build the evidence + learning story + family publishing subsystem
6. **Tasks 22–27** — build POI, exhibition, MYP interdisciplinary/project/service, and DP IA/EE/TOK/CAS as first-class systems
7. **Tasks 28–29** — make Standards & Practices a real evidence system
8. **Tasks 30–33** — consolidate the planning stack for IB around `CurriculumDocument`
9. **Tasks 34–39** — build the full-stack PYP vertical slice
10. **Tasks 40–41** — coverage audit + orchestration prompt + next-slice signal

## Global product guardrails
Every task in this pack must respect these rules.

### 1) Do not reintroduce Toddle-style friction
The product should not become click-heavy, training-heavy, or dependent on bouncing across multiple tabs to finish a simple teaching action. Every task should reduce:
- clicks per common teacher action
- hidden state
- dead-end navigation
- redundant data entry
- mock-only placeholders that look real but are not operational

### 2) Do not repeat ManageBac-style clutter or antiquated workflow
The product should not become a dense form graveyard with weak prioritization. Every coordinator/admin task should be:
- exception-first
- queue-first
- decision-support oriented
- drilldown capable without requiring five navigation hops

### 3) IB-specific surfaces must still use platform primitives
Do not bake IB assumptions into shared platform primitives unless the primitive stays curriculum-neutral and the IB behaviour is expressed via configuration/modules. Shared capabilities should remain usable by the American and British modes later.

### 4) Prefer vertical integration over screen count
If forced to choose between “another polished page” and “fewer pages backed by live data, workflows, and audit trails,” choose the latter.

## Current codebase assumptions
This pack assumes the repository already contains:
- the generic curriculum document system (`CurriculumDocument`, `CurriculumDocumentVersion`, `PlanningContext`, alignments, document links, pack-driven workflows)
- the IB shell and IB feature surfaces under `apps/web/src/features/ib/*`
- existing route registry and workspace scaffolding under `apps/web/src/features/ib/core/*` and `apps/web/src/app/ib/*`
- the current IB pack at `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- legacy plan objects (`UnitPlan`, `LessonPlan`, `Template`) still present and still usable outside IB mode

## Cross-cutting technical rules

### API rules
- Any new IB-specific endpoint should live under `apps/core/app/controllers/api/v1/ib/*` unless it naturally belongs inside an existing generic controller.
- Use policy scopes and school scoping consistently.
- New queue/summary endpoints should return already-shaped JSON for the IB frontend, rather than forcing the browser to compose ten endpoints into one dashboard.

### Frontend rules
- Use `useSchoolSWR` / existing API helpers.
- Replace `mock-data.ts` and any `INITIAL_*` arrays with live hooks as early as possible.
- Keep `apps/web/src/features/ib/*` as the IB expression layer; do not push IB labels directly into generic `curriculum/*` components unless the component remains pack-driven.

### Workflow rules
- Every visible “state” in the UI must map to a backend workflow state or persisted field.
- Do not ship frontend-only pseudo-states for approval, evidence readiness, or publishing.

### Auditability rules
- Anything related to coordinator review, family visibility, standards/practices evidence, DP core checkpointing, or publish state must be auditable.

## Recommended feature flags
Introduce or continue using feature flags such as:
- `ib_live_routes_v1`
- `ib_pack_v2`
- `ib_teacher_console_v1`
- `ib_operations_center_v1`
- `ib_evidence_subsystem_v1`
- `ib_poi_v1`
- `ib_interdisciplinary_v1`
- `ib_dp_core_live_v1`
- `ib_standards_practices_live_v1`
- `ib_documents_only_v1`
- `ib_pyp_vertical_slice_v1`

Flags should be tenant- and school-aware wherever possible.

## Definition of done for Steps 1–8
Before Task 34 begins, the following must be true:
- there are no `/demo` deep links left in the IB experience
- the IB pack can describe all major PYP/MYP/DP document types that the UI expects
- teacher home and coordinator operations are backed by live data
- evidence, stories, and family publishing are persisted and queryable
- POI, exhibition, interdisciplinary planning, and DP core systems exist in the backend and are reachable from the frontend
- standards/practices evidence is no longer a static board
- legacy IB planning is either fully bridged or clearly deprecated in favour of curriculum documents

## Stop signal after the PYP slice
After Tasks 34–39 are complete, **do not immediately build the MYP or DP vertical slice in this pack**. The next pack should be:
1. **MYP full-stack vertical slice**
2. **DP full-stack vertical slice**

This pack should end by clearly preparing for those next slices without implementing them.

## Files in this pack
- Tasks **01–33** = Steps 1–8
- Tasks **34–39** = Step 9 (PYP full-stack vertical slice)
- Task **40** = coverage matrix + explicit “next slice” signal
- Task **41** = Codex orchestration prompt / resume prompt

## How Codex should execute
- Read this file first.
- Then execute Tasks 01–39 in order.
- Use Task 40 as the audit to confirm nothing from the 8-step plan was dropped.
- Use Task 41 if the Codex session needs to be restarted or handed off.
