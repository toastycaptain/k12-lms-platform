# Task 51 — IB STEP10 MYP VERTICAL SLICE STUDENT/GUARDIAN SURFACES, RELEASE, AND TELEMETRY

## Position in sequence
- **Step:** 10 — Build the full-stack MYP vertical slice
- **Run after:** Task 50
- **Run before:** Task 52 starts the DP vertical-slice master plan. Step 10 is complete after this task.
- **Primary mode:** Backend + Frontend

## Objective
Complete the MYP slice by wiring live student and guardian surfaces, calm milestone/progress visibility, telemetry, release gates, and explicit no-regression checks against the already-shipped PYP slice.

## Why this task exists now
A full-stack slice is only complete when the right output is visible to students and guardians in the right way, and when the slice is instrumented and testable end-to-end.

## Current repo anchors
- outputs from Tasks 43–50
- student and guardian feature modules from Phase 2/3
- family publishing and visibility subsystem
- mobile/telemetry/release docs from prior packs

## Scope
### Student-facing outcomes
- current MYP units with the right current-focus summary
- criteria/ATL focus visibility in a student-appropriate form
- project milestone and service reflection next actions
- feedback / returned-with-comments / missing-action states where permitted

### Guardian-facing outcomes
- calm current-unit window
- project/support milestones that families can actually help with
- selective service/project highlights where school policy allows
- no internal-only coordinator/teacher notes or dense assessment clutter

### Release work
- telemetry for slice-critical events
- QA checklist
- permission verification
- no-regression checks for PYP and cross-programme shared components

## Backend work
- Finalize student/guardian feed endpoints and visibility logic required by the MYP slice.
- Ensure project/service/unit data exposure is policy-safe and school-scoped.
- Add telemetry/logging around:
  - MYP unit created/opened
  - concept/context complete
  - criteria/assessment ready
  - interdisciplinary linked
  - project milestone updated
  - service approved
  - coordinator review completed
  - guardian feed item delivered/viewed if instrumentation exists

## Frontend work
- Bind student and guardian surfaces to live MYP slice data.
- Keep the experience calm: highlight next actions, not every internal planning field.
- Add release checklist docs and confirm feature-flag rollout behaviour.
- Remove or replace any remaining placeholders affecting the MYP slice.

## UX / interaction rules
- students should see what to do next, what feedback matters, and where they are blocked
- guardians should see supportable information, not internal programme bureaucracy
- keep secondary-level family surfaces readable and digest-oriented

## Data contracts, APIs, and model rules
- Separate internal-only, student-visible, and guardian-visible content rigorously.
- Student next actions should be backed by real record state/reason codes.
- Guardian summaries should be derived from curated visibility rules, not raw record dumps.

## Risks and guardrails
- Do not let guardian screens become a noisy mirror of internal teacher/coordinator tools.
- Do not delay student/guardian work until after release; that would mean the slice is not actually complete.
- Do not regress PYP shared evidence/family components while adapting them for MYP needs.

## Testing and verification
- End-to-end MYP slice happy-path tests where feasible.
- Manual QA checklist: create/open unit → complete concept/context/criteria → link interdisciplinary → update project/service → coordinator review → student view → guardian view.
- Permission tests for every role boundary touched by the slice.

## Feature flags / rollout controls
- `ib_myp_vertical_slice_v1`
- sub-flags remain available for debugging but the release gate is the umbrella slice flag

## Acceptance criteria
- The MYP vertical slice is complete, visible to the right roles, instrumented, and releasable.

## Handoff to the next task
- Task 52 starts the DP vertical-slice master plan.
