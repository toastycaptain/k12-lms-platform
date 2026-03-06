# 10 — Tool Integrations: LTI (incl. LTI 1.3/Advantage), Installation Scopes, Privacy (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Assess whether the LMS can function as an ecosystem hub via **LTI integrations** with:
- account/district-level tool installs (standardization)
- course-level tool installs (controlled flexibility)
- modern LTI 1.3 flows (OIDC + JWT)
- Advantage services:
  - **Deep Linking** (teacher UX)
  - **NRPS** Names & Roles provisioning (rosters)
  - **AGS** Assignment & Grade Services (grade passback)
- strong privacy and auditing

---

## What to locate

### Backend
Search for:
- `lti`, `tool`, `external_app`, `external_tool`
- LTI 1.3 concepts:
  - `oidc`, `login_initiation`, `id_token`, `jwks`, `kid`, `jwt`
  - `platform`, `registration`, `deployment`, `client_id`, `issuer`
- Advantage services:
  - NRPS: `names_and_roles`, `memberships`
  - AGS: `line_items`, `scores`, `grades`
  - Deep Linking: `deep_linking`, `content_item`, `resource_link`
- tool configuration storage:
  - DB models for tool registrations/deployments
  - per-tenant/per-org/per-course scoping fields
- security:
  - key management, rotation, JWKS endpoint
  - nonce/state handling, replay protection
- privacy controls:
  - options to anonymize/hide user identifiers
  - selectable data sharing scopes
- audit logs for:
  - tool install/update/delete
  - launch events (optional but valuable)
  - grade passback events (optional but valuable)

### Frontend
Find:
- admin UI to install/manage tools at district/school levels
- course UI to add tools (if permitted)
- teacher workflow for Deep Linking (select content inside tool and embed)
- grade sync settings and error messaging

---

## Requirements to assess (score each 0–3)

### A. LTI support exists and is well-structured
- Clear module boundaries in code
- Documented configuration surfaces (even if internal docs)
- Secure storage of tool secrets/keys

### B. Installation scoping and governance
- Tools can be installed at:
  - district/account level (preferred)
  - school/org level (optional but valuable)
  - course level (optional, permission-gated)
- Permissions exist for who can install/manage tools.

### C. LTI 1.3 security correctness (core)
- OIDC login initiation flow handled correctly.
- JWT verification with issuer/audience checks.
- JWKS keyset support and key rotation plan.
- Replay protection (state/nonce).
- Strict redirect URI validation.

### D. Advantage services support (as applicable)
Assess presence and maturity:
- Deep Linking endpoints and payload handling
- NRPS roster provisioning endpoints and role mapping
- AGS grade passback endpoints and gradebook integration

### E. Gradebook integration quality
- Mapping of tool line items to internal assignments.
- Handling of retries, duplicates, score updates.
- Error reporting for teachers/admins.

### F. Privacy & data minimization
- Default launch claims minimize PII (or are configurable).
- Controls exist to limit:
  - names/emails
  - stable IDs
  - roster exposure (NRPS)
- Data sharing settings are scoping-aware (district policy).

### G. Auditing & monitoring of tool integrations
- Install changes are auditable (who/when/where).
- Launches and grade passback have logs/metrics (at least at system level).
- Admins can troubleshoot tool issues.

---

## Admin-focused edge cases

- District installs tool but disables it for certain schools.
- Teachers want a tool but district restricts: clear UX.
- Multiple tools with overlapping grade passback: conflict resolution.
- Student data sharing compliance (what claims are sent).

---

## Red flags

- Tool install permissions are overly broad.
- LTI 1.3 verification is incomplete (no nonce/state, weak JWT checks).
- Tool secrets stored in plaintext or checked into repo.
- No audit trail for tool configuration changes.
- Deep Linking not supported → poor teacher UX.

---

## Output format (in chat)

1) **LTI architecture summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Security & privacy assessment** (short)

Proceed to `11_ANALYTICS_REPORTING_EXPORTS_CALIPER.md`.
