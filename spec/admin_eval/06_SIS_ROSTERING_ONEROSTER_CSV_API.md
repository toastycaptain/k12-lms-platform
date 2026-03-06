# 06 — SIS & Rostering: OneRoster, CSV Imports, APIs, Sync Reliability (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS can reliably mirror SIS structures at scale with minimal admin labor:
- automated rostering (OneRoster or similar)
- robust import/export fallbacks (CSV)
- sync scheduling, idempotency, error handling, auditability
- safe handling of adds/changes/drops

This is where most district LMS implementations succeed or fail.

---

## What to locate

### Integration surface
Search for:
- `oneroster`, `OneRoster`, `ims`, `rostering`, `sis`, `sync`, `provisioning`
- endpoints or clients for OneRoster:
  - REST endpoints (if acting as provider)
  - clients to fetch from SIS (if acting as consumer)
- mapping layers:
  - SIS entities → internal models (schools/classes/users/enrollments/terms)
- job scheduler for periodic sync:
  - cron jobs, queue workers, scheduled tasks

### Data model
Confirm the presence (or mapping equivalents) of:
- `orgs` (schools/districts)
- `academicSessions` (terms/years)
- `classes` (sections)
- `users`
- `enrollments` / `memberships`
- `roles` within classes

### Admin UI
Look for:
- SIS integration configuration
- sync status, last run time, next run time
- error reports with actionable details
- manual “run sync now”
- dry-run/preview for imports (ideal)

---

## Requirements to assess (score each 0–3)

### A. Automated rostering exists (OneRoster or equivalent)
- Supports importing:
  - org structure
  - courses/sections/classes
  - users (students/staff)
  - enrollments (memberships)
  - terms/academic sessions
- Clearly documents which objects are authoritative from SIS.

### B. Sync design is idempotent and safe
- Uses stable external IDs to upsert (not name/email matching).
- Handles repeated runs without duplication.
- Handles deletes/drops:
  - soft-delete / disable vs hard delete
  - enrollment end dates
- Prevents cross-tenant contamination.

### C. Scheduling + operational controls
- scheduled sync (daily/hourly) supported
- manual sync supported
- pause/disable sync supported (for emergency)

### D. Error handling & retry strategy
- failed syncs produce:
  - visible errors in admin UI
  - logs with correlation IDs
- retries exist and avoid infinite loops
- partial failure behavior is safe (e.g., transaction boundaries, batch commits)

### E. Auditability
- every sync run has:
  - start/end timestamps
  - initiating actor (system vs admin)
  - counts (created/updated/deleted)
  - error summaries
  - links to raw error details

### F. CSV import/export fallback
- CSV schema defined (users/courses/sections/enrollments/terms)
- validations (required columns, data types)
- safe handling of duplicates
- preview/dry-run (strongly preferred)
- export tools for reconciliation with SIS

### G. API support for provisioning (optional but valuable)
- API endpoints for programmatic provisioning exist and are secured.
- rate limiting and audit logs exist for provisioning APIs.

---

## Admin-critical edge cases to verify

- Handling student transfers (school change mid-year)
- Staff teaching multiple schools
- Co-teaching / multiple teachers per section
- Cross-listed sections
- “Observer/guardian” links (if supported)
- Term boundaries and future-scheduled enrollments
- Data rollback strategy if a sync goes wrong

---

## Red flags

- Sync keyed on email only.
- No visible sync status/errors for admins.
- No run history; only logs in stdout.
- Hard-delete students on drop (often wrong for records retention).
- No safeguards around “authoritative source” leading to LMS edits being overwritten.

---

## Output format (in chat)

1) **SIS/rostering architecture summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Reliability assessment** (idempotency, batching, retries, audit)

Proceed to `07_SCHOOL_YEAR_ROLLOVER_TERMS.md`.
