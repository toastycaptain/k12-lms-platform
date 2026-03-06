# Task 61 — IB STEP11 DP VERTICAL SLICE GUARDIAN SUPPORT SURFACES, COMMUNICATIONS, AND SUMMARIES

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 60
- **Run before:** Task 62 finalizes release readiness, telemetry, and no-regression coverage
- **Primary mode:** Backend + Frontend

## Objective
Build the guardian/family support layer for the DP slice: permission-safe summaries, milestone awareness, digest/communication integration, and a calm presentation of how families can support without exposing internal programme management detail.

## Why this task exists now
Families in DP often need visibility and support cues, but they do not need the full teacher/coordinator operations model. This task ensures the DP slice ends with a usable, non-noisy family layer.

## Current repo anchors
- family publishing and calm-mode systems from prior phases
- outputs from Tasks 53–60
- guardian feature modules under `apps/web/src/features/ib/guardian/*`

## Scope
### Guardian-facing outcomes
- high-level course/core support summaries where permitted
- IA/EE/TOK/CAS milestone awareness in digestible language
- student support prompts and upcoming dates that matter at home
- curated communications or summaries, not raw internal workflow dumps
- calm digest/feed delivery compatible with existing family publishing systems

### Explicitly out of scope
- exposing internal coordinator notes, authenticity flags, or teacher-only review detail
- turning the guardian UI into a second student dashboard

## Backend work
- Finalize guardian-facing feed/summary endpoints for DP slice data.
- Ensure every field exposed to guardians passes visibility policy checks.
- Add or refine digest-generation inputs for DP support summaries where relevant.
- Ensure audit trails exist for family-visible summary generation/publishing.

## Frontend work
- Bind guardian DP surfaces to live data.
- Keep the interface calm, supportive, and less operationally dense than internal views.
- Make it clear what the family can do to help and what is simply informational.
- Reuse family publishing primitives without inheriting PYP/MYP assumptions that do not fit DP.

## UX / interaction rules
- use supportive language rather than internal workflow terminology
- keep deadline/milestone summaries concise and actionable
- avoid exposing every checkpoint if a simpler summary is more appropriate
- preserve route clarity if the guardian has more than one student

## Data contracts, APIs, and model rules
- Guardian summaries must be curated views over internal record state, not direct record dumps.
- Keep visibility classes explicit for every summary element.
- Document how digests are generated from IA/EE/TOK/CAS state without exposing sensitive internal review content.

## Risks and guardrails
- Do not let guardian pages become noisy, guilt-inducing, or confusing.
- Do not present DP operational risk labels directly to families without careful translation.
- Do not regress family calm-mode behaviour established in prior packs.

## Testing and verification
- Permission tests for guardian visibility across all DP record families.
- Frontend integration tests for guardian summaries/digests and multi-student navigation.
- Manual QA ensuring no internal notes leak into guardian views.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`

## Acceptance criteria
- Guardians have a live, permission-safe, calm way to follow and support the DP slice without seeing internal operations detail.

## Handoff to the next task
- Task 62 finalizes release readiness, telemetry, and no-regression coverage.
