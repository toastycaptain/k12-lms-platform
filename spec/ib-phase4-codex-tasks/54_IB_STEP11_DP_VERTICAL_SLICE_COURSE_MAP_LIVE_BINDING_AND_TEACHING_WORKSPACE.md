# Task 54 — IB STEP11 DP VERTICAL SLICE COURSE MAP LIVE BINDING AND TEACHING WORKSPACE

## Position in sequence
- **Step:** 11 — Build the full-stack DP vertical slice
- **Run after:** Task 53
- **Run before:** Task 55 deepens the slice into internal-assessment workflow and authenticity handling
- **Primary mode:** Backend + Frontend

## Objective
Turn the DP course map and teaching workspace into a live, operational, versioned surface linked to IA/core follow-up rather than a static syllabus-style board.

## Why this task exists now
DP teachers need one serious workspace that lets them understand course progression, upcoming obligations, and linked IA/core work without juggling disconnected screens.

## Current repo anchors
- `apps/web/src/features/ib/dp/DpCourseMap.tsx`
- `apps/web/src/features/ib/dp/DpAssessmentDashboard.tsx`
- curriculum-document/version infrastructure
- teacher console and DP workspace landing pages

## Scope
- live course-map route and content editing/loading
- linked sections for upcoming course milestones, IA hooks, and core touchpoints as appropriate
- comments/review notes/version state
- direct launch into IA or other DP records from the teaching workspace
- stable save and readiness/blocker indicators

## Backend work
- Ensure course-map detail payload includes:
  - current version content
  - workflow state and allowed transitions
  - linked IA/core summaries where configured
  - comments/review note counts
  - upcoming due dates / next actions relevant to the teacher
  - readiness/blocker reason codes if used
- Optimize payloads so the workspace does not need excessive client fan-out.
- Ensure validation is field-level and version-aware.

## Frontend work
- Bind course-map pages to live record data.
- Add side rails or summary panels for linked IA/core work and upcoming actions.
- Keep teaching workflow central; do not let the workspace become only an archive of syllabus text.
- Support fast navigation into related IA, EE, TOK, or CAS records from contextually relevant points.

## UX / interaction rules
- course map should feel operational, not bureaucratic
- use compact timeline/section patterns where they help show upcoming obligations
- keep comments/review notes contextual and auditable
- preserve route and filter context when opening linked records in-place or in side drawers

## Data contracts, APIs, and model rules
- Clarify which linked summaries are purely informational vs actionable.
- Keep enough relational/indexed linkage that risk summaries do not depend on parsing course-map JSON.
- Do not couple every DP workflow transition to course-map editing itself; use linkages where appropriate.

## Risks and guardrails
- Do not rebuild a massive static syllabus editor with no operational value.
- Do not hide IA/core follow-up behind secondary tabs if the teacher needs it frequently.
- Do not overstuff the page with every DP obligation at once; prioritize current and upcoming actions.

## Testing and verification
- Frontend integration tests for course-map loading, save/version behaviour, and linked-record launches.
- Request specs for course-map detail payload and route/load scoping.
- Regression tests ensuring no static arrays or fake IDs remain on the primary DP workspace.

## Feature flags / rollout controls
- `ib_dp_vertical_slice_v1`

## Acceptance criteria
- The DP course map is now a live teaching workspace tied to real record state and linked operational follow-up.

## Handoff to the next task
- Task 55 deepens the slice into internal-assessment workflow and authenticity handling.
