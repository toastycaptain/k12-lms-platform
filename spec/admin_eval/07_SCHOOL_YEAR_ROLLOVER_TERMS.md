# 07 — School Year Rollover, Terms, Grading Periods, Archiving (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Evaluate whether the LMS treats the academic year lifecycle as a first-class admin workflow:
- academic years, terms, grading periods
- creating the new year (rollover)
- archiving and retaining prior year data
- copying course shells/templates safely
- preventing “ghost” enrollments across years

K–12 operations are cyclical; rollover pain drives admin dissatisfaction.

---

## What to locate

### Backend
Search for models/tables:
- `AcademicYear`, `Term`, `AcademicSession`, `GradingPeriod`, `MarkingPeriod`
- fields: `start_date`, `end_date`, `is_active`, `status`, `school_year`
- rollover processes:
  - copy/clone courses
  - archive courses/sections
  - carry over templates/blueprints
  - reset gradebooks (if applicable)
- scheduled tasks that close terms or enforce start/end boundaries
- retention/deletion policies tied to academic years

### Frontend (admin)
Look for:
- term/year management screens
- “set active year” / “activate term” controls
- rollover wizard/steps (if any)
- course archive and restore actions

---

## Requirements to assess (score each 0–3)

### A. Academic structure is explicitly modeled
- academic year + terms exist as entities
- courses/sections belong to a term/year
- enrollments have effective dates or term linkage

### B. Active year/term concept exists
- admin can set what’s active for rostering and UI defaults
- prevents accidental provisioning into the wrong year

### C. Rollover workflow exists (manual or automated)
- supports:
  - creating new term/year
  - copying course shells (optionally from templates)
  - preserving teacher edits where intended
  - re-associating SIS sync mappings to new year
- has clear, auditable steps

### D. Archiving & retention behavior
- prior year courses can be archived (read-only) while still accessible to authorized roles
- retention policy supports district needs
- exporting is possible for records requests

### E. Boundary enforcement
- term end prevents:
  - new submissions (if policy)
  - editing grades (if policy)
  - roster changes (if policy)
- future enrollments activate at term start

---

## Edge cases to verify

- Mid-year term changes without breaking gradebook links
- Multiple terms in a year (semester/quarter)
- Summer school sessions overlapping
- Teacher access to archived courses
- Student access to past work (policy-driven)

---

## Red flags

- Terms are just labels with no start/end enforcement.
- Rollover requires manual DB edits or scripts with no UI/audit.
- Archiving deletes content or breaks links.
- SIS sync cannot be pointed cleanly at the new year.

---

## Output format (in chat)

1) **Academic-year model summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Rollover readiness assessment** (what’s easy, what’s risky)

Proceed to `08_CONTENT_GOVERNANCE_TEMPLATES_REPOSITORY.md`.
