# CODEX_TENANT_PROVISIONING — Automated School Onboarding and Tenant Setup

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-6 (Admin Problems — reduce tool sprawl), PRD-9 (Multi-tenancy), TECH-2.3 (Tenancy)
**Depends on:** CODEX_SECURITY_AUDIT_FINAL (verified secure), CODEX_BACKUP_RESTORE_AUTOMATION (backup before provisioning)

---

## Problem

Onboarding a new school requires manual database operations:

1. **No provisioning wizard** — creating a tenant requires Rails console commands
2. **No admin bootstrap** — first admin user must be manually created and role-assigned
3. **No data migration tools** — schools switching from other LMS have no import path
4. **No default configuration** — each new tenant needs roles, permissions, AI policies, and integration configs manually set up
5. **No school branding** — no way to customize logo, colors, or school name per tenant
6. **No onboarding verification** — no checklist confirming a school is fully configured
7. **No bulk school creation** — district deployments require creating 10+ tenants one at a time

---

## Tasks

### 1. Create Tenant Provisioning Service

Create `apps/core/app/services/tenant_provisioning_service.rb`:

```ruby
class TenantProvisioningService
  DEFAULT_ROLES = %w[admin teacher student curriculum_lead guardian].freeze
  DEFAULT_PERMISSIONS = {
    admin: { all: %w[read create update delete publish approve manage] },
    teacher: {
      unit_plans: %w[read create update delete publish],
      lesson_plans: %w[read create update delete],
      courses: %w[read],
      assignments: %w[read create update delete publish],
      submissions: %w[read update],
      quizzes: %w[read create update delete publish],
      discussions: %w[read create update],
      resources: %w[read create update delete],
      portfolios: %w[read],
    },
    student: {
      courses: %w[read],
      assignments: %w[read],
      submissions: %w[read create],
      quizzes: %w[read],
      discussions: %w[read create],
      resources: %w[read],
      portfolios: %w[read create update],
    },
    curriculum_lead: {
      unit_plans: %w[read create update delete publish approve],
      templates: %w[read create update delete publish],
      standards: %w[read create update],
      approvals: %w[read update],
    },
    guardian: {
      portfolios: %w[read],
      submissions: %w[read],
    },
  }.freeze

  def initialize(params)
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      tenant = create_tenant
      school = create_school(tenant)
      roles = create_roles(tenant)
      create_permissions(tenant, roles)
      admin = create_admin_user(tenant, roles[:admin])
      create_academic_year(tenant, school)
      create_default_ai_policies(tenant)
      create_default_standard_frameworks(tenant)
      create_onboarding_checklist(tenant)

      {
        tenant: tenant,
        school: school,
        admin: admin,
        setup_url: "/setup?token=#{generate_setup_token(admin)}",
      }
    end
  end

  private

  def create_tenant
    Tenant.create!(
      name: @params[:school_name],
      subdomain: @params[:subdomain],
      status: "active",
      settings: {
        branding: {
          logo_url: @params[:logo_url],
          primary_color: @params[:primary_color] || "#1e40af",
          school_name: @params[:school_name],
        },
        features: {
          ai_enabled: @params[:ai_enabled] != false,
          google_integration: @params[:google_enabled] != false,
          portfolio_enabled: true,
          guardian_portal_enabled: true,
        },
      },
    )
  end

  def create_admin_user(tenant, admin_role)
    Current.tenant = tenant
    user = User.create!(
      email: @params[:admin_email],
      first_name: @params[:admin_first_name] || "Admin",
      last_name: @params[:admin_last_name] || @params[:school_name],
      tenant: tenant,
    )
    user.add_role(:admin)
    user
  end

  # ... additional private methods
end
```

### 2. Create Provisioning API

Create `apps/core/app/controllers/api/v1/admin/provisioning_controller.rb`:

```ruby
class Api::V1::Admin::ProvisioningController < ApplicationController
  skip_before_action :set_tenant  # Super-admin operates across tenants
  before_action :authorize_super_admin

  # POST /api/v1/admin/provisioning/create_school
  def create_school
    result = TenantProvisioningService.new(provision_params).call
    render json: {
      tenant_id: result[:tenant].id,
      school_id: result[:school].id,
      admin_email: result[:admin].email,
      setup_url: result[:setup_url],
    }, status: :created
  end

  # POST /api/v1/admin/provisioning/bulk_create
  def bulk_create
    results = []
    params[:schools].each do |school_params|
      result = TenantProvisioningService.new(school_params.permit!).call
      results << { school_name: school_params[:school_name], tenant_id: result[:tenant].id, status: "created" }
    rescue => e
      results << { school_name: school_params[:school_name], status: "failed", error: e.message }
    end
    render json: { results: results }
  end

  # GET /api/v1/admin/provisioning/checklist/:tenant_id
  def checklist
    tenant = Tenant.find(params[:tenant_id])
    render json: OnboardingChecklistService.new(tenant).call
  end

  private

  def authorize_super_admin
    head :forbidden unless Current.user&.super_admin?
  end

  def provision_params
    params.require(:school).permit(
      :school_name, :subdomain, :admin_email, :admin_first_name, :admin_last_name,
      :logo_url, :primary_color, :ai_enabled, :google_enabled
    )
  end
end
```

### 3. Create Onboarding Checklist Service

Create `apps/core/app/services/onboarding_checklist_service.rb`:

```ruby
class OnboardingChecklistService
  def initialize(tenant)
    @tenant = tenant
  end

  def call
    {
      tenant_id: @tenant.id,
      school_name: @tenant.name,
      completion_percentage: completion_percentage,
      items: checklist_items,
    }
  end

  private

  def checklist_items
    [
      { key: "admin_created", label: "Admin account created", done: admin_exists? },
      { key: "school_configured", label: "School settings configured", done: school_configured? },
      { key: "academic_year", label: "Academic year and terms set up", done: academic_year_exists? },
      { key: "teachers_added", label: "At least one teacher added", done: teachers_exist? },
      { key: "students_added", label: "Students enrolled", done: students_exist? },
      { key: "course_created", label: "At least one course created", done: courses_exist? },
      { key: "standards_imported", label: "Standards framework imported", done: standards_exist? },
      { key: "google_configured", label: "Google integration configured", done: google_configured? },
      { key: "ai_configured", label: "AI provider configured", done: ai_configured? },
      { key: "branding_set", label: "School branding customized", done: branding_set? },
    ]
  end

  def completion_percentage
    items = checklist_items
    (items.count { |i| i[:done] }.to_f / items.size * 100).round(0)
  end
end
```

### 4. Create Data Import Service

Create `apps/core/app/services/data_import_service.rb`:

Support importing from common K-12 data formats:
- **CSV users** — Already exists (Batch 5 bulk ops); extend with role assignment
- **CSV courses and sections** — Import course list with sections and teacher assignments
- **CSV enrollments** — Import student-to-section enrollments
- **OneRoster CSV** — Parse OneRoster CSV format (orgs, users, courses, enrollments, classes)

```ruby
class DataImportService
  def initialize(tenant, import_type, csv_content, imported_by:)
    @tenant = tenant
    @import_type = import_type
    @csv = CSV.parse(csv_content, headers: true)
    @imported_by = imported_by
    @results = { created: 0, updated: 0, skipped: 0, errors: [] }
  end

  def call
    Current.tenant = @tenant
    case @import_type
    when "users" then import_users
    when "courses" then import_courses
    when "enrollments" then import_enrollments
    when "oneroster" then import_oneroster
    end
    @results
  end
end
```

### 5. Create School Branding Support

Update Tenant model to support branding:
- `settings["branding"]["logo_url"]` — School logo URL
- `settings["branding"]["primary_color"]` — Primary brand color
- `settings["branding"]["school_name"]` — Display name
- `settings["branding"]["favicon_url"]` — Custom favicon

Create `apps/core/app/controllers/api/v1/admin/branding_controller.rb`:
- GET/PUT for branding settings
- Logo upload via Active Storage

Update `apps/web/src/app/layout.tsx` to apply tenant branding:
- Dynamic theme color from tenant settings
- School logo in AppShell top bar
- Custom favicon

### 6. Build Provisioning Admin Page (Super Admin)

Create `apps/web/src/app/super-admin/provisioning/page.tsx`:

**Layout:**
- **School List** — All tenants with: name, subdomain, admin email, created date, onboarding progress %
- **Create School** — Form: school name, subdomain, admin email, admin name, branding options
- **Bulk Create** — CSV upload for creating multiple schools
- **School Detail** — Click to view: onboarding checklist, user counts, course counts, data import actions

### 7. Build School Setup Wizard Enhancement

Update `apps/web/src/app/setup/page.tsx` (existing setup page):

Add onboarding checklist display:
- Progress bar showing completion percentage
- Checklist items with links to relevant admin pages
- "Skip" option for optional items
- "Complete Setup" button when all required items done

### 8. Add Tests

**Backend:**
- `apps/core/spec/services/tenant_provisioning_service_spec.rb`
  - Creates tenant, school, roles, permissions, admin user
  - Sets default AI policies
  - Transaction rolls back on failure
  - Generates setup token

- `apps/core/spec/services/onboarding_checklist_service_spec.rb`
  - Returns correct completion percentage
  - Each checklist item evaluates correctly

- `apps/core/spec/services/data_import_service_spec.rb`
  - Imports users from CSV
  - Imports courses from CSV
  - Handles malformed data gracefully
  - Reports errors per row

- `apps/core/spec/requests/api/v1/admin/provisioning_controller_spec.rb`
  - Super admin can create school
  - Non-super admin denied
  - Bulk create handles mixed success/failure

**Frontend:**
- `apps/web/src/app/super-admin/provisioning/page.test.tsx` — School list, create form
- `apps/web/src/app/setup/page.test.tsx` — Onboarding checklist display

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/tenant_provisioning_service.rb` | Automated school setup |
| `apps/core/app/services/onboarding_checklist_service.rb` | Setup progress tracking |
| `apps/core/app/services/data_import_service.rb` | CSV/OneRoster data import |
| `apps/core/app/controllers/api/v1/admin/provisioning_controller.rb` | Provisioning API |
| `apps/core/app/controllers/api/v1/admin/branding_controller.rb` | Branding API |
| `apps/web/src/app/super-admin/provisioning/page.tsx` | Super admin provisioning |
| `apps/web/src/app/super-admin/layout.tsx` | Super admin layout |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add provisioning, branding routes |
| `apps/core/app/models/tenant.rb` | Branding settings accessors |
| `apps/core/app/models/user.rb` | Add super_admin? method |
| `apps/web/src/app/setup/page.tsx` | Add onboarding checklist |
| `apps/web/src/app/layout.tsx` | Apply tenant branding |
| `apps/web/src/components/AppShell.tsx` | Show school logo from branding |
| `apps/web/src/middleware.ts` | Allow /super-admin/* for super admins |

---

## Definition of Done

- [ ] TenantProvisioningService creates complete school setup in one transaction
- [ ] Default roles, permissions, AI policies, and standard frameworks created automatically
- [ ] Admin user created and setup token generated
- [ ] OnboardingChecklistService tracks 10 setup items with completion percentage
- [ ] DataImportService handles CSV users, courses, enrollments, and OneRoster format
- [ ] Bulk school creation supports CSV upload for district deployments
- [ ] School branding (logo, color, name) configurable and applied to UI
- [ ] Super admin provisioning page provides school management
- [ ] Setup wizard shows onboarding checklist with progress
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
