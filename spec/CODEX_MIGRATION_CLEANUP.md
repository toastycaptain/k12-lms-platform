# CODEX_MIGRATION_CLEANUP — Duplicate Migration Cleanup

**Priority:** P0
**Effort:** Complete — verification only (~30 min)
**Spec Refs:** TECH-2.4
**Depends on:** None
**Branch:** `batch8/1-migration-cleanup`
**Status:** ✅ All implementation complete — run verification only

---

## Already Implemented — DO NOT REDO

All cleanup work was completed in a prior session. Verify these exist before doing anything:

### 1. No-Op Migrations (all 7 confirmed)

Each 20260216 duplicate has already been squashed to a no-op body. Do NOT modify these files.

| File | Current State |
|------|--------------|
| `apps/core/db/migrate/20260216000001_create_ai_provider_configs_migration.rb` | ✅ No-op — comment points to 20260215000001 |
| `apps/core/db/migrate/20260216000002_create_ai_task_policies_migration.rb` | ✅ No-op — comment points to 20260215000002 |
| `apps/core/db/migrate/20260216000003_create_ai_templates_migration.rb` | ✅ No-op — comment points to 20260215000003 |
| `apps/core/db/migrate/20260216000004_create_ai_invocations_migration.rb` | ✅ No-op — comment points to 20260215000004 |
| `apps/core/db/migrate/20260216000005_create_lti_registrations_migration.rb` | ✅ No-op — comment points to 20260215100001 |
| `apps/core/db/migrate/20260216000006_create_lti_resource_links_migration.rb` | ✅ No-op — comment points to 20260215100002 |
| `apps/core/db/migrate/20260216000007_create_data_retention_policies_migration.rb` | ✅ No-op — comment points to 20260215100003 |

Each no-op looks like this (example):

```ruby
class CreateAiProviderConfigsMigration < ActiveRecord::Migration[8.0]
  def change
    # No-op: table created by 20260215000001_create_ai_provider_configs.rb
  end
end
```

### 2. CI Guard Spec (confirmed)

`apps/core/spec/contracts/schema_consistency_spec.rb` — **already exists**. Do NOT recreate it.

```ruby
RSpec.describe "Schema consistency" do
  it "has no pending migrations" do
    expect(ActiveRecord::Base.connection_pool.migration_context).not_to be_needs_migration
  end

  it "has unique migration timestamps" do
    migration_files = Dir[Rails.root.join("db/migrate/*.rb")]
    timestamps = migration_files.map { |file| File.basename(file).split("_").first }
    duplicates = timestamps.tally.select { |_timestamp, count| count > 1 }.keys
    expect(duplicates).to be_empty, "Duplicate migration timestamps: #{duplicates.join(', ')}"
  end
end
```

### 3. BLOCKERS.md (confirmed resolved)

`docs/BLOCKERS.md` Blocker #5 is already marked **Resolved** as of 2026-02-14. Do NOT modify.

---

## Remaining Task — Verification Only

There is **nothing left to implement**. Codex must run the following verification commands and confirm all pass before closing this task.

### Step 1: Confirm no-op bodies are in place

```bash
for f in apps/core/db/migrate/20260216*.rb; do
  echo "=== $f ==="; cat "$f"; echo
done
```

Expected: all 7 files have an empty `def change` with a `# No-op:` comment and no DDL.

### Step 2: Confirm migration status

```bash
cd apps/core && bundle exec rails db:migrate:status 2>&1 | grep -E "down|DUPLICATE" | head -20
```

Expected: no output (zero `down` or `DUPLICATE` entries).

### Step 3: Run the schema consistency spec

```bash
cd apps/core && bundle exec rspec spec/contracts/schema_consistency_spec.rb --format documentation
```

Expected output:
```
Schema consistency
  has no pending migrations
  has unique migration timestamps

2 examples, 0 failures
```

### Step 4: Run the full suite

```bash
cd apps/core && bundle exec rspec
```

Expected: all specs pass, 0 failures.

### Step 5: Rubocop

```bash
cd apps/core && bundle exec rubocop apps/core/db/migrate/20260216*.rb
```

Expected: no offenses.

---

## Files to Create

None. All files exist.

## Files to Modify

None. All fixes are in place.

---

## Definition of Done

- [x] All 7 duplicate migrations are no-ops with explanatory comments
- [x] `apps/core/spec/contracts/schema_consistency_spec.rb` exists with both checks
- [x] `docs/BLOCKERS.md` Blocker #5 marked Resolved
- [ ] `bundle exec rails db:migrate:status` verified — no `down` entries
- [ ] `bundle exec rspec spec/contracts/schema_consistency_spec.rb` passes
- [ ] `bundle exec rspec` passes (full suite, 0 failures)
- [ ] `bundle exec rubocop` passes
- [ ] Pushed and merged to main on branch `batch8/1-migration-cleanup`
