# 02 — Org Hierarchy & Multi‑Tenancy (District → School → Course) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS can represent and enforce a **K–12 district hierarchy** and support:
- district-level administration
- school-level delegated administration
- scoping of data/settings by org unit
- safe multi-tenancy (if applicable)

This is the backbone that enables “one central software” across an entire school/district.

---

## What to locate (backend)

Search for:
- DB tables/models: `Organization`, `Tenant`, `District`, `School`, `OrgUnit`, `Account`, `SubAccount`
- foreign keys: `tenant_id`, `org_id`, `school_id`
- hierarchy patterns:
  - adjacency list (`parent_id`)
  - nested sets / materialized path
  - separate “account/subaccount” abstraction
- settings scoping:
  - `settings` table keyed by org unit
  - feature flags per org/school
  - branding per org/school

Also locate:
- API endpoints for org management
- permission checks that scope by org unit
- admin UI pages for org structure and delegated admins

---

## What to locate (frontend)

Find admin console screens/components for:
- district/school management
- school rosters & settings
- delegated admin assignment
- viewing across multiple schools vs scoped views

Confirm the UI matches the backend hierarchy.

---

## Requirements to assess (score each 0–3)

### A. Hierarchical org model exists and is first-class
- District → School (and optionally sub-schools/programs) can be represented.
- Courses/sections are attached to an org unit (school at minimum).
- Users can belong to multiple org units where needed (e.g., itinerant staff).

**Evidence**
- Model definitions + migrations
- API routes that fetch org tree
- UI showing tree / list with scope

### B. Tenant isolation (if multi-tenant)
If the product serves multiple districts:
- every query is scoped by `tenant_id` (or equivalent)
- admin endpoints cannot cross tenant boundaries
- background jobs respect tenant scoping

**Evidence**
- query scoping middleware
- DB schema including tenant keys
- tests for tenant isolation
- request context patterns

### C. Delegated administration by org unit
- District super-admin can grant school admin rights for a specific school/org unit.
- School admins cannot change district-wide settings unless explicitly permitted.
- Permissions inherit or are scoped in a controlled way.

**Evidence**
- RBAC tied to org unit
- permission checks include org scope
- admin UI supports adding/removing school admins

### D. Org-scoped settings and policy controls
Examples:
- per-school feature toggles
- per-school branding
- per-school integration enablement (e.g., “allow LTI tool X at School A only”)

**Evidence**
- settings stored with org scope
- config resolver reads org scope
- UI to manage these settings

### E. Cross-org reporting with correct scoping
- District admins can view aggregate reports across schools.
- School admins see only their school’s data.
- Export endpoints respect scope.

**Evidence**
- report query scoping
- role-based and org-based filters
- tests or query guards

---

## Red flags (call out explicitly)

- No explicit org hierarchy; everything is “flat.”
- “School” is only a string field with no referential integrity.
- Tenant scoping is done in the frontend only (not enforced server-side).
- Background jobs run without tenant/org context.
- Admin UI allows switching schools but API does not enforce that scope.

---

## Output format (in chat)

1) **What I searched** (keywords + directories)
2) **What I found** (org model summary)
3) **Findings table**

Use this table:

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

4) **Open questions / unknowns** (only if evidence truly missing)

Proceed to `03_RBAC_AND_DELEGATED_ADMIN.md`.
