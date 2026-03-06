# Task 12 — IB STEP3 TEACHER ACTION CONSOLE FRONTEND AND PRIORITY RULES

## Position in sequence
- **Step:** 3 — Build the teacher operations layer
- **Run after:** Task 11
- **Run before:** Task 13 now turns the PYP/MYP/DP studios into live operational editing surfaces.
- **Primary mode:** Backend + Frontend

## Objective
Bind the existing teacher home surface to the live action payload and redesign it as an action-first console with resume cards, exception cards, what-changed signals, and one-click deep links.

## Why this task exists now
The backend can now describe teacher work. This task makes the teacher homepage genuinely useful day-to-day and intentionally lower friction than competitor patterns.

## Current repo anchors
- Output from Task 11
- `apps/web/src/features/ib/home/TeacherActionConsole.tsx`
- `apps/web/src/features/ib/home/IbDashboardPage.tsx`
- `apps/web/src/features/ib/home/useIbHomePayload.ts`
- `apps/web/src/features/ib/layout/IbShell.tsx`
- `apps/web/src/features/ib/mobile/MobileTriageTray.tsx`

## Scope
- Replace any remaining static action cards or mock timeline content with the live teacher-console payload.
- Structure the page around immediate action: resume, urgent blockers, recent changes, and quick routes to evidence/publishing/projects/core follow-up.
- Design for a teacher who only has two minutes between classes or meetings.
- Preserve calmness: the console should prioritize and suppress noise rather than becoming another crowded dashboard.

## Backend work
- No major backend changes beyond small response/serialization adjustments discovered during frontend binding.
- Add telemetry hooks for action-card clicks and time-to-action if analytics scaffolding already exists.

## Frontend work
- Implement sections such as `Resume where you left off`, `Needs action today`, `Changed since your last visit`, and `Programme watchlist`.
- Support quick actions and side-panel actions where possible, not just full-page navigation.
- Wire mobile triage so the highest-value teacher actions are available on constrained screens.
- Add explicit empty states that guide the teacher to useful secondary actions instead of showing blank space.

## Data contracts, APIs, and model rules
- Standardize action-card contract usage so every card has canonical route, entity reference, and tone/priority metadata.
- Document click-budget expectations for common workflows; for example, a teacher should reach a unit needing attention in one click from home.

## Risks and guardrails
- Do not turn the home console into a metrics page with no direct actions.
- Do not use modal overload for simple actions; reserve drawers and side panels for fast contextual work.

## Testing and verification
- Component tests for the teacher console rendering live payload shapes.
- Regression tests proving no `mock-data.ts` or demo IDs are used.
- Manual verification of keyboard navigation, responsive layout, and quick-action affordances.

## Feature flags / rollout controls
- Ship behind `ib_teacher_console_v1` if needed, but prefer cutting over the existing home console fully once stable.
- Do not bury urgent items below passive metrics cards.

## Acceptance criteria
- The teacher home experience is a real action console, not a decorative dashboard.
- Primary teacher tasks are one click away.
- The console degrades cleanly even before all later subsystems are fully live.

## Handoff to the next task
- Task 13 now turns the PYP/MYP/DP studios into live operational editing surfaces.
