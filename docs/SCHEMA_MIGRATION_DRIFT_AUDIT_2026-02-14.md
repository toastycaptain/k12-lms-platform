# Core Schema/Migration Drift Audit (2026-02-14)

Scope: `apps/core` (`db/schema.rb` vs `db/migrate/*.rb`).

## Summary

- Schema tables found: `55`
- Tables with `create_table` migrations found: `48`
- Tables present in schema but missing from migrations: `7`

Missing migration-backed tables:

1. `ai_invocations`
2. `ai_provider_configs`
3. `ai_task_policies`
4. `ai_templates`
5. `data_retention_policies`
6. `lti_registrations`
7. `lti_resource_links`

## Repro Command

```bash
ruby -e 'schema=File.read("apps/core/db/schema.rb").scan(/create_table\s+"([^"]+)"/).flatten.uniq.sort; mig_tables=Dir["apps/core/db/migrate/*.rb"].flat_map{|f| File.read(f).scan(/create_table\s+:([a-zA-Z0-9_]+)/).flatten}.uniq.sort; missing=schema-mig_tables; puts "schema_tables=#{schema.size}"; puts "migration_create_tables=#{mig_tables.size}"; puts "missing_in_migrations=#{missing.size}"; puts missing'
```

## Impact

1. Fresh DB setup using `db:schema:load` includes these tables.
2. Environments that rely on migration-only progression may not create these tables if starting from migration history.
3. Team confidence drops because `schema.rb` and migration history no longer describe the same database evolution.

## Recommended Resolution

1. Add explicit migrations for each missing table (preferred if features remain in scope).
2. Or remove deferred/out-of-scope tables from schema source of truth and regenerate schema.
3. Add a CI guard that fails when `schema.rb` tables do not map to migration-backed `create_table` entries.

## Current State

- No code references to these table names were found outside `apps/core/db/schema.rb`.
- This suggests either deferred work that was partially introduced via schema state or missing migration files.
