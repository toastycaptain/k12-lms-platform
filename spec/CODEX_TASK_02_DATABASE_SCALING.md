# CODEX_TASK_02 — Database Scaling

**Priority:** P0
**Effort:** 4–5 hours remaining (partial implementation exists)
**Depends On:** None
**Branch:** `batch7/02-database-scaling`

---

## Already Implemented — DO NOT REDO

The following were built in a prior session. Verify they exist before starting:

| File | Status |
|------|--------|
| `apps/core/db/migrate/20260217000004_add_counter_caches.rb` | ✅ Exists — counter cache columns on 7 tables |
| `apps/core/db/migrate/20260217000005_add_performance_indexes_v2.rb` | ✅ Exists — composite indexes |

Quick verification:
```bash
ls apps/core/db/migrate/20260217000004_add_counter_caches.rb
ls apps/core/db/migrate/20260217000005_add_performance_indexes_v2.rb
```

**Important:** The migration added the counter cache columns, but the model `belongs_to` associations may not yet have `counter_cache: true`. Check each model file listed in Task 1 below and add if missing.

---

## Remaining Tasks

### 1. Verify and Complete Counter Cache Model Associations

The migration (20260217000004) added `*_count` columns. Now verify that the corresponding `belongs_to` declarations in each model have `counter_cache: true`. If missing, add them.

Check each file — **only add `counter_cache: true` if not already present**:

```bash
# Check current state before modifying
grep -n "counter_cache" apps/core/app/models/assignment.rb
grep -n "counter_cache" apps/core/app/models/submission.rb
grep -n "counter_cache" apps/core/app/models/discussion.rb
grep -n "counter_cache" apps/core/app/models/discussion_post.rb
grep -n "counter_cache" apps/core/app/models/quiz.rb
grep -n "counter_cache" apps/core/app/models/enrollment.rb
grep -n "counter_cache" apps/core/app/models/question.rb
grep -n "counter_cache" apps/core/app/models/user.rb
grep -n "counter_cache" apps/core/app/models/course.rb
grep -n "counter_cache" apps/core/app/models/school.rb
```

For each model where `counter_cache: true` is NOT already on the `belongs_to`, add it:

`apps/core/app/models/assignment.rb`:
```ruby
belongs_to :course, counter_cache: true
```

`apps/core/app/models/submission.rb`:
```ruby
belongs_to :assignment, counter_cache: true
```

`apps/core/app/models/discussion.rb`:
```ruby
belongs_to :course, counter_cache: true
```

`apps/core/app/models/discussion_post.rb`:
```ruby
belongs_to :discussion, counter_cache: true
```

`apps/core/app/models/quiz.rb`:
```ruby
belongs_to :course, counter_cache: true
```

`apps/core/app/models/enrollment.rb`:
```ruby
belongs_to :section, counter_cache: true
```

`apps/core/app/models/question.rb`:
```ruby
belongs_to :question_bank, counter_cache: true
```

`apps/core/app/models/user.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

`apps/core/app/models/course.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

`apps/core/app/models/school.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

### 2. Install Bullet Gem for N+1 Detection

Add to `apps/core/Gemfile`:

```ruby
group :development, :test do
  gem "bullet", "~> 8.0"
end
```

Add to `apps/core/config/environments/development.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.rails_logger = true
  Bullet.raise = false
end
```

Add to `apps/core/config/environments/test.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.raise = true  # Fail tests on N+1
end
```

Run `bundle install` after adding the gem.

### 3. Fix N+1 Queries in High-Traffic Controllers

With Bullet enabled in test mode, run the test suite and fix every N+1 it reports. As a starting point, audit these controllers and add eager loading if not already present:

`apps/core/app/controllers/api/v1/courses_controller.rb` — `index` action:
```ruby
courses = policy_scope(Course)
  .includes(:sections, :academic_year, :course_modules)
  .order(:name)
```

`apps/core/app/controllers/api/v1/assignments_controller.rb` — `index` action:
```ruby
assignments = policy_scope(Assignment)
  .where(course_id: params[:course_id])
  .includes(:created_by, :rubric, :standards)
  .order(:due_at)
```

`apps/core/app/controllers/api/v1/submissions_controller.rb` — `index` action:
```ruby
submissions = policy_scope(Submission)
  .where(assignment_id: params[:assignment_id])
  .includes(:student, :graded_by)
  .order(:submitted_at)
```

`apps/core/app/controllers/api/v1/users_controller.rb` — `index` action:
```ruby
users = policy_scope(User)
  .includes(:roles)
  .order(:last_name, :first_name)
```

`apps/core/app/controllers/api/v1/quizzes_controller.rb` — `index` action:
```ruby
quizzes = policy_scope(Quiz)
  .where(course_id: params[:course_id])
  .includes(:quiz_items)
  .order(:created_at)
```

`apps/core/app/controllers/api/v1/discussions_controller.rb` — `index` action:
```ruby
discussions = policy_scope(Discussion)
  .where(course_id: params[:course_id])
  .includes(:created_by)
  .order(:created_at)
```

After adding eager loading, run `bundle exec rspec` — if Bullet raises on any remaining N+1, fix those too.

### 4. Create Materialized Views for Analytics

Create migration `apps/core/db/migrate/[timestamp]_create_analytics_materialized_views.rb`:

```ruby
class CreateAnalyticsMaterializedViews < ActiveRecord::Migration[8.0]
  def up
    execute <<~SQL
      CREATE MATERIALIZED VIEW tenant_daily_stats AS
      SELECT
        tenants.id AS tenant_id,
        DATE(submissions.submitted_at) AS stat_date,
        COUNT(DISTINCT submissions.student_id) AS active_students,
        COUNT(submissions.id) AS submissions_count,
        COUNT(DISTINCT CASE WHEN submissions.grade IS NOT NULL THEN submissions.id END) AS graded_count
      FROM tenants
      LEFT JOIN assignments ON assignments.tenant_id = tenants.id
      LEFT JOIN submissions ON submissions.assignment_id = assignments.id
        AND submissions.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY tenants.id, DATE(submissions.submitted_at)
      WITH DATA;

      CREATE UNIQUE INDEX idx_tenant_daily_stats_unique
        ON tenant_daily_stats (tenant_id, stat_date);
      CREATE INDEX idx_tenant_daily_stats_date
        ON tenant_daily_stats (stat_date);
    SQL

    execute <<~SQL
      CREATE MATERIALIZED VIEW course_engagement_stats AS
      SELECT
        courses.id AS course_id,
        courses.tenant_id,
        COUNT(DISTINCT enrollments.user_id) AS enrolled_students,
        COUNT(DISTINCT submissions.student_id) AS active_students,
        AVG(submissions.grade) AS average_grade,
        COUNT(DISTINCT quiz_attempts.user_id) AS quiz_participants
      FROM courses
      LEFT JOIN sections ON sections.course_id = courses.id
      LEFT JOIN enrollments ON enrollments.section_id = sections.id
      LEFT JOIN assignments ON assignments.course_id = courses.id
      LEFT JOIN submissions ON submissions.assignment_id = assignments.id
      LEFT JOIN quizzes ON quizzes.course_id = courses.id
      LEFT JOIN quiz_attempts ON quiz_attempts.quiz_id = quizzes.id
      GROUP BY courses.id, courses.tenant_id
      WITH DATA;

      CREATE UNIQUE INDEX idx_course_engagement_unique
        ON course_engagement_stats (course_id);
      CREATE INDEX idx_course_engagement_tenant
        ON course_engagement_stats (tenant_id);
    SQL
  end

  def down
    execute "DROP MATERIALIZED VIEW IF EXISTS course_engagement_stats;"
    execute "DROP MATERIALIZED VIEW IF EXISTS tenant_daily_stats;"
  end
end
```

Create `apps/core/app/jobs/refresh_analytics_views_job.rb`:

```ruby
class RefreshAnalyticsViewsJob < ApplicationJob
  queue_as :low

  VIEWS = %w[tenant_daily_stats course_engagement_stats].freeze

  def perform
    VIEWS.each do |view|
      ActiveRecord::Base.connection.execute(
        "REFRESH MATERIALIZED VIEW CONCURRENTLY #{view}"
      )
      Rails.logger.info("[Analytics] Refreshed materialized view: #{view}")
    end
  end
end
```

Schedule the job. Check `apps/core/config/initializers/` for an existing Sidekiq cron config. If `sidekiq_cron.rb` exists, append to it. If not, create it:

```ruby
# apps/core/config/initializers/sidekiq_cron.rb
if defined?(Sidekiq::Cron)
  Sidekiq::Cron::Job.create(
    name: "Refresh analytics views - every hour",
    cron: "0 * * * *",
    class: "RefreshAnalyticsViewsJob"
  )
end
```

If `sidekiq-cron` is not in the Gemfile, add it:

```ruby
gem "sidekiq-cron", "~> 2.0"
```

### 5. Enable pg_stat_statements

Create migration `[timestamp]_enable_pg_stat_statements.rb`:

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

Create `apps/core/app/services/slow_query_service.rb`:

```ruby
class SlowQueryService
  DEFAULT_LIMIT = 20

  def self.top_queries(limit: DEFAULT_LIMIT)
    result = ActiveRecord::Base.connection.execute(<<~SQL)
      SELECT
        queryid,
        LEFT(query, 200) AS query_preview,
        calls,
        ROUND(total_exec_time::numeric, 2) AS total_time_ms,
        ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
        ROUND(max_exec_time::numeric, 2) AS max_time_ms,
        rows
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_exec_time DESC
      LIMIT #{limit.to_i}
    SQL
    result.to_a
  rescue ActiveRecord::StatementInvalid => e
    Rails.logger.warn("[SlowQueryService] pg_stat_statements not available: #{e.message}")
    []
  end

  def self.reset!
    ActiveRecord::Base.connection.execute("SELECT pg_stat_statements_reset()")
  rescue ActiveRecord::StatementInvalid
    nil
  end
end
```

### 6. Optimize database.yml Connection Pool

Update `apps/core/config/database.yml`. Find the production or default section and add pool configuration:

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

production:
  <<: *default
  url: <%= ENV["DATABASE_URL"] %>
  pool: <%= ENV.fetch("DB_POOL") { 20 } %>
  reaping_frequency: 10
  checkout_timeout: 5
```

Create `apps/core/config/pgbouncer.ini.example` for documentation:

```ini
[databases]
k12_production = host=<DB_HOST> port=5432 dbname=k12_production

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 200
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_lifetime = 3600
server_idle_timeout = 600
```

### 7. Write Tests

**File: `apps/core/spec/models/counter_cache_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Counter caches", type: :model do
  let!(:tenant) { create(:tenant) }
  before { Current.tenant = tenant }
  after  { Current.tenant = nil }

  it "increments courses_count on tenant when course is created" do
    expect {
      create(:course, tenant: tenant)
    }.to change { tenant.reload.courses_count }.by(1)
  end

  it "increments assignments_count on course when assignment is created" do
    course = create(:course, tenant: tenant)
    expect {
      create(:assignment, course: course, tenant: tenant)
    }.to change { course.reload.assignments_count }.by(1)
  end

  it "increments submissions_count on assignment when submission is created" do
    course = create(:course, tenant: tenant)
    assignment = create(:assignment, course: course, tenant: tenant)
    student = create(:user, tenant: tenant)
    expect {
      create(:submission, assignment: assignment, student: student, tenant: tenant)
    }.to change { assignment.reload.submissions_count }.by(1)
  end
end
```

**File: `apps/core/spec/jobs/refresh_analytics_views_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe RefreshAnalyticsViewsJob, type: :job do
  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end

  it "runs without error" do
    expect { described_class.perform_now }.not_to raise_error
  end
end
```

**File: `apps/core/spec/services/slow_query_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SlowQueryService do
  describe ".top_queries" do
    it "returns an array" do
      expect(described_class.top_queries(limit: 5)).to be_an(Array)
    end

    it "returns empty array if extension not available" do
      allow(ActiveRecord::Base.connection).to receive(:execute)
        .and_raise(ActiveRecord::StatementInvalid.new("extension not found"))
      expect(described_class.top_queries).to eq([])
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/jobs/refresh_analytics_views_job.rb` | Hourly materialized view refresh |
| `apps/core/app/services/slow_query_service.rb` | pg_stat_statements query interface |
| `apps/core/config/pgbouncer.ini.example` | PgBouncer configuration template |
| `apps/core/db/migrate/[ts]_create_analytics_materialized_views.rb` | Analytics views |
| `apps/core/db/migrate/[ts]_enable_pg_stat_statements.rb` | pg_stat_statements extension |
| `apps/core/spec/models/counter_cache_spec.rb` | Counter cache verification |
| `apps/core/spec/jobs/refresh_analytics_views_job_spec.rb` | MV refresh tests |
| `apps/core/spec/services/slow_query_service_spec.rb` | Slow query service tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/Gemfile` | Add `bullet` (dev/test), `sidekiq-cron` if not present |
| `apps/core/config/environments/development.rb` | Bullet config |
| `apps/core/config/environments/test.rb` | Bullet config (raise: true) |
| `apps/core/config/database.yml` | Pool size, checkout_timeout, reaping_frequency |
| `apps/core/app/models/assignment.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/submission.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/discussion.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/discussion_post.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/quiz.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/enrollment.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/question.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/user.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/course.rb` | `counter_cache: true` (if missing) |
| `apps/core/app/models/school.rb` | `counter_cache: true` (if missing) |
| `apps/core/config/initializers/sidekiq_cron.rb` | Schedule RefreshAnalyticsViewsJob |
| Multiple controllers | Add `.includes()` for eager loading where missing |

---

## Definition of Done

- [ ] All model `belongs_to` associations with counter cache columns have `counter_cache: true`
- [ ] Bullet gem installed; `bundle exec rspec` raises zero N+1 warnings
- [ ] Materialized views `tenant_daily_stats` and `course_engagement_stats` exist in schema
- [ ] `RefreshAnalyticsViewsJob` runs hourly via Sidekiq cron without error
- [ ] `pg_stat_statements` extension enabled; `SlowQueryService.top_queries` returns array
- [ ] `database.yml` has pool size, checkout_timeout, reaping_frequency
- [ ] `pgbouncer.ini.example` documents connection pooling configuration
- [ ] `counter_cache_spec.rb` passes
- [ ] `refresh_analytics_views_job_spec.rb` passes
- [ ] `slow_query_service_spec.rb` passes
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
