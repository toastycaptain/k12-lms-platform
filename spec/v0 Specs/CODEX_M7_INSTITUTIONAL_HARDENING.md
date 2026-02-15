# Codex Instructions — M7: Institutional Hardening Completion

## Objective

Complete Milestone 7 (Institutional Hardening) from ~30% to 100%. The audit logging infrastructure exists. What remains is: OneRoster integration (client, sync jobs, admin UI), LTI models and registration flow, data retention policies, and governance admin screens (admin dashboard, school setup, users & roles).

---

## What Already Exists (DO NOT recreate)

### Audit Logging — COMPLETE
- `apps/core/app/models/audit_log.rb` — immutable audit record model
- `apps/core/app/services/audit_logger.rb` — logging service
- `apps/core/db/migrate/20260214143000_create_audit_logs.rb` — migration with legacy column handling
- `apps/core/spec/models/audit_log_spec.rb` — tests
- `apps/core/spec/factories/audit_logs.rb` — factory
- `apps/core/app/controllers/application_controller.rb` — `audit_event` helper method

### Database Tables in schema.rb (NO migrations, NO models)

#### lti_registrations
```
id, auth_login_url (string, not null), auth_token_url (string, not null), client_id (string, not null),
created_at, created_by_id (bigint, not null), deployment_id (string, not null), description (text),
issuer (string, not null), jwks_url (string, not null), name (string, not null),
settings (jsonb, default: {}), status (string, default: "inactive"), tenant_id (bigint, not null), updated_at
Indexes: [tenant_id, client_id] (named idx_lti_registrations_tenant_client), [tenant_id], [created_by_id]
Foreign keys: tenants, users (created_by_id)
```

#### lti_resource_links
```
id, course_id (bigint, nullable), created_at, custom_params (jsonb, default: {}), description (text),
lti_registration_id (bigint, not null), tenant_id (bigint, not null), title (string, not null),
updated_at, url (string)
Indexes: [course_id], [lti_registration_id], [tenant_id]
Foreign keys: courses, lti_registrations, tenants
```

#### data_retention_policies
```
id, action (string, not null), created_at, created_by_id (bigint, not null), enabled (boolean, default: true),
entity_type (string, not null), name (string, not null), retention_days (integer, not null),
settings (jsonb, default: {}), tenant_id (bigint, not null), updated_at
Indexes: [tenant_id], [created_by_id]
Foreign keys: tenants, users (created_by_id)
```

### Previously Deleted Code (available in git history for reference)

The following files were deleted in commit `f5ed814` (cross-milestone security improvements) but can be referenced via `git show`:

- `OneRosterClient` — full OAuth2 client_credentials flow, paginated API calls for orgs, users, classes, enrollments, academic sessions. Used Faraday. Reference: `git show baa6bbd:apps/core/app/services/one_roster_client.rb`
- `OneRosterOrgSyncJob` — synced orgs → Schools, academic sessions → AcademicYears/Terms. Reference: `git show baa6bbd:apps/core/app/jobs/one_roster_org_sync_job.rb`
- `OneRosterUserSyncJob` — synced users → Users with role mapping, classes → Courses/Sections, enrollments → Enrollments. Reference: `git show baa6bbd:apps/core/app/jobs/one_roster_user_sync_job.rb`
- `TenantDataExportJob` — exported tenant data to ZIP with sanitized sensitive fields. Reference: `git show 454f60b:apps/core/app/jobs/tenant_data_export_job.rb`

### Sync Infrastructure (from M5, reusable)
- `app/models/integration_config.rb` — supports `provider: "oneroster"` in addition to `"google_classroom"`
- `app/models/sync_mapping.rb` — tracks local ↔ external ID mappings
- `app/models/sync_run.rb` — execution records with status tracking
- `app/models/sync_log.rb` — detailed log entries
- `app/controllers/api/v1/integration_configs_controller.rb` — CRUD + sync triggers
- `app/controllers/api/v1/sync_runs_controller.rb` — sync history
- Frontend: `src/app/admin/integrations/page.tsx` — integration setup UI

---

## Tasks to Complete

### Task 1: Create Migrations for 3 Orphaned Tables

Like M6, these tables exist in schema.rb but have no migration files.

**Create:** `apps/core/db/migrate/20260215100001_create_lti_registrations.rb`
**Create:** `apps/core/db/migrate/20260215100002_create_lti_resource_links.rb`
**Create:** `apps/core/db/migrate/20260215100003_create_data_retention_policies.rb`

Use `create_table ... unless table_exists?(:table_name)` pattern (see `20260214143000_create_audit_logs.rb`).

Match exact columns, types, indexes, and foreign keys from schema.rb (listed above).

### Task 2: Create LTI Models

**Create:** `apps/core/app/models/lti_registration.rb`
```ruby
class LtiRegistration < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active inactive].freeze

  belongs_to :created_by, class_name: "User"
  has_many :lti_resource_links, dependent: :destroy

  validates :name, presence: true
  validates :issuer, presence: true
  validates :client_id, presence: true
  validates :deployment_id, presence: true
  validates :auth_login_url, presence: true
  validates :auth_token_url, presence: true
  validates :jwks_url, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
```

**Create:** `apps/core/app/models/lti_resource_link.rb`
```ruby
class LtiResourceLink < ApplicationRecord
  include TenantScoped

  belongs_to :lti_registration
  belongs_to :course, optional: true

  validates :title, presence: true
end
```

### Task 3: Create Data Retention Policy Model and Enforcement Job

**Create:** `apps/core/app/models/data_retention_policy.rb`
```ruby
class DataRetentionPolicy < ApplicationRecord
  include TenantScoped

  VALID_ACTIONS = %w[archive delete anonymize].freeze
  VALID_ENTITY_TYPES = %w[AuditLog AiInvocation SyncLog SyncRun QuizAttempt Submission].freeze

  belongs_to :created_by, class_name: "User"

  validates :name, presence: true
  validates :entity_type, presence: true, inclusion: { in: VALID_ENTITY_TYPES }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :retention_days, presence: true, numericality: { greater_than: 0 }
end
```

**Create:** `apps/core/app/jobs/data_retention_enforcement_job.rb`
- Iterate all enabled `DataRetentionPolicy` records across all tenants
- For each policy, find records of `entity_type` older than `retention_days`
- Apply the action: `delete` removes records, `archive` sets an `archived_at` if column exists, `anonymize` redacts PII fields
- Log results via `AuditLogger`

### Task 4: Restore OneRoster Integration

Re-create the OneRoster client and sync jobs. Reference the deleted code from git history but improve it.

**Create:** `apps/core/app/services/one_roster_client.rb`
- OAuth2 client_credentials authentication
- Endpoints: `get_all_orgs`, `get_all_users`, `get_all_classes`, `get_all_enrollments`, `get_all_academic_sessions`
- Paginated fetching with configurable limit/offset
- Uses Faraday with JSON request/response
- Custom `OneRosterError` exception class
- Token caching via `Rails.cache`

**Create:** `apps/core/app/jobs/one_roster_org_sync_job.rb`
- Pull orgs (type: "school") → create/update `School` records via `SyncMapping`
- Pull academic sessions → create/update `AcademicYear` and `Term` records
- Track progress via `SyncRun` (records_processed, records_succeeded, records_failed)
- Log via `SyncLog` (log_info, log_warn, log_error)

**Create:** `apps/core/app/jobs/one_roster_user_sync_job.rb`
- Pull users → create/update `User` records, assign roles based on OneRoster role field
- Pull classes → create/update `Course` and `Section` records
- Pull enrollments → create/update `Enrollment` records
- Map OneRoster roles: "teacher" → teacher, "student" → student, "administrator" → admin
- Track via SyncRun/SyncLog

**Add `gem "faraday"` to Gemfile** if not already present.

### Task 5: Create LTI Controllers

**Create:** `apps/core/app/controllers/api/v1/lti_registrations_controller.rb`
- Standard CRUD (index, show, create, update, destroy)
- Additional: `activate`, `deactivate`
- Strong params: `name, issuer, client_id, deployment_id, auth_login_url, auth_token_url, jwks_url, description, status, settings: {}`

**Create:** `apps/core/app/controllers/api/v1/lti_resource_links_controller.rb`
- Standard CRUD, nested under lti_registration
- Strong params: `title, description, url, course_id, custom_params: {}`

**Create:** `apps/core/app/controllers/api/v1/data_retention_policies_controller.rb`
- Standard CRUD
- Additional: `POST :enforce` — triggers `DataRetentionEnforcementJob.perform_later` for the specific policy
- Strong params: `name, entity_type, action, retention_days, enabled, settings: {}`

### Task 6: Create Pundit Policies for New Models

**Create:** `apps/core/app/policies/lti_registration_policy.rb` — admin only for all actions
**Create:** `apps/core/app/policies/lti_resource_link_policy.rb` — admin for CUD, teachers can view
**Create:** `apps/core/app/policies/data_retention_policy_policy.rb` — admin only

### Task 7: Add Routes

**Add to** `apps/core/config/routes.rb` inside the `namespace :api -> namespace :v1` block:

```ruby
resources :lti_registrations, only: [:index, :show, :create, :update, :destroy] do
  member do
    post :activate
    post :deactivate
  end
  resources :lti_resource_links, only: [:index, :show, :create, :update, :destroy]
end
resources :data_retention_policies, only: [:index, :show, :create, :update, :destroy] do
  member do
    post :enforce
  end
end
```

### Task 8: Create Admin Governance Pages (Frontend)

**Create:** `apps/web/src/app/admin/dashboard/page.tsx` — Admin Dashboard
- System health overview: total users, courses, active integrations, recent sync status
- Quick links: Users & Roles, School Setup, Integrations, AI Settings
- Recent audit log entries (GET `/api/v1/audit_logs?limit=10`)
- Integration status cards (active/inactive for Google Classroom, OneRoster, LTI)

**Create:** `apps/web/src/app/admin/school/page.tsx` — School Setup
- List schools (GET from a schools endpoint or tenant settings)
- Edit school: name, address, timezone
- Academic year management: list/create/edit academic years and terms

**Create:** `apps/web/src/app/admin/users/page.tsx` — Users & Roles
- List users with role badges (GET users endpoint, filterable by role)
- Create user form: email, first_name, last_name, role assignment
- Edit user: update details, add/remove roles
- Bulk import placeholder (shows "OneRoster sync available" if integration configured)

**Create:** `apps/web/src/app/admin/lti/page.tsx` — LTI Management
- List LTI registrations with status badges
- Create/edit registration form: name, issuer, client_id, deployment_id, URLs
- Activate/deactivate toggle
- Resource links list per registration

**Create:** `apps/web/src/app/admin/retention/page.tsx` — Data Retention Policies
- List policies with entity_type, retention_days, action, enabled status
- Create/edit form: name, entity_type (dropdown), action (dropdown), retention_days, enabled toggle
- "Run Now" button per policy (triggers enforce)

**Update:** `apps/web/src/components/AppShell.tsx`
- Expand "Admin" section in sidebar:
  - Dashboard → `/admin/dashboard`
  - School Setup → `/admin/school`
  - Users & Roles → `/admin/users`
  - Integrations → `/admin/integrations` (existing)
  - AI Settings → `/admin/ai` (from M6)
  - LTI → `/admin/lti`
  - Data Retention → `/admin/retention`
  - Curriculum Map → `/admin/curriculum-map` (existing)
  - Approval Queue → `/admin/approvals` (existing)

### Task 9: Update OneRoster Admin Integration Page

**Modify:** `apps/web/src/app/admin/integrations/page.tsx`

Add a second integration card/section for OneRoster alongside the existing Google Classroom section:
- Setup form: base_url, client_id, client_secret (password field)
- Provider: `"oneroster"`
- Sync buttons: "Sync Organizations", "Sync Users & Enrollments"
- Sync history link to `/admin/integrations/sync`

### Task 10: Create Factories and Specs

**Create factories:**
- `apps/core/spec/factories/lti_registrations.rb`
- `apps/core/spec/factories/lti_resource_links.rb`
- `apps/core/spec/factories/data_retention_policies.rb`

**Create request specs:**
- `apps/core/spec/requests/api/v1/lti_registrations_spec.rb`
- `apps/core/spec/requests/api/v1/lti_resource_links_spec.rb`
- `apps/core/spec/requests/api/v1/data_retention_policies_spec.rb`

**Create job specs:**
- `apps/core/spec/jobs/one_roster_org_sync_job_spec.rb`
- `apps/core/spec/jobs/one_roster_user_sync_job_spec.rb`
- `apps/core/spec/jobs/data_retention_enforcement_job_spec.rb`

**Create policy specs:**
- `apps/core/spec/policies/lti_registration_policy_spec.rb`
- `apps/core/spec/policies/data_retention_policy_policy_spec.rb`

---

## Architecture Rules

1. All models MUST include `TenantScoped`
2. All controller actions MUST call `authorize` or use `policy_scope`
3. OneRoster sync jobs MUST use the existing `SyncRun`/`SyncLog`/`SyncMapping` infrastructure
4. OneRoster credentials (client_secret) stored in `IntegrationConfig.settings` (jsonb) — consider encrypting sensitive fields
5. LTI registration secrets should use Rails encryption where possible
6. Data retention enforcement MUST NOT delete records without an audit trail — log via `AuditLogger` before acting
7. Admin pages use `<ProtectedRoute>` and `<AppShell>`
8. Frontend uses `apiFetch` from `apps/web/src/lib/api.ts`

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/lti_registrations_spec.rb spec/requests/api/v1/data_retention_policies_spec.rb spec/jobs/one_roster_org_sync_job_spec.rb spec/jobs/one_roster_user_sync_job_spec.rb spec/jobs/data_retention_enforcement_job_spec.rb
cd apps/web && npm run build
```

---

## Definition of Done

- [ ] 3 migration files (conditional, idempotent)
- [ ] LtiRegistration and LtiResourceLink models with TenantScoped
- [ ] DataRetentionPolicy model with enforcement job
- [ ] OneRosterClient service restored with OAuth2 + pagination
- [ ] OneRoster org and user sync jobs restored
- [ ] LTI and data retention controllers with CRUD
- [ ] Pundit policies for all new models
- [ ] Routes registered
- [ ] Admin Dashboard page with system overview
- [ ] School Setup page
- [ ] Users & Roles management page
- [ ] LTI management page
- [ ] Data Retention management page
- [ ] OneRoster section added to Integrations page
- [ ] AppShell sidebar updated with all new admin links
- [ ] Factories and specs for all new resources
- [ ] No lint errors
