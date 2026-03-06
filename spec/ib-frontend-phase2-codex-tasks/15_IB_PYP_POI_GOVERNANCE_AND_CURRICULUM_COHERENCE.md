# Task 15 — PYP Programme of Inquiry Governance and Curriculum Coherence Tools

## Dependency
Complete Tasks 01–14 first.

## Objective
Evolve the visually promising POI board into a true governance object with gap/duplicate warnings, specialist overlays, articulation notes, family visibility status, compare-year views, and meeting support.

## Why this task exists now
- The roadmap says the POI board must become much more than a matrix because the PYP POI is a programme-governance object, not just a teacher artifact.
- This is where coordinators need to reason about coherence across themes and years, not just inspect one unit at a time.
- A mature POI governance tool also supports evaluation readiness because it shows programme articulation as a living system.

## Toddle / ManageBac pain this task must beat
- Avoid a visually pleasing matrix that cannot explain why coverage is weak or duplicated.
- Avoid requiring separate spreadsheets or meeting notes outside the platform to discuss articulation decisions.
- Avoid making specialist participation or family visibility invisible at the programme level.

## Cross-curriculum guardrails
- Do not hard-code IB terminology into globally shared non-IB surfaces. Keep shared primitives generic and mount IB expressions under `apps/web/src/app/ib/**` and `apps/web/src/features/ib/**`.
- Do not invent new backend payloads if Route 3 backend work already exposed contracts. Inspect `packages/contracts/**`, generated frontend types, and existing `apiFetch` usage first.
- Prefer extending `packages/ui` for reusable UI primitives only when the primitive is curriculum-neutral. Keep PYP/MYP/DP-specific composition in the web app.
- Every workflow must honor the click-budget rule established in the roadmap: the common path should take fewer steps than Toddle/ManageBac equivalents.
- Every screen must support loading, empty, error, offline/poor-network, and insufficient-permission states.
- Accessibility is not optional: keyboard navigation, visible focus, screen-reader labels, semantic headings, and color-independent status indicators are required.
- All new data access should go through `apiFetch`, `useAppSWR`, existing auth context, and any route-specific hooks created in this task set.
- Where a task touches mobile behavior, build for high-value triage actions rather than full parity.

## Existing repo touchpoints to inspect first
- Any existing POI board or continuum map prototypes.
- PYP unit data and specialist/family states from Tasks 05–06 and 11–13.
- Coordinator summary patterns from Tasks 04 and 14.

## New or heavily modified frontend surfaces
- `apps/web/src/app/ib/pyp/poi/page.tsx` and any detail routes needed.
- `apps/web/src/features/ib/pyp/PoiGovernanceBoard.tsx`.
- `apps/web/src/features/ib/pyp/PoiMeetingMode.tsx`.
- `apps/web/src/features/ib/pyp/ArticulationNotesPanel.tsx`.

## Detailed implementation steps
1. Upgrade the POI board to include gap and duplicate detection across themes and years. Warnings should explain the issue and link to the related units.
2. Add specialist overlay heatmap so coordinators can see where specialist contributions are missing, light, or well integrated.
3. Include learner profile / ATL emphasis maps if that data is meaningful in the existing IB document model. Make the view informative rather than compliance-heavy.
4. Expose family visibility status by unit so coordinators can spot whether some cohorts or themes are under-communicated to families.
5. Provide compare-current-year to previous-year capability, highlighting changed unit placements, additions, removals, and notable articulation decisions.
6. Create articulation note spaces tied to cells or year/theme intersections so meeting outcomes live with the programme object rather than in separate docs.
7. Implement a meeting mode optimized for collaborative review in front of a team. This mode should de-emphasize editing chrome and emphasize comparison, notes, and issue tracking.

## Interaction and UX requirements
- Governance views should stay readable even when dense. Use layers/toggles rather than overwhelming defaults.
- Warnings should be human-readable and immediately actionable.
- Meeting mode should be projection-safe and discussion-friendly.

## Data / contract integration rules
- Use backend Route 3 document/workflow/framework contracts as the source of truth. Do not create frontend-only payload dialects unless temporarily mocked behind a replaceable adapter.
- If a required response shape is unclear, inspect `packages/contracts/**`, generated types, and current `apiFetch` callsites before writing code.
- Where possible, create route- or feature-specific hooks rather than embedding fetch logic directly into page components.
- Preserve optimistic UI only where it is safe and reversible. Approval/publish actions need especially clear confirmation and status feedback.

## Loading / empty / error / permission states to design explicitly
- Initial page load and partial widget load.
- No data yet / newly onboarded school.
- No permission for the current role or school context.
- Backend temporarily unavailable or stale data warning.
- Poor connectivity / offline if the surface supports queued actions.

## Accessibility requirements
- Semantic headings and landmarks.
- Keyboard support for drawers, tabs/modes, and batch actions.
- Visible focus and non-color-only status encoding.
- Screen-reader labels for action buttons, filters, status pills, and timeline items.

## Tests to add
- Gap/duplicate detection rendering tests.
- Compare-year tests.
- Meeting-mode and note persistence tests.

## Acceptance criteria
- POI is now a governance workspace, not just a matrix.
- Coordinators can detect gaps, duplicates, specialist issues, and family visibility patterns from one board.
- Meeting notes and compare-year review are integrated into the POI workflow.

## Explicitly out of scope for this task
- Do not prematurely implement later tasks unless they are required only as thin placeholders for routing.
- Do not rewrite unrelated generic curriculum surfaces unless this task explicitly depends on extending them.
- Do not create backend contract changes unless the task cannot be completed against the completed Route 3 backend work and the gap is documented.

## Handoff to the next task
Task 16 will provide the complementary standards/practices governance layer. Task 18 will report on POI health at higher levels.
