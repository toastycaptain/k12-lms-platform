# 11 — Analytics, Reporting, Exports, Event Data (Caliper‑like) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether administrators can get **system-level visibility** and exports needed for:
- adoption and engagement monitoring
- identifying inactive courses/users
- intervention signals (low engagement/grades, missing submissions)
- compliance and records requests
- downstream BI/warehouse integration

This includes both **dashboards** (frontend) and **datasets/exports** (backend).

---

## What to locate

### Backend
Search for:
- `analytics`, `report`, `dashboard`, `insights`, `metrics`
- prebuilt reports:
  - “zero activity”
  - access logs
  - grade/engagement summaries
- export pipelines:
  - CSV exports
  - dataset exports
  - scheduled exports
- event collection:
  - event tables (`events`, `activity`, `caliper`)
  - message bus topics (Kafka/etc.)
  - ETL jobs
- scoping logic:
  - district vs school vs course vs teacher access
- privacy:
  - PII handling in exports
  - redaction options
  - audit logs for exports

### Frontend
Find:
- admin analytics pages
- report generation UI (filters, date ranges, org scoping)
- export UI (download links, background job status)

---

## Requirements to assess (score each 0–3)

### A. Admin analytics dashboards exist (district/school)
- Engagement/adoption over time
- Active users, logins, course activity
- Drill-down by school/course/teacher

### B. Operational reports exist
Examples:
- users who haven’t logged in
- courses with zero activity
- roster anomalies (optional)
- tool integration errors (optional)

### C. Data exports are robust and scalable
- Exports run asynchronously (jobs) for large datasets.
- Admin can select scope (district/school/term).
- Exports include consistent schema and timestamps.
- Rate limiting and access control enforced.

### D. Event data model supports cross-tool analytics
- LMS emits structured events for key activities:
  - login, page views, assignment submissions, grading, tool launches
- Events can be exported or streamed.

(If Caliper is not explicitly used, assess whether there is an equivalent standard/structured event approach.)

### E. Privacy controls for analytics and exports
- Only authorized roles can export PII.
- Exports are logged (who/when/what scope).
- Optional de-identification / anonymized exports exist (strongly preferred).

---

## Admin-focused edge cases

- District admin wants all schools; school admin limited to one school.
- Export includes archived terms but excluded by default.
- Extremely large export: chunking, pagination, compression.
- Students with special privacy flags (if supported).

---

## Red flags

- Analytics only exists per-course (no district visibility).
- Exports are synchronous and time out.
- Export endpoints don’t log access or don’t enforce scope.
- Event tracking exists but is inconsistent or lacks stable identifiers.

---

## Output format (in chat)

1) **Analytics/reporting summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Data governance notes** (PII in exports, auditability)

Proceed to `12_AUDIT_LOGS_OBSERVABILITY.md`.
