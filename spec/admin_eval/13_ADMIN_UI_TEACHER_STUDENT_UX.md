# 13 — Admin Console UX + Teacher/Student UX Impact (Frontend/Backend Alignment) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Evaluate the UX features that determine adoption and reduce admin support burden:
- admin console: bulk actions, search, delegation, clear status
- teacher workflows: content creation, integration usage (Deep Linking), grade workflows
- student/guardian access patterns (if applicable)
- consistency between frontend gating and backend authorization

Admins care about frontend because it drives tickets and adoption.

---

## What to locate

### Admin console features (frontend)
Search for UI/routes/components related to:
- managing users (bulk import/export, deactivate/reactivate)
- managing org structure (district/schools)
- managing courses/sections/terms
- roles/permissions UI
- SIS sync configuration/status/error views
- tool integration management (LTI installs) and approvals
- audit logs view
- analytics dashboards and exports

### Teacher workflows
Find:
- course setup flows
- adding content/modules
- assignment creation and grading flows
- integration usage:
  - tool launches
  - Deep Linking embed flow
  - grade sync error UX

### Student/guardian workflows (if present)
Find:
- student dashboard for tasks/assignments
- guardian observer read-only views
- accessibility and mobile responsiveness considerations

### Backend/frontend alignment
Confirm:
- frontend hides/disables actions based on permissions **and**
- backend enforces permissions regardless of UI

---

## Requirements to assess (score each 0–3)

### A. Admin console supports bulk operations
- bulk user operations (import/export, deactivate)
- bulk course/section operations (archive, assign templates)
- batch role assignment

### B. Admin console has powerful search & filtering
- search users/courses/sections across org scope
- filters by school/term/role
- quick navigation for support use cases

### C. Clear integration status UX
- SIS sync: last run, next run, errors, run history
- LTI tools: install scope, status, recent failures
- exports: job status, download ready, errors

### D. Delegation UX mirrors org hierarchy
- district admins can manage school admins easily
- school admins see only their scope
- navigation makes scope clear (breadcrumbs/school context)

### E. Teacher UX supports governance + flexibility
- templates/blueprints do not block teaching
- locked items are clearly indicated
- Deep Linking (if available) is smooth and reduces copy/paste

### F. Accessibility & mobile support (baseline)
- key student/teacher flows are accessible
- mobile-friendly UI for core actions (view/submit/grade basics)

---

## Red flags

- Critical admin tasks require direct DB edits or CLI scripts.
- Sync errors are hidden or incomprehensible to admins.
- Frontend-only permission gating; backend allows bypass.
- Teachers face constant friction using integrated tools.

---

## Output format (in chat)

1) **Admin UX summary**
2) **Teacher/student UX summary (only as it affects admin outcomes)**
3) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

Proceed to `14_SECURITY_PRIVACY_COMPLIANCE.md`.
