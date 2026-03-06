# 05 — Authentication: SSO/IdP, JIT Provisioning, Attribute Mapping, MFA (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Evaluate whether authentication and identity management support real K–12 requirements:
- SSO (SAML, OIDC/OAuth2) + common K–12 providers (e.g., Google/Microsoft/Clever-style patterns)
- Just-In-Time (JIT) provisioning (optional but valuable)
- attribute mapping (names, emails, SIS IDs, org affiliations)
- MFA enforcement options
- account linking / deduplication handling

This is critical to reduce tickets and secure the platform.

---

## What to locate

### Backend
- auth middleware, strategies, adapters
- SAML configs (metadata endpoints, ACS routes)
- OIDC/OAuth configs (well-known, callback routes)
- user provisioning code paths:
  - first login creates user
  - mapping external IDs to internal user IDs
  - handling of email changes
- MFA implementation:
  - TOTP/WebAuthn/SMS (if any)
  - enforcement policies (per tenant/org)
- account linking/merge logic
- session management:
  - cookie settings, refresh token patterns
  - logout/invalidation
- service accounts / API tokens:
  - issuance, scopes, expiration, revocation

### Frontend
- login flows and provider selection
- admin settings UI for auth providers
- error handling UX for common identity problems (duplicate accounts, missing attributes)

### Config/infra
- environment variables for IdPs
- secrets management approach (do not reveal secrets; only note patterns)
- per-tenant provider configs if multi-tenant

---

## Requirements to assess (score each 0–3)

### A. Supports enterprise SSO patterns
- SAML and/or OIDC supported with per-tenant configuration.
- Clear separation of tenants/districts when configuring providers.

### B. Attribute mapping & identity linking
- External identifiers supported:
  - stable external subject ID
  - SIS IDs (student/staff IDs)
  - optional username/email
- Mapping is configurable and resilient to email changes.

### C. JIT provisioning (if present)
- On first login, user can be created and assigned:
  - org/school association (if possible)
  - default roles
- JIT does not silently grant overly-broad permissions.

### D. MFA policy support
- MFA available (or enforceable via IdP).
- Platform supports policy:
  - require MFA for admins
  - optional for others
- Recovery flows exist (admin recovery without bypass risk).

### E. Secure session/token design
- HttpOnly/SameSite cookie settings (if web session)
- refresh token rotation (if applicable)
- token revocation / logout invalidation
- audit events for logins, failures, MFA changes

### F. Admin-facing identity troubleshooting
- visibility into:
  - last login time
  - auth provider used
  - external IDs linked
  - account status (locked/disabled)
- safe tools to resolve duplicates without data loss (even if manual)

---

## Red flags

- Email is the only identifier (fragile in districts).
- No tenant-aware provider separation.
- JIT provisioning auto-creates users with admin privileges.
- No logging for auth events and provider errors.
- Tokens never expire or cannot be revoked.

---

## Output format (in chat)

1) **Auth architecture summary** (providers, storage, flows)
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Security posture notes** (short bullets)

Proceed to `06_SIS_ROSTERING_ONEROSTER_CSV_API.md`.
