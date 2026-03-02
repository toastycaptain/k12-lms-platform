# Architecture Decision Records (ADRs)

## ADR-001: Profile Representation
- Context: We need curriculum-specific behavior without backend re-architecture.
- Decision: Store profile definitions as versioned schema-validated artifacts and resolve at runtime.
- Consequence: Easier versioning and rollout, minimal DB coupling.

## ADR-002: Resolution Precedence
- Context: Multiple organizational levels can define curriculum context.
- Decision: `course override > school override > tenant default > system fallback`.
- Consequence: Deterministic behavior and clear debugging path.

## ADR-003: Selection Scope
- Context: Product supports multi-school structures.
- Decision: Tenant default with school override as primary model.
- Consequence: Central governance with operational flexibility per school.

## ADR-004: Governance Boundary
- Context: Stakeholder requirement is strict admin ownership of curriculum decisions.
- Decision: Admin-only mutation for profile selection, formatting, upload, import, and management.
- Consequence: Curriculum leads/teachers/students/guardians become derived-data consumers in v1.

## ADR-005: Backend Change Budget
- Context: Do not drastically change backend core.
- Decision: Additive schema only (`schools.curriculum_profile_key`, `courses.school_id`), resolver service, and endpoint additions.
- Consequence: Lower migration risk and higher compatibility with current services.

## ADR-006: Rollout Strategy
- Context: Existing tenants must not break.
- Decision: Feature-flagged rollout with fallback defaults and reversible activation.
- Consequence: Controlled blast radius and safe rollback.
