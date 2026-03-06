# 03 — RBAC & Delegated Administration (Permissions That Scale) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS has **robust, granular Role‑Based Access Control (RBAC)** suitable for K–12 districts, including:
- default roles (student, teacher, admin, guardian/observer, support)
- custom roles/permissions
- org-scoped roles (district vs school)
- course-scoped roles (teacher vs TA vs student)
- consistent enforcement across backend + frontend

---

## What to locate

### Backend
Find:
- Role and permission models (tables like `roles`, `permissions`, `role_permissions`, `user_roles`)
- Authorization implementation:
  - middleware/guards/policies
  - attribute-based access control (ABAC) combined with RBAC
  - route-level permission decorators
- Course/class membership roles:
  - `Enrollment` with role field
  - `Membership` tables
- Admin APIs for:
  - creating/editing roles
  - assigning roles to users
  - setting permission sets per org unit

### Frontend
Find:
- permission gating for admin tools (feature toggles, route guards)
- UI states for insufficient permissions
- components that hide/disable actions based on role

---

## Requirements to assess (score each 0–3)

### A. Canonical permission model exists (not ad-hoc)
- Permissions are enumerated and centrally defined.
- Roles are collections of permissions.
- Permission checks use a consistent mechanism (not scattered `if isAdmin` checks only).

### B. Scope-aware roles (org-level + course-level)
- A user can be a district admin for District A, school admin for School B, and teacher in Course C.
- Scope is part of the role assignment (e.g., role assignment references org unit or course).

### C. Custom roles supported
Admins can:
- create custom roles
- modify permission sets
- assign custom roles to users (with scope)

### D. Delegated admin workflows exist
- District can assign school admins.
- School admins can manage only their scoped resources (courses, users, settings) as permitted.
- Clear boundary between district-wide and school-only controls.

### E. Consistent backend enforcement
- Every privileged API endpoint requires authorization checks.
- No “frontend-only” protection.
- Tests exist for critical authorization boundaries.

### F. Least-privilege defaults & safe privilege escalation handling
- Default roles align with least privilege.
- Sensitive permissions are distinct and not bundled (e.g., “impersonate user”, “manage integrations”, “export PII”).

---

## Administrator-focused edge cases to verify

- Can a teacher enroll/remove users? Is that limited to their own course only?
- Can school admins view district-wide analytics or only their school?
- Does “support” role exist with restricted but useful rights (impersonation, logs)?
- Are guardian/observer accounts properly limited (read-only, only linked students)?
- Are API tokens / service accounts scoped?

---

## Evidence checklist (collect)

- Permission enumeration file(s)
- Role assignment schema (including scope fields)
- Authorization middleware/policy code
- Example protected endpoints (user export, roster import, tool install, impersonation)
- Frontend route guards for admin console
- Tests (authorization/unit tests)

---

## Output format (in chat)

1) **RBAC architecture summary** (how roles/permissions are stored and enforced)
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Critical authorization gaps** (list as bullets with evidence)

Proceed to `04_SUPPORT_TOOLS_IMPERSONATION.md`.
