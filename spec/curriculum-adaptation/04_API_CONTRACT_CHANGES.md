# API Contract Changes

## New Endpoints
### `GET /api/v1/curriculum_profiles`
Returns available profile definitions (key, label, version, description, taxonomy metadata).

### `GET /api/v1/admin/curriculum_settings`
Returns:
- tenant default profile key,
- school override map,
- effective fallback metadata.

### `PUT /api/v1/admin/curriculum_settings`
Accepts:
- tenant default profile key,
- school override updates,
- optional import/upload references.

## Extended Existing Resources
### School payload
Add field: `curriculum_profile_key`.

### Course payload
Add fields:
- `school_id`
- `effective_curriculum_profile_key`
- `effective_curriculum_source`

### Course input
Allow:
- `school_id`
- optional `settings.curriculum_profile_key` (admin-only mutation path).

## Authorization Matrix (Final)
Admin-only:
- GET /api/v1/curriculum_profiles
- GET /api/v1/admin/curriculum_settings
- PUT /api/v1/admin/curriculum_settings
- Any curriculum/framework/profile import or upload endpoint
- Any curriculum/framework/profile create/update/delete endpoint

Non-admin roles (teacher/student/guardian/curriculum_lead):
- No direct curriculum configuration endpoints
- Read only derived fields embedded in authorized domain endpoints
  (e.g., effective profile key/labels in course/planner responses).

## Interface Clarifications
- `curriculum_lead` is a read-only consumer in this initiative.
- Teacher/student/guardian are read-only consumers.
- Admin is the only role allowed to:
  - choose active curriculum profile,
  - upload/import framework/profile data,
  - modify curriculum mappings/settings.
