# CLAUDE.md — Rails Core API

## Multi-Tenancy Pattern

**Critical**: Every model (except Tenant itself) MUST include the TenantScoped concern.

### Current Context
- `Current.tenant` — set in ApplicationController before_action, holds current Tenant
- `Current.user` — set in ApplicationController before_action, holds authenticated User
- Location: `app/models/current.rb` (ActiveSupport::CurrentAttributes)

### TenantScoped Concern
- Location: `app/models/concerns/tenant_scoped.rb`
- What it does:
  - Adds `belongs_to :tenant, optional: false`
  - Adds `default_scope -> { where(tenant_id: Current.tenant&.id) if Current.tenant }`
  - Adds `before_validation :set_tenant, on: :create` to auto-assign tenant_id
  - Validates presence of tenant_id
- **Usage**: `include TenantScoped` in every model except Tenant

### Migration Pattern
- Every table (except tenants) MUST have: `t.references :tenant, null: false, foreign_key: true, index: true`
- Tenant table has unique index on slug

## Testing Patterns

### Factory Pattern
- Use sequences for unique fields: `sequence(:slug) { |n| "tenant-#{n}" }`
- Tenant factory should NOT set Current.tenant (it's the top level)
- All other factories can use `association :tenant` which will create one automatically

### Spec Pattern for Tenant Scoping
```ruby
describe "tenant scoping" do
  let(:tenant1) { create(:tenant) }
  let(:tenant2) { create(:tenant) }

  before do
    Current.tenant = tenant1
    # create records for tenant1
    Current.tenant = tenant2
    # create records for tenant2
  end

  after { Current.tenant = nil }

  it "isolates queries by tenant" do
    Current.tenant = tenant1
    expect(Model.all).to contain_exactly(# tenant1 records)
  end
end
```

## Models

### Tenant
- Fields: name, slug (unique), settings (jsonb)
- Does NOT include TenantScoped (it's the top-level entity)
- Slug format: lowercase letters, numbers, hyphens only

### School
- Fields: name, address, timezone, tenant_id
- Includes TenantScoped
- Belongs to Tenant

### User
- Fields: email, first_name, last_name, tenant_id
- Includes TenantScoped
- has_many :user_roles, has_many :roles through: :user_roles
- `has_role?(role_name)` — checks role membership
- `add_role(role_name)` — idempotent role assignment (finds/creates Role, creates UserRole)
- Email unique within tenant scope

### Role
- Fields: name, tenant_id
- Includes TenantScoped
- Valid names: admin, curriculum_lead, teacher, student, guardian
- Name unique within tenant scope

### UserRole
- Join model: user_id, role_id, tenant_id
- Includes TenantScoped
- Unique constraint on [user_id, role_id]
- Auto-sets tenant from user on create

## Authorization (Pundit)

### Setup
- `require "pundit/rspec"` in spec/rails_helper.rb for `permissions` matcher
- ApplicationPolicy: default deny-all, Scope base class
- Each model gets its own policy in app/policies/

### Policy Pattern
```ruby
class ModelPolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end
end
```

### Testing Gotcha
- `build(:model)` without explicit tenant results in nil tenant_id
- Always pass `tenant: tenant` when building records in tests

## Quality Checks
Run from apps/core with proper PATH:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rails db:migrate
bundle exec rubocop --autocorrect
bundle exec rspec
```
