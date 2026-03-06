# Task 39 — IB STEP9 PYP VERTICAL SLICE STUDENT GUARDIAN SURFACES DIGESTS AND RELEASE

## Position in sequence
- **Step:** 9 — Build the first full-stack vertical slice — PYP
- **Run after:** Task 38
- **Run before:** Task 40 audits full coverage of Steps 1–9 and records the next-slice signal. Stop after that except for Task 41 orchestration metadata.
- **Primary mode:** Backend + Frontend

## Objective
Complete the PYP slice on the student and guardian side, verify digest/family delivery, add telemetry and release criteria, and stop the pack with an explicit handoff to future MYP and DP slices.

## Why this task exists now
A full stack slice is only complete when the published output is visible in the right calm way to students/guardians and the release is instrumented and testable end-to-end.

## Current repo anchors
- Outputs from Tasks 21, 37, and 38
- `apps/web/src/features/ib/student/*`
- `apps/web/src/features/ib/guardian/*`
- `apps/web/src/features/ib/mobile/*`
- `apps/web/src/features/ib/qa/phase2-release-gates.md` or successor QA docs
- `apps/core` guardian/story/feed endpoints

## Scope
- Ensure student and guardian surfaces reflect the real PYP slice output: current unit window, learning stories, portfolio highlights, and any student reflection state intended for the slice.
- Verify family digest preview/delivery state for the slice.
- Add telemetry, release checklist, and explicit next-step signal for MYP then DP vertical slices.

## Backend work
- Add or finalize any student/guardian feed endpoints needed specifically by the PYP slice.
- Ensure visibility scoping is airtight for all published PYP slice content.
- Add telemetry/logging around slice-critical events: unit created, evidence validated, story drafted, story published, guardian feed delivered/viewed if instrumentation exists.

## Frontend work
- Bind student/guardian surfaces to live slice outputs; eliminate remaining placeholders that affect the PYP slice.
- Ensure guardian feed remains calm and readable while still reflecting the new live subsystem.
- Document and implement the release gate checklist for the slice.

## Data contracts, APIs, and model rules
- Create a slice-specific QA checklist: create unit, edit unit, add weekly flow, add evidence, request reflection, compose story, publish/queue, coordinator review, guardian view, student view.
- Explicitly note in this file and the pack coverage matrix that the next work after this pack is: **MYP vertical slice**, then **DP vertical slice**.

## Risks and guardrails
- Do not let student/guardian pages lag behind the teacher/coordinator slice; that would leave the slice operationally incomplete.
- Do not start implementing MYP/DP slice code here; only prepare the handoff.

## Testing and verification
- End-to-end tests for the PYP happy path where feasible.
- Manual QA checklist execution logged in the repo or release note.
- Permission tests for student and guardian visibility.

## Feature flags / rollout controls
- Keep under `ib_pyp_vertical_slice_v1` until the whole slice is green.
- Do not ship slice-critical paths without telemetry and QA evidence.

## Acceptance criteria
- The first full-stack PYP slice is complete and releasable.
- The pack ends with a clear signal that MYP and DP vertical slices are next, but not implemented here.

## Handoff to the next task
- Task 40 audits full coverage of Steps 1–9 and records the next-slice signal. Stop after that except for Task 41 orchestration metadata.
