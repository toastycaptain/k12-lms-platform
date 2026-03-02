# Phase 03 — Messaging Guardrails for Guardian Users

## Goal
Ensure family/guardian messaging is functional without exposing unrestricted user search or unsafe participant targeting.

## Scope
- Restrict guardian user search scope to linked-student communication graph.
- Validate allowed participants on thread creation.
- Ensure course-linked threads honor course visibility authorization.

## Tasks
1. Update `UserPolicy::SearchScope` with guardian-specific restrictions.
2. Enforce participant allow-list checks in `MessageThreadsController#create`.
3. Authorize optional `course_id` attachment in thread creation.
4. Add/adjust request specs for restricted guardian messaging behavior.

## Acceptance
- Guardians can message valid contacts (e.g., linked-student teachers).
- Guardians cannot target arbitrary tenant users.
