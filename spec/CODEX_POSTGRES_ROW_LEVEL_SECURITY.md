# CODEX_POSTGRES_ROW_LEVEL_SECURITY — Defense-in-Depth Multi-Tenancy via Postgres RLS

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.3 ("Optional: Postgres Row-Level Security (later phase)"), PRD-23 (Security), PRD-9 (Multi-tenancy)
**Depends on:** None

---

## Problem

Multi-tenancy is currently enforced via three application-level mechanisms:
1. `TenantScoped` concern — default scope on all models (`where(tenant_id: Current.tenant.id)`)
2. Pundit policies — authorization checks per action
3. `Current.tenant` — set in ApplicationController from session

These work, but a single bug in any one layer (a missing scope, a query that bypasses default scope via `unscoped`, a raw SQL query) could leak data across tenants. TECH_SPEC §2.3 explicitly lists Postgres RLS as a planned later-phase hardening measure.

RLS adds a **database-level guarantee**: even if application code has a bug, Postgres itself will refuse to return rows belonging to another tenant.

---

## Tasks

### 1. Create RLS Migration for Core Tables

Create `apps/core/db/migrate/YYYYMMDD_enable_row_level_security.rb`:

```ruby
class EnableRowLevelSecurity < ActiveRecord::Migration[8.0]
  TENANT_TABLES = %w[
    users roles user_roles permissions
    schools academic_years terms
    courses sections enrollments
    unit_plans unit_versions lesson_plans lesson_versions
    templates template_versions
    assignments submissions
    rubrics rubric_criteria rubric_ratings rubric_scores
    discussions discussion_posts
    question_banks questions question_versions
    quizzes quiz_items quiz_attempts attempt_answers quiz_accommodations
    modules module_items
    standards standard_frameworks
    approvals
    messages message_threads
    notifications
    ai_provider_configs ai_task_policies ai_templates ai_invocations
    integration_configs sync_runs sync_logs sync_mappings
    lti_registrations lti_resource_links
    data_retention_policies
    guardian_links consent_records
    resource_links announcements
    audit_logs
  ].freeze

  def up
    # Create a GUC variable to pass tenant_id from application to Postgres
    execute <<-SQL
      CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS bigint AS $$
        SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::bigint;
      $$ LANGUAGE SQL STABLE;
    SQL

    TENANT_TABLES.each do |table|
      next unless column_exists?(table, :tenant_id)

      execute <<-SQL
        ALTER TABLE #{table} ENABLE ROW LEVEL SECURITY;
      SQL

      execute <<-SQL
        CREATE POLICY tenant_isolation_#{table} ON #{table}
          USING (tenant_id = current_tenant_id());
      SQL

      # Allow the application database user to bypass RLS for migrations and admin tasks
      execute <<-SQL
        ALTER TABLE #{table} FORCE ROW LEVEL SECURITY;
      SQL
    end
  end

  def down
    TENANT_TABLES.each do |table|
      next unless column_exists?(table, :tenant_id)

      execute "DROP POLICY IF EXISTS tenant_isolation_#{table} ON #{table};"
      execute "ALTER TABLE #{table} DISABLE ROW LEVEL SECURITY;"
    end

    execute "DROP FUNCTION IF EXISTS current_tenant_id();"
  end
end
```

### 2. Create Database Connection Tenant Setter

Create `apps/core/app/middleware/tenant_rls_middleware.rb`:

```ruby
class TenantRlsMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    @app.call(env)
  ensure
    # Clear tenant from connection to prevent leakage between requests
    ActiveRecord::Base.connection.execute("SET app.current_tenant_id TO ''")
  end
end
```

Update `apps/core/config/application.rb` to include the middleware.

### 3. Wire Tenant ID into Database Connection

Update `apps/core/app/controllers/application_controller.rb`:

```ruby
# In the existing set_tenant method, after setting Current.tenant:
after_action :clear_rls_tenant

private

def set_rls_tenant
  if Current.tenant
    ActiveRecord::Base.connection.execute(
      "SET app.current_tenant_id TO #{ActiveRecord::Base.connection.quote(Current.tenant.id)}"
    )
  end
end

def clear_rls_tenant
  ActiveRecord::Base.connection.execute("SET app.current_tenant_id TO ''")
end
```

Add `before_action :set_rls_tenant` after the existing `set_tenant` call.

### 4. Wire Tenant ID into Background Jobs

Update `apps/core/app/jobs/application_job.rb`:

```ruby
class ApplicationJob < ActiveJob::Base
  around_perform do |job, block|
    if Current.tenant
      ActiveRecord::Base.connection.execute(
        "SET app.current_tenant_id TO #{ActiveRecord::Base.connection.quote(Current.tenant.id)}"
      )
    end
    block.call
  ensure
    ActiveRecord::Base.connection.execute("SET app.current_tenant_id TO ''")
  end
end
```

### 5. Create RLS Bypass for Migrations and Admin Tasks

Create `apps/core/lib/rls_bypass.rb`:

```ruby
module RlsBypass
  # Use this for cross-tenant operations (migrations, system admin, analytics)
  def self.with_bypass(&block)
    ActiveRecord::Base.connection.execute("SET app.current_tenant_id TO ''")
    # Temporarily use a superuser role or disable RLS
    ActiveRecord::Base.connection.execute("SET ROLE k12_admin")
    yield
  ensure
    ActiveRecord::Base.connection.execute("RESET ROLE")
  end
end
```

Update `apps/core/db/seeds.rb` to use `RlsBypass.with_bypass` for seed data creation.

### 6. Create Database Roles

Create `apps/core/db/migrate/YYYYMMDD_create_database_roles.rb`:

```ruby
class CreateDatabaseRoles < ActiveRecord::Migration[8.0]
  def up
    # Application role (used by Rails) — subject to RLS
    execute <<-SQL
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'k12_app') THEN
          CREATE ROLE k12_app;
        END IF;
      END $$;
    SQL

    # Admin role (used for migrations) — bypasses RLS
    execute <<-SQL
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'k12_admin') THEN
          CREATE ROLE k12_admin BYPASSRLS;
        END IF;
      END $$;
    SQL
  end

  def down
    execute "DROP ROLE IF EXISTS k12_app;"
    execute "DROP ROLE IF EXISTS k12_admin;"
  end
end
```

### 7. Update Test Configuration

Update `apps/core/spec/rails_helper.rb`:
- Before each test, set `app.current_tenant_id` to the test tenant
- After each test, reset to empty
- Add helper method `set_rls_tenant(tenant)` for spec use

```ruby
RSpec.configure do |config|
  config.around(:each) do |example|
    if respond_to?(:tenant) && tenant
      ActiveRecord::Base.connection.execute(
        "SET app.current_tenant_id TO #{tenant.id}"
      )
    end
    example.run
  ensure
    ActiveRecord::Base.connection.execute("SET app.current_tenant_id TO ''")
  end
end
```

### 8. Add RLS Verification Tests

Create `apps/core/spec/rls/tenant_isolation_spec.rb`:

```ruby
RSpec.describe "Row Level Security" do
  let(:tenant_a) { create(:tenant) }
  let(:tenant_b) { create(:tenant) }

  %w[users courses assignments submissions quizzes].each do |table_name|
    context "on #{table_name}" do
      it "prevents cross-tenant reads" do
        # Create records in tenant_a
        set_rls_tenant(tenant_a)
        # ... create record ...

        # Switch to tenant_b
        set_rls_tenant(tenant_b)
        # ... verify record not visible ...
      end

      it "prevents cross-tenant writes" do
        set_rls_tenant(tenant_a)
        # ... attempt to update tenant_b record should fail ...
      end
    end
  end

  it "allows bypass for admin operations" do
    RlsBypass.with_bypass do
      # Can see all tenants
    end
  end
end
```

Test cross-tenant isolation for at least these critical tables:
- users, courses, enrollments
- assignments, submissions
- quizzes, quiz_attempts
- unit_plans, lesson_plans
- messages, notifications
- ai_invocations

### 9. Add Documentation

Create `docs/ROW_LEVEL_SECURITY.md`:
- Explain the RLS architecture
- Document the `current_tenant_id()` function
- Document `RlsBypass` for admin operations
- Troubleshooting: "Permission denied" errors
- Performance implications (minimal — RLS uses indexed tenant_id)

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_database_roles.rb` | App and admin DB roles |
| `apps/core/db/migrate/YYYYMMDD_enable_row_level_security.rb` | RLS policies on all tenant tables |
| `apps/core/app/middleware/tenant_rls_middleware.rb` | Connection cleanup middleware |
| `apps/core/lib/rls_bypass.rb` | Bypass module for admin/migration tasks |
| `apps/core/spec/rls/tenant_isolation_spec.rb` | RLS verification tests |
| `docs/ROW_LEVEL_SECURITY.md` | Architecture documentation |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/application.rb` | Register TenantRlsMiddleware |
| `apps/core/app/controllers/application_controller.rb` | Set/clear RLS tenant per request |
| `apps/core/app/jobs/application_job.rb` | Set RLS tenant for background jobs |
| `apps/core/spec/rails_helper.rb` | RLS tenant setup/teardown in tests |
| `apps/core/db/seeds.rb` | Use RlsBypass for seed creation |

---

## Definition of Done

- [ ] `current_tenant_id()` Postgres function created
- [ ] RLS policies enabled on all tables with tenant_id
- [ ] Application sets `app.current_tenant_id` GUC variable on every request
- [ ] Background jobs set tenant_id on their database connection
- [ ] Connections cleared after each request (no tenant leakage)
- [ ] RlsBypass module allows admin operations to bypass RLS
- [ ] Database roles created (k12_app with RLS, k12_admin with BYPASSRLS)
- [ ] Cross-tenant isolation verified for 10+ critical tables
- [ ] All existing specs pass (no RLS-related failures)
- [ ] Seeds work with RLS enabled
- [ ] Documentation covers architecture, bypass, and troubleshooting
- [ ] No Rubocop violations
