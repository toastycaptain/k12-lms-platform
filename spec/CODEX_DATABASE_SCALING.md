# CODEX_DATABASE_SCALING — Connection Pooling, Query Optimization, and Read Replicas

**Priority:** P0
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Performance, Reliability), PRD-8 (Performance targets), TECH-2.1 (System Architecture)
**Depends on:** None

---

## Problem

The platform is approaching multi-school deployment. Batch 6 added analytics aggregation, progress tracking, engagement scoring, and portfolio queries — all heavy database operations. Current state:

1. **No connection pooling** — Rails connects directly to Postgres; each Sidekiq worker holds a connection; under load connections exhaust
2. **No read replica** — All reads and writes hit the same database; analytics queries compete with grade submissions
3. **No slow query monitoring** — No pg_stat_statements, no slow query log, no query performance baseline
4. **N+1 queries likely in new services** — AnalyticsAggregationService, StudentEngagementService, and PortfolioExportService iterate over records without eager loading
5. **No counter caches** — Counts (enrollment count, submission count, entry count) are computed with COUNT(*) on every request
6. **No materialized views** — Analytics dashboard computes aggregates from raw tables on every load
7. **No index audit** — 6 batches of migrations may have missing or redundant indexes
8. **No database connection limits** — No max connection configuration per service

---

## Tasks

### 1. Configure PgBouncer Connection Pooling

Create `infrastructure/pgbouncer/pgbouncer.ini`:

```ini
[databases]
k12_production = host=<pg_host> port=5432 dbname=k12_production

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
log_connections = 1
log_disconnections = 1
stats_period = 60
```

Update `apps/core/config/database.yml` for production:

```yaml
production:
  primary:
    url: <%= ENV["DATABASE_URL"] %>
    pool: <%= ENV.fetch("RAILS_MAX_THREADS", 5) %>
    prepared_statements: false  # Required for PgBouncer transaction mode
  primary_replica:
    url: <%= ENV["DATABASE_REPLICA_URL"] %>
    pool: <%= ENV.fetch("RAILS_MAX_THREADS", 5) %>
    prepared_statements: false
    replica: true
```

### 2. Configure Read Replica Routing

Update `apps/core/app/models/application_record.rb`:

```ruby
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  connects_to database: {
    writing: :primary,
    reading: :primary_replica
  }
end
```

Create `apps/core/app/middleware/automatic_read_replica.rb`:

```ruby
# Route GET requests to read replica, write requests to primary
class AutomaticReadReplica
  def initialize(app)
    @app = app
  end

  def call(env)
    if env["REQUEST_METHOD"] == "GET" && !write_path?(env["PATH_INFO"])
      ActiveRecord::Base.connected_to(role: :reading) { @app.call(env) }
    else
      @app.call(env)
    end
  end

  private

  def write_path?(path)
    # Paths that read but also trigger writes (e.g., logging)
    path.include?("/data_compliance") || path.include?("/export")
  end
end
```

### 3. Enable pg_stat_statements and Slow Query Logging

Create migration to enable pg_stat_statements:

```ruby
class EnablePgStatStatements < ActiveRecord::Migration[8.0]
  def up
    execute "CREATE EXTENSION IF NOT EXISTS pg_stat_statements"
  end

  def down
    execute "DROP EXTENSION IF EXISTS pg_stat_statements"
  end
end
```

Create `apps/core/app/services/query_monitor_service.rb`:

```ruby
class QueryMonitorService
  SLOW_QUERY_THRESHOLD_MS = 500

  def self.slow_queries(limit: 20)
    ActiveRecord::Base.connection.execute(<<-SQL).to_a
      SELECT query, calls, mean_exec_time, total_exec_time, rows
      FROM pg_stat_statements
      WHERE mean_exec_time > #{SLOW_QUERY_THRESHOLD_MS}
      ORDER BY mean_exec_time DESC
      LIMIT #{limit}
    SQL
  end

  def self.top_queries_by_time(limit: 20)
    ActiveRecord::Base.connection.execute(<<-SQL).to_a
      SELECT query, calls, total_exec_time, mean_exec_time, rows
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT #{limit}
    SQL
  end
end
```

Add admin endpoint to view slow queries:
```ruby
# GET /api/v1/admin/database/slow_queries
def slow_queries
  authorize :admin, :database?
  render json: QueryMonitorService.slow_queries
end
```

### 4. Fix N+1 Queries in Services

Audit and add `includes` / `preload` to:

**AnalyticsAggregationService:**
```ruby
# Before: User.joins(:roles).where(...)
# After: User.includes(:roles, :enrollments).joins(:roles).where(...)
```

**StudentEngagementService:**
```ruby
# Preload all needed associations in one query
@submissions = Submission.where(user: @student, assignment: @course.assignments).to_a
@quiz_attempts = QuizAttempt.where(user: @student, quiz: @course.quizzes).to_a
@discussion_posts = DiscussionPost.where(user: @student, discussion: @course.discussions).to_a
```

**AtRiskDetectionService:**
```ruby
# Batch-load all student data instead of per-student queries
@all_submissions = Submission.where(assignment: @course.assignments).group(:user_id).count
@all_missing = # ... precomputed
```

**PortfolioExportService:**
```ruby
# Eager load all associations
portfolio.portfolio_entries.includes(:submission, :quiz_attempt, :resource, :standards, :portfolio_comments)
```

**GradebookController:**
```ruby
# Replace N per-student queries with batch loads
submissions = Submission.where(assignment: assignments, user: students).includes(:assignment).group_by(&:user_id)
```

### 5. Add Counter Caches

Create migration:

```ruby
class AddCounterCaches < ActiveRecord::Migration[8.0]
  def change
    add_column :courses, :enrollments_count, :integer, default: 0, null: false
    add_column :courses, :assignments_count, :integer, default: 0, null: false
    add_column :assignments, :submissions_count, :integer, default: 0, null: false
    add_column :quizzes, :quiz_attempts_count, :integer, default: 0, null: false
    add_column :discussions, :discussion_posts_count, :integer, default: 0, null: false
    add_column :portfolios, :portfolio_entries_count, :integer, default: 0, null: false
    add_column :question_banks, :questions_count, :integer, default: 0, null: false
    add_column :unit_plans, :unit_versions_count, :integer, default: 0, null: false
  end
end
```

Update models with `counter_cache: true`:
```ruby
# In Enrollment model:
belongs_to :section, counter_cache: true  # or custom: enrollments_count on course

# In Submission model:
belongs_to :assignment, counter_cache: true
```

Create a Rake task to backfill counter caches:
```ruby
task backfill_counters: :environment do
  Course.find_each { |c| Course.reset_counters(c.id, :enrollments, :assignments) }
  Assignment.find_each { |a| Assignment.reset_counters(a.id, :submissions) }
  # ... etc
end
```

### 6. Create Materialized Views for Analytics

Create migration:

```ruby
class CreateAnalyticsMaterializedViews < ActiveRecord::Migration[8.0]
  def up
    execute <<-SQL
      CREATE MATERIALIZED VIEW mv_daily_active_users AS
      SELECT
        tenant_id,
        DATE(last_sign_in_at) AS activity_date,
        COUNT(DISTINCT id) AS active_users,
        COUNT(DISTINCT CASE WHEN roles.name = 'teacher' THEN users.id END) AS active_teachers,
        COUNT(DISTINCT CASE WHEN roles.name = 'student' THEN users.id END) AS active_students
      FROM users
      JOIN user_roles ON users.id = user_roles.user_id
      JOIN roles ON user_roles.role_id = roles.id
      WHERE last_sign_in_at IS NOT NULL
      GROUP BY tenant_id, DATE(last_sign_in_at);

      CREATE UNIQUE INDEX idx_mv_dau ON mv_daily_active_users (tenant_id, activity_date);
    SQL

    execute <<-SQL
      CREATE MATERIALIZED VIEW mv_content_metrics AS
      SELECT
        tenant_id,
        DATE(created_at) AS created_date,
        COUNT(*) FILTER (WHERE type = 'UnitPlan') AS units_created,
        COUNT(*) FILTER (WHERE type = 'UnitPlan' AND status = 'published') AS units_published,
        COUNT(*) FILTER (WHERE type = 'LessonPlan') AS lessons_created,
        COUNT(*) FILTER (WHERE type = 'Template') AS templates_created
      FROM (
        SELECT tenant_id, created_at, 'UnitPlan' AS type, status FROM unit_plans
        UNION ALL
        SELECT tenant_id, created_at, 'LessonPlan' AS type, status FROM lesson_plans
        UNION ALL
        SELECT tenant_id, created_at, 'Template' AS type, status FROM templates
      ) combined
      GROUP BY tenant_id, DATE(created_at);

      CREATE UNIQUE INDEX idx_mv_content ON mv_content_metrics (tenant_id, created_date);
    SQL
  end

  def down
    execute "DROP MATERIALIZED VIEW IF EXISTS mv_daily_active_users"
    execute "DROP MATERIALIZED VIEW IF EXISTS mv_content_metrics"
  end
end
```

Create refresh job:
```ruby
class RefreshMaterializedViewsJob < ApplicationJob
  queue_as :low
  # Run every hour via cron
  def perform
    ActiveRecord::Base.connection.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_active_users")
    ActiveRecord::Base.connection.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_metrics")
  end
end
```

Update AnalyticsAggregationService to query materialized views instead of raw tables.

### 7. Index Audit

Run and review:
```sql
-- Find unused indexes
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND indexrelname NOT LIKE '%pkey%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find missing indexes (sequential scans on large tables)
SELECT relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND seq_tup_read > 10000
ORDER BY seq_tup_read DESC;
```

Add missing indexes, remove unused ones. Document decisions.

### 8. Add Database Health Endpoint

Create `apps/core/app/controllers/api/v1/admin/database_controller.rb`:

```ruby
# GET /api/v1/admin/database/health
def health
  authorize :admin, :database?
  render json: {
    connection_pool: pool_stats,
    active_connections: ActiveRecord::Base.connection_pool.stat,
    slow_queries: QueryMonitorService.slow_queries(limit: 5),
    table_sizes: table_sizes,
    index_usage: index_usage_summary,
  }
end
```

### 9. Add Tests

- `apps/core/spec/services/query_monitor_service_spec.rb` — Slow query retrieval
- `apps/core/spec/jobs/refresh_materialized_views_job_spec.rb` — View refresh
- Verify no N+1 in critical services using `bullet` gem or manual query counting

---

## Files to Create

| File | Purpose |
|------|---------|
| `infrastructure/pgbouncer/pgbouncer.ini` | PgBouncer configuration |
| `apps/core/db/migrate/YYYYMMDD_enable_pg_stat_statements.rb` | Query monitoring extension |
| `apps/core/db/migrate/YYYYMMDD_add_counter_caches.rb` | Counter cache columns |
| `apps/core/db/migrate/YYYYMMDD_create_analytics_materialized_views.rb` | Pre-computed analytics |
| `apps/core/app/services/query_monitor_service.rb` | Slow query reporting |
| `apps/core/app/middleware/automatic_read_replica.rb` | GET → replica routing |
| `apps/core/app/jobs/refresh_materialized_views_job.rb` | Hourly view refresh |
| `apps/core/app/controllers/api/v1/admin/database_controller.rb` | DB health endpoint |
| `apps/core/lib/tasks/backfill_counters.rake` | Counter cache backfill |
| `docs/DATABASE_SCALING.md` | Scaling architecture doc |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/database.yml` | Add replica config, disable prepared statements |
| `apps/core/app/models/application_record.rb` | connects_to with replica |
| `apps/core/config/application.rb` | Register read replica middleware |
| `apps/core/app/services/analytics_aggregation_service.rb` | Use materialized views, fix N+1 |
| `apps/core/app/services/student_engagement_service.rb` | Preload associations |
| `apps/core/app/services/at_risk_detection_service.rb` | Batch-load student data |
| `apps/core/app/controllers/api/v1/gradebook_controller.rb` | Fix N+1 with batch loads |
| `apps/core/config/routes.rb` | Add admin/database routes |
| Various models | Add counter_cache: true |

---

## Definition of Done

- [ ] PgBouncer configuration documented and ready for deployment
- [ ] Read replica configured in database.yml with automatic routing
- [ ] pg_stat_statements enabled for query monitoring
- [ ] Slow query endpoint accessible to admins
- [ ] N+1 queries fixed in analytics, engagement, gradebook, and portfolio services
- [ ] Counter caches added for 8 frequently-counted associations
- [ ] Materialized views created for daily active users and content metrics
- [ ] Materialized views refreshed hourly via background job
- [ ] Index audit completed: missing indexes added, unused removed
- [ ] Database health endpoint returns pool stats, slow queries, and table sizes
- [ ] All existing tests pass (no regressions from query changes)
- [ ] No Rubocop violations
