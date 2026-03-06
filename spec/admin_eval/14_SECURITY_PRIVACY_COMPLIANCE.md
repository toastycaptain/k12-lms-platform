# 14 — Security, Privacy, Data Governance (Admin‑Required Controls) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS has production-grade security and privacy controls aligned with K–12 needs:
- least privilege and tenant/org isolation
- encryption and secret management hygiene
- data minimization for integrations
- export controls for PII
- retention and deletion workflows
- guardian/observer privacy boundaries (if applicable)

This is about **technical controls** visible in the codebase, not legal advice.

---

## What to locate

### Security controls (backend + infra)
Search for:
- authorization enforcement points (middleware/policies)
- secure headers, CSRF protections
- rate limiting, abuse prevention
- encryption:
  - TLS termination assumptions
  - at-rest encryption references (DB/storage)
- secrets management patterns:
  - environment variables, secret stores
  - absence of secrets in repo
- file/object storage handling (uploads, access control)
- API tokens/keys:
  - hashing
  - rotation
  - scopes
  - expiration

### Privacy/data governance
Search for:
- data classification flags (PII, FERPA, etc.)
- user data export endpoints and permission gates
- user deletion/deactivation behavior
- retention policy implementation (archive vs delete)
- anonymization / pseudonymization support
- integration claim filtering (LTI claims, roster fields)
- audit logs for data access/export

### Frontend
- permissions gating for exports and admin-only tools
- UI disclosures for data sharing settings (if any)

---

## Requirements to assess (score each 0–3)

### A. Least privilege enforcement is strong
- Privileged actions require explicit permissions.
- Sensitive permissions are separated:
  - impersonation
  - data exports
  - integration installs
  - role management

### B. Tenant/org isolation is enforced at the server layer
- No cross-tenant data access via API.
- Background jobs respect tenant scope.

### C. Sensitive data handling is careful
- Passwords hashed with modern KDF (if local auth exists).
- Secrets not logged.
- PII not over-shared to integrations by default.

### D. Export controls & auditability
- Exports require explicit admin permissions.
- Export actions are audited (who/what/when/scope).
- Download links are time-limited or access-controlled.

### E. Data lifecycle controls exist
- Deactivation vs deletion is supported appropriately.
- Retention for historical academic records is considered.
- User deletion (if supported) handles cascading references safely.

### F. Security event logging and monitoring hooks exist
- Auth failures tracked
- permission-denied events (optional)
- suspicious activity signals (optional)

---

## Red flags

- Hardcoded secrets or keys in repo.
- PII included in logs or analytics events without controls.
- Export endpoints missing auth or scope checks.
- Weak token handling (no expiration, no revocation).
- Tenant boundary enforced only by UI filters.

---

## Output format (in chat)

1) **Security/privacy posture summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Top security/privacy risks** (prioritized bullets with evidence)

Proceed to `15_SCORECARD_AND_FINAL_REPORT.md`.
