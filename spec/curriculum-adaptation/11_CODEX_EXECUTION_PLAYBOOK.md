# Codex Execution Playbook

## Objective
Provide implementation sequence and PR slicing so execution can proceed with minimal context loss.

## Implementation Sequence
1. Contracts/profile schema and profile-pack assets.
2. Schema migrations and resolver service.
3. Admin-only curriculum settings/import APIs + policy hardening.
4. Admin UI updates (settings + setup/provisioning integration).
5. Planner derivation updates for non-admin consumers.
6. Integration context propagation (Google/LTI/OneRoster).
7. Test completion and rollout controls.

## PR Slicing Plan
### PR-1: Contracts and Profile Assets
- Add profile schema and initial profile packs.
- Add contract fixtures and validation tests.

### PR-2: Data Model + Resolver
- Add `schools.curriculum_profile_key` and `courses.school_id`.
- Add resolver service and unit tests.

### PR-3: API + Policy
- Add new curriculum settings/profile endpoints.
- Extend school/course payloads.
- Enforce admin-only mutation and import routes.

### PR-4: Admin UX
- Add admin controls for tenant default + school override.
- Add setup/provisioning integration points.

### PR-5: Planner Derivation
- Implement derived defaults for unit creation, standards, templates.
- Add non-admin UI visibility tests.

### PR-6: Integrations + Rollout
- Propagate context to Google/LTI/OneRoster.
- Add monitoring, feature-flag guards, rollback docs.

## Release Gate
Release gate: block rollout if any non-admin role can mutate curriculum settings/imports.
