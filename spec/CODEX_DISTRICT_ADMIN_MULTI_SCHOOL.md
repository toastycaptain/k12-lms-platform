# CODEX_DISTRICT_ADMIN_MULTI_SCHOOL — District/System Administrator Views

**Priority:** P2
**Effort:** Large (10–14 hours)
**Spec Refs:** PRD-4 (Secondary Users — District/System Administrator), PRD-6 (Curriculum & Admin Problems — coherent curriculum across grades, reduce tool sprawl)
**Depends on:** CODEX_DATA_MODEL_RECONCILIATION

---

## Problem

PRD-4 lists "District/System Administrator" as a secondary user persona, optional in MVP. The platform supports multi-tenancy (one tenant = one school), but there is no cross-school visibility for district administrators who oversee multiple schools. Current gaps:

1. **No district-level role** — roles are tenant-scoped; no "district_admin" that spans schools
2. **No cross-school reporting** — can't compare standards coverage or assessment results across schools
3. **No district-level curriculum management** — can't push templates or standards across schools
4. **No user provisioning at scale** — can't bulk-create teachers across schools

---

## Tasks

### 1. Create District Data Model

Migration:
```ruby
class CreateDistricts < ActiveRecord::Migration[8.0]
  def change
    create_table :districts do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.jsonb :settings, null: false, default: {}
      t.timestamps
    end

    add_index :districts, :slug, unique: true

    # Link tenants to districts
    add_reference :tenants, :district, foreign_key: true
    # District admin user role
    add_column :users, :district_admin, :boolean, default: false, null: false
  end
end
```

Model `apps/core/app/models/district.rb`:
```ruby
class District < ApplicationRecord
  has_many :tenants
  has_many :schools, through: :tenants

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true, format: { with: /\A[a-z0-9-]+\z/ }
end
```

**Note:** District is NOT TenantScoped — it sits above tenants.

### 2. Create District Admin Controller

Create `apps/core/app/controllers/api/v1/district_controller.rb`:

```ruby
class Api::V1::DistrictController < ApplicationController
  before_action :require_district_admin!

  # GET /api/v1/district/schools
  def schools
    tenants = current_district.tenants.includes(:schools)
    render json: tenants.flat_map(&:schools), each_serializer: SchoolSerializer
  end

  # GET /api/v1/district/standards_coverage
  def standards_coverage
    # Aggregate standards coverage across all schools in district
    coverage = current_district.tenants.map do |tenant|
      Current.tenant = tenant
      {
        school: tenant.name,
        frameworks: StandardFramework.count,
        standards: Standard.count,
        coverage_pct: calculate_coverage(tenant),
      }
    end
    render json: coverage
  end

  # GET /api/v1/district/user_summary
  def user_summary
    summary = current_district.tenants.map do |tenant|
      {
        school: tenant.name,
        teachers: tenant.users.joins(:user_roles, :roles).where(roles: { name: "teacher" }).count,
        students: tenant.users.joins(:user_roles, :roles).where(roles: { name: "student" }).count,
        admins: tenant.users.joins(:user_roles, :roles).where(roles: { name: "admin" }).count,
      }
    end
    render json: summary
  end

  # POST /api/v1/district/push_template
  def push_template
    source_template = Template.find(params[:template_id])
    target_tenants = current_district.tenants.where(id: params[:target_tenant_ids])

    target_tenants.each do |tenant|
      Current.tenant = tenant
      TemplatePushService.new(source_template, tenant).call
    end

    render json: { pushed_to: target_tenants.pluck(:name) }
  end

  private

  def require_district_admin!
    head :forbidden unless Current.user&.district_admin?
  end

  def current_district
    Current.user.tenant.district
  end
end
```

### 3. Create District Admin Frontend Pages

Create pages under `apps/web/src/app/district/`:

```
district/
  layout.tsx            — ProtectedRoute with district_admin check
  dashboard/
    page.tsx            — Overview: schools, teachers, students, coverage
  schools/
    page.tsx            — School listing with key metrics per school
  standards/
    page.tsx            — Cross-school standards coverage comparison
  templates/
    page.tsx            — District template library with push-to-schools
  users/
    page.tsx            — Cross-school user directory
```

**Dashboard features:**
- Card per school: name, teacher count, student count, active users
- Aggregate metrics: total students, total teachers, average standards coverage
- Quick links to drill into each school

**Standards comparison:**
- Table: school × framework with coverage percentages
- Color-coded cells (green ≥ 80%, yellow 50-79%, red < 50%)
- Filter by framework, grade level

**Template push:**
- List district-level templates
- Select target schools
- Push button with confirmation
- Status tracking for pushed templates

### 4. Update AppShell for District Role

Update `apps/web/src/components/AppShell.tsx`:
- Add "District" nav item (visible only to district_admin users)
- Position between "Admin" and "Report" in nav hierarchy

### 5. Add Tests

- `apps/core/spec/models/district_spec.rb`
- `apps/core/spec/requests/api/v1/district_controller_spec.rb`
- `apps/core/spec/policies/district_policy_spec.rb`
- `apps/web/src/app/district/dashboard/page.test.tsx`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_districts.rb` | District table + tenant link |
| `apps/core/app/models/district.rb` | District model |
| `apps/core/app/controllers/api/v1/district_controller.rb` | District API |
| `apps/core/app/policies/district_policy.rb` | Authorization |
| `apps/core/app/serializers/district_serializer.rb` | Serializer |
| `apps/core/app/services/template_push_service.rb` | Template distribution |
| `apps/web/src/app/district/layout.tsx` | District layout |
| `apps/web/src/app/district/dashboard/page.tsx` | Dashboard |
| `apps/web/src/app/district/schools/page.tsx` | School listing |
| `apps/web/src/app/district/standards/page.tsx` | Coverage comparison |
| `apps/web/src/app/district/templates/page.tsx` | Template management |
| `apps/web/src/app/district/users/page.tsx` | User directory |
| `apps/core/spec/models/district_spec.rb` | Model spec |
| `apps/core/spec/requests/api/v1/district_controller_spec.rb` | Request spec |
| `apps/core/spec/services/template_push_service_spec.rb` | Service spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/models/tenant.rb` | Add `belongs_to :district, optional: true` |
| `apps/core/app/models/user.rb` | Add `district_admin?` method |
| `apps/core/config/routes.rb` | Add district routes |
| `apps/web/src/components/AppShell.tsx` | Add District nav item |

---

## Definition of Done

- [ ] District model exists above tenant hierarchy
- [ ] Tenants can be linked to districts
- [ ] District admin flag on users
- [ ] 4 district API endpoints (schools, standards, users, push_template)
- [ ] Template push service distributes templates across schools
- [ ] 5 district frontend pages with role-gated access
- [ ] AppShell shows District nav for district admins
- [ ] All specs pass
- [ ] No Rubocop violations, no TypeScript errors
