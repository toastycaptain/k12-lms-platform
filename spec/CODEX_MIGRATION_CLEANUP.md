# CODEX_MIGRATION_CLEANUP — Remove Duplicate Migrations & Verify Schema Parity

**Priority:** P0
**Effort:** Small (1–2 hours)
**Spec Refs:** TECH-2.4
**Depends on:** None

---

## Problem

Seven migration files from `20260216*` duplicate tables already created by `20260215*` migrations. All have `return if table_exists?` guards, so they are functionally harmless, but they:
1. Clutter `db:migrate:status` output
2. Create confusion about which migration is authoritative
3. May cause issues if future migrations reference them

### Duplicate Pairs

| Original (20260215) | Duplicate (20260216) | Table |
|---------------------|---------------------|-------|
| 20260215000001_create_ai_provider_configs.rb | 20260216000001_create_ai_provider_configs_migration.rb | ai_provider_configs |
| 20260215000002_create_ai_task_policies.rb | 20260216000002_create_ai_task_policies_migration.rb | ai_task_policies |
| 20260215000003_create_ai_templates.rb | 20260216000003_create_ai_templates_migration.rb | ai_templates |
| 20260215000004_create_ai_invocations.rb | 20260216000004_create_ai_invocations_migration.rb | ai_invocations |
| 20260215100001_create_lti_registrations.rb | 20260216000005_create_lti_registrations_migration.rb | lti_registrations |
| 20260215100002_create_lti_resource_links.rb | 20260216000006_create_lti_resource_links_migration.rb | lti_resource_links |
| 20260215100003_create_data_retention_policies.rb | 20260216000007_create_data_retention_policies_migration.rb | data_retention_policies |

---

## Tasks

### 1. Squash Duplicate Migrations
- Replace each 20260216 migration body with an empty `def change; end` (do NOT delete the file — the migration version is recorded in `schema_migrations` in dev/test/prod databases)
- Add a comment: `# No-op: table created by <original migration filename>`
- This ensures `db:migrate` doesn't fail on environments that already ran these

### 2. Verify Schema Parity
- Run `RAILS_ENV=test bundle exec rails db:schema:dump`
- Run `RAILS_ENV=development bundle exec rails db:schema:dump`
- Diff the two `db/schema.rb` outputs — they must be identical except for the `ActiveRecord::Schema[x.x].define(version:)` line
- Ensure all 60+ tables have `tenant_id` (except `tenants`, `schema_migrations`, `ar_internal_metadata`, `active_storage_*`)

### 3. Add CI Guard for Migration Drift
- In `apps/core/spec/contracts/` or `spec/integration/`, add a spec:
  ```ruby
  describe "schema consistency" do
    it "has no pending migrations" do
      output = `RAILS_ENV=test bundle exec rails db:migrate:status 2>&1`
      expect(output).not_to include("down")
    end
  end
  ```

### 4. Update Documentation
- Remove Blocker #5 from `docs/BLOCKERS.md` (mark as Resolved if not already)
- Update `docs/TRACEABILITY.md` TECH-2.4 status if changed

---

## Files to Modify

| File | Action |
|------|--------|
| `apps/core/db/migrate/20260216000001_create_ai_provider_configs_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000002_create_ai_task_policies_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000003_create_ai_templates_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000004_create_ai_invocations_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000005_create_lti_registrations_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000006_create_lti_resource_links_migration.rb` | Replace body with no-op |
| `apps/core/db/migrate/20260216000007_create_data_retention_policies_migration.rb` | Replace body with no-op |
| `apps/core/spec/contracts/schema_consistency_spec.rb` | Create — migration drift guard |
| `docs/BLOCKERS.md` | Update Blocker #5 status |

---

## Definition of Done

- [ ] All 7 duplicate migrations are no-ops with explanatory comments
- [ ] `bundle exec rails db:migrate` runs cleanly on fresh database
- [ ] `bundle exec rspec` passes (1441+ specs, 0 failures)
- [ ] Schema parity verified between dev and test environments
- [ ] CI guard spec added and passing
- [ ] No Rubocop violations introduced
