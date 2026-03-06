# 12 — Audit Logs, System Logs, Observability, Integration Run History (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS provides the **accountability and traceability** administrators require:
- audit trails (“who changed what, when, where”)
- system logs for troubleshooting
- integration run history (SIS sync, LTI installs, template sync)
- observability (metrics/tracing) for reliability at scale

---

## What to locate

### Backend
Search for:
- `audit`, `audit_log`, `event_log`, `system_log`, `activity_log`
- audit event schema:
  - event type
  - actor id
  - target object/type/id
  - timestamp
  - org/tenant scope
  - metadata (before/after snapshots, IP, user agent)
- log sink integration:
  - structured logging (JSON)
  - correlation/request IDs
- job run history:
  - tables for job executions (sync runs, exports, template syncs)
- observability:
  - metrics (Prometheus/OpenTelemetry/etc.)
  - tracing middleware
  - error reporting hooks

### Frontend (admin)
Find:
- audit log viewer UI
- filtering by user/org/time/event
- drilldown to event detail
- integration status pages (last sync, errors)

### Infra/config
- log retention configuration
- PII redaction in logs
- access controls for logs

---

## Requirements to assess (score each 0–3)

### A. Audit log exists and is comprehensive
Audit events for at least:
- user creation/updates/deactivation
- role/permission changes
- course/section creation/archival
- roster imports/sync runs
- tool installs/changes (LTI)
- content template sync actions
- exports of sensitive data

### B. Audit events are immutable and queryable
- Stored in DB or append-only log store with retention.
- Searchable by admins with proper permissions.
- Cannot be edited casually.

### C. Integration run history is admin-visible
- SIS sync run history with counts/errors
- template sync history
- export job history
- tool registration changes

### D. Observability is production-grade
- request IDs and correlation IDs exist
- key job metrics exist (success/failure, durations)
- error reporting is centralized
- logs are structured

### E. Privacy-conscious logging
- PII is minimized in logs
- sensitive payloads are redacted
- access to logs is restricted and audited

---

## Red flags

- Only raw server logs exist; no structured audit events.
- No UI to view audit/integration history.
- Admins cannot trace which sync changed a roster.
- Logs contain full PII payloads or tokens.

---

## Output format (in chat)

1) **Logging/audit architecture summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Operational readiness notes** (diagnostics, run history, observability)

Proceed to `13_ADMIN_UI_TEACHER_STUDENT_UX.md`.
