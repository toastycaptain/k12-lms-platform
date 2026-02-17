# Authentication Failures Runbook

## Scope
Login failures, session persistence issues, OAuth/SAML callback failures.

## Detection
- Alert: auth failure metric spikes (`auth.failure`).
- User reports of repeated redirect loops or unauthorized responses.
- Error logs from `SessionsController` callback flows.

## Triage Steps
1. Check `/auth/:provider/callback` failure rates by provider.
2. Validate session cookie settings:
   - Cookie name: `_k12_lms_session`
   - Domain, secure, and SameSite behavior
3. For SAML:
   - verify IdP metadata and certificate validity
   - check NameID/email attribute mapping
4. For OAuth:
   - verify client id/secret and redirect URI registration
5. Confirm server clocks are in sync (clock skew can break assertions/tokens).

## Common Causes
- Expired SAML certificate.
- Invalid OAuth redirect URI or revoked credentials.
- Tenant resolution mismatch from callback host/slug.
- Cookie domain mismatch after deploy/environment change.

## Recovery
1. Restore valid IdP/OAuth configuration.
2. Rotate credentials when compromised or revoked.
3. Re-test callback flow in staging and production.
4. Force fresh sign-in by clearing sessions for impacted users if needed.

## Escalation
- Escalate immediately if failure rate is > 50% for > 10 minutes.
- Notify district admins if tenant-specific SSO integration is impacted.
