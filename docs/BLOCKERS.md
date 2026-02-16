# Blockers & Open Decisions

Track unresolved questions, blocked tasks, and pending decisions here.

## Format

| # | Blocker | Owner | Status | Date Raised |
|---|---------|-------|--------|-------------|
| 1 | Local environments with Ruby `< 4.0` cannot execute `apps/core` checks due Rails 8.1/Bundler 4 lockfile requirements. CI now runs Core checks with Ruby 4.0 via `ruby/setup-ruby`. | Platform | Mitigated | 2026-02-14 |
| 2 | AI gateway had no dependency manifest or committed tests, so regressions were not CI-detectable. | Platform | Mitigated | 2026-02-14 |
| 3 | Phase 7 (LTI/OneRoster) is deferred from current release; partial, unwired code paths were removed to avoid false production assumptions. | Platform + Product | Mitigated | 2026-02-14 |
| 4 | AI product integration in Rails/Web is still partial; gateway APIs exist but admin policy UX and end-to-end invocation persistence are not yet implemented. | Platform + Product | Open | 2026-02-14 |
| 5 | `apps/core/db/schema.rb` contains 7 tables that have no matching `create_table` migration files (`ai_*`, `lti_*`, `data_retention_policies`), which can cause migration-path inconsistencies across environments. Missing migration files were added for all seven tables. | Platform | Resolved | 2026-02-14 |

<!-- Add rows as blockers arise -->
