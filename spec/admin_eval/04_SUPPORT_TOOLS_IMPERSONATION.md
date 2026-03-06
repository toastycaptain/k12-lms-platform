# 04 — Support Tools: Impersonation (“Act As User”) & Troubleshooting (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Determine whether the LMS provides administrator/support tooling to:
- reproduce user issues via **impersonation**
- troubleshoot access/roster/content problems efficiently
- do so with strong safeguards and auditability

In production K–12 environments, impersonation is a major support accelerant **only if** it is safe, explicit, and logged.

---

## What to locate

### Backend
Search for:
- routes/actions: `impersonate`, `actAs`, `masquerade`, `sudo`, `switchUser`
- session/token logic that changes effective user
- permission checks: `canImpersonate`, `support:impersonate`, etc.
- auditing events for impersonation start/stop and actions taken while impersonating

### Frontend
Search for:
- “Act as user” UI elements in admin console
- banners/indicators that you are impersonating
- “Stop impersonating” actions
- restrictions: cannot impersonate super-admins, etc.

---

## Requirements to assess (score each 0–3)

### A. Impersonation exists and is permission-gated
- Only authorized roles can impersonate.
- Permission is distinct (not bundled with broad admin rights).

### B. Strong UX indicators and safe exit
- UI clearly shows impersonation mode.
- Easy to stop impersonating.
- Prevents accidental long-lived impersonation sessions.

### C. Auditing & accountability
- Logs record:
  - who initiated impersonation
  - target user
  - timestamps
  - source IP/user agent (if available)
  - actions performed during impersonation (ideal)
- Audit entries are immutable and queryable.

### D. Scope & safety constraints
- Cannot impersonate across tenant boundaries (if multi-tenant).
- Optional restrictions:
  - cannot impersonate certain privileged roles
  - cannot export data while impersonating (or logs heavily)
- Session/token design avoids leaking real user credentials.

### E. Support diagnostics beyond impersonation
Look for:
- user “access logs” / “activity logs”
- enrollment history and roster sync history
- content sync history (templates/blueprints)
- integration status pages (SIS/LTI/SSO)

---

## Red flags

- “Impersonation” implemented by simply changing `user_id` in session without audit logging.
- No visible banner → high risk of accidental actions.
- Impersonation actions not separately permissioned.
- No guardrails for tenant boundaries.

---

## Output format (in chat)

1) **What I found** (whether impersonation exists, how it works)
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Audit trail quality assessment** (brief)

Proceed to `05_AUTH_SSO_JIT_MFA.md`.
