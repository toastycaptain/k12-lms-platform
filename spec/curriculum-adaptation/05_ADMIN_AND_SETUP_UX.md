# Admin and Setup UX

## Admin Controls
## `/admin/curriculum-profiles` (new or expanded admin route)
Required sections:
1. Tenant default profile selector.
2. School override table (school + override key + effective preview).
3. Profile pack upload/import actions.
4. Save confirmation and audit event notice.

All curriculum controls are visible only to admin accounts.
No curriculum selectors/toggles/forms are shown to non-admin roles.

## Existing Admin Pages to Update
- `/admin/school`: show/edit `curriculum_profile_key` (admin-only).
- `/admin/provisioning`: include initial tenant default profile selection (admin-only).

## Setup Flow Updates
- Admin onboarding includes optional curriculum setup step.
- Non-admin onboarding receives derived summary only (no editable controls).

## UX Guardrails
- Display effective profile source (`course`, `school`, `tenant`, `system`) for admin troubleshooting.
- Block save when provided profile key fails validation.
- Show clear fallback behavior when school/course has no explicit profile.
