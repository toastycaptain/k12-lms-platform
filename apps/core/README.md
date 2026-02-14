# Core API (`apps/core`)

Rails API-only service for tenancy, auth, planner/LMS domains, and background jobs.

## Prerequisites

- Ruby 4.0+
- PostgreSQL 15+
- Redis 7+

## Setup

```bash
bundle install
bundle exec rails db:prepare
```

## Run

```bash
bundle exec rails server -p 3001
```

## Test & Static Analysis

```bash
bundle exec rspec
bundle exec rubocop
bundle exec brakeman --quiet --no-pager --exit-on-warn --exit-on-error
bundle exec bundler-audit
```

## Architectural Rules

- All tenant-scoped records require `tenant_id`.
- Policies are enforced via Pundit on every API endpoint.
- API routes are namespaced under `/api/v1`.
