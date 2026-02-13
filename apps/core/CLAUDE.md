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

## Quality Checks
Run from apps/core with proper PATH:
```bash
export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"
bundle exec rails db:migrate
bundle exec rubocop --autocorrect
bundle exec rspec
```
