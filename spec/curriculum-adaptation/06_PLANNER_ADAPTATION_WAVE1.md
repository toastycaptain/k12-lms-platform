# Planner Adaptation Wave 1 (Planning-Only)

## Objective
Apply profile-derived defaults to planning surfaces without changing core instructional flow.

## Surfaces in Scope
- Unit creation flow (`/plan/units/new`).
- Standards browsing/filtering pages.
- Template default filters and metadata tags.
- Curriculum coverage/report screens where profile context is shown.

## Required Behavior
1. Subject and grade options are derived from effective profile taxonomy.
2. Standards framework defaults are derived from profile framework mappings.
3. Template list defaults and tags align to effective profile key.
4. Effective profile badge/source is shown in planner context areas.

## Non-Admin Behavior Constraints
Planner adaptations for non-admin users are read-only derived behavior.
No planner screen for non-admin users may expose curriculum profile editing/import controls.

## Backward Compatibility
- If profile data missing or invalid, planner uses safe fallback defaults.
- Existing plan creation and standards assignment APIs remain unchanged except derived context exposure.
