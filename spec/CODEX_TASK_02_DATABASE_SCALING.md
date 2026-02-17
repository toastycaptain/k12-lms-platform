# CODEX_TASK_02 — Database Scaling (Backend Only)

**Priority:** P0
**Effort:** 6–8 hours
**Depends On:** None
**Branch:** `batch7/02-database-scaling`

---

## Objective

Optimize the PostgreSQL database for multi-school concurrent load. Fix N+1 queries, add counter caches, create materialized views for analytics, add missing indexes, and configure connection pooling.

---

## Tasks

### 1. N+1 Query Audit and Eager Loading

Install and configure Bullet gem for development:

Add to `apps/core/Gemfile` (development group):

```ruby
gem "bullet", "~> 8.0"
```

Add to `apps/core/config/environments/development.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.rails_logger = true
  Bullet.raise = false  # Log only, don't crash
end
```

Add to `apps/core/config/environments/test.rb`:

```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.raise = true  # Fail tests on N+1
end
```

**Audit these high-traffic controllers and add eager loading:**

`apps/core/app/controllers/api/v1/courses_controller.rb` — index action:
```ruby
def index
  authorize Course
  courses = policy_scope(Course)
    .includes(:sections, :academic_year, :course_modules)
    .order(:name)
  render json: courses
end
```

`apps/core/app/controllers/api/v1/assignments_controller.rb` — index action:
```ruby
def index
  authorize Assignment
  assignments = policy_scope(Assignment)
    .where(course_id: params[:course_id])
    .includes(:created_by, :rubric, :standards, :submissions)
    .order(:due_at)
  render json: assignments
end
```

`apps/core/app/controllers/api/v1/submissions_controller.rb` — index action:
```ruby
def index
  authorize Submission
  submissions = policy_scope(Submission)
    .where(assignment_id: params[:assignment_id])
    .includes(:student, :graded_by)
    .order(:submitted_at)
  render json: submissions
end
```

`apps/core/app/controllers/api/v1/enrollments_controller.rb` — index action:
```ruby
def index
  authorize Enrollment
  enrollments = policy_scope(Enrollment)
    .where(section_id: params[:section_id])
    .includes(:user, :section)
    .order(created_at: :desc)
  render json: enrollments
end
```

`apps/core/app/controllers/api/v1/users_controller.rb` — index action:
```ruby
def index
  authorize User
  users = policy_scope(User)
    .includes(:roles)
    .order(:last_name, :first_name)
  # ... existing filters ...
  render json: users
end
```

`apps/core/app/controllers/api/v1/quizzes_controller.rb` — index action:
```ruby
def index
  authorize Quiz
  quizzes = policy_scope(Quiz)
    .where(course_id: params[:course_id])
    .includes(:quiz_items, :quiz_attempts)
    .order(:created_at)
  render json: quizzes
end
```

`apps/core/app/controllers/api/v1/discussions_controller.rb` — index action:
```ruby
def index
  authorize Discussion
  discussions = policy_scope(Discussion)
    .where(course_id: params[:course_id])
    .includes(:created_by, :discussion_posts)
    .order(:created_at)
  render json: discussions
end
```

**Review every controller `index` action.** For each, verify the query includes associations that are serialized. If the serializer references `object.association`, add `.includes(:association)` to the query.

### 2. Counter Caches

Create a migration adding counter cache columns to avoid COUNT(*) queries on list pages:

```ruby
class AddCounterCaches < ActiveRecord::Migration[8.0]
  def change
    # Tenant summary stats
    add_column :tenants, :users_count, :integer, default: 0, null: false
    add_column :tenants, :courses_count, :integer, default: 0, null: false
    add_column :tenants, :schools_count, :integer, default: 0, null: false

    # Course stats
    add_column :courses, :enrollments_count, :integer, default: 0, null: false
    add_column :courses, :assignments_count, :integer, default: 0, null: false
    add_column :courses, :discussions_count, :integer, default: 0, null: false
    add_column :courses, :quizzes_count, :integer, default: 0, null: false

    # Assignment stats
    add_column :assignments, :submissions_count, :integer, default: 0, null: false

    # Discussion stats
    add_column :discussions, :discussion_posts_count, :integer, default: 0, null: false

    # Question bank stats
    add_column :question_banks, :questions_count, :integer, default: 0, null: false

    # Section stats
    add_column :sections, :enrollments_count, :integer, default: 0, null: false
  end
end
```

Create a data migration to backfill existing counts:

```ruby
class BackfillCounterCaches < ActiveRecord::Migration[8.0]
  def up
    # Backfill tenant counts
    execute <<~SQL
      UPDATE tenants SET users_count = (SELECT COUNT(*) FROM users WHERE users.tenant_id = tenants.id);
      UPDATE tenants SET courses_count = (SELECT COUNT(*) FROM courses WHERE courses.tenant_id = tenants.id);
      UPDATE tenants SET schools_count = (SELECT COUNT(*) FROM schools WHERE schools.tenant_id = tenants.id);
    SQL

    # Backfill course counts
    execute <<~SQL
      UPDATE courses SET enrollments_count = (
        SELECT COUNT(*) FROM enrollments
        JOIN sections ON sections.id = enrollments.section_id
        WHERE sections.course_id = courses.id
      );
      UPDATE courses SET assignments_count = (SELECT COUNT(*) FROM assignments WHERE assignments.course_id = courses.id);
      UPDATE courses SET discussions_count = (SELECT COUNT(*) FROM discussions WHERE discussions.course_id = courses.id);
      UPDATE courses SET quizzes_count = (SELECT COUNT(*) FROM quizzes WHERE quizzes.course_id = courses.id);
    SQL

    # Backfill assignment counts
    execute <<~SQL
      UPDATE assignments SET submissions_count = (SELECT COUNT(*) FROM submissions WHERE submissions.assignment_id = assignments.id);
    SQL

    # Backfill discussion counts
    execute <<~SQL
      UPDATE discussions SET discussion_posts_count = (SELECT COUNT(*) FROM discussion_posts WHERE discussion_posts.discussion_id = discussions.id);
    SQL

    # Backfill question bank counts
    execute <<~SQL
      UPDATE question_banks SET questions_count = (SELECT COUNT(*) FROM questions WHERE questions.question_bank_id = question_banks.id);
    SQL

    # Backfill section counts
    execute <<~SQL
      UPDATE sections SET enrollments_count = (SELECT COUNT(*) FROM enrollments WHERE enrollments.section_id = sections.id);
    SQL
  end

  def down
    # Counter caches will be stale but that's acceptable for rollback
  end
end
```

**Update models to use counter caches:**

In `apps/core/app/models/user.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

In `apps/core/app/models/course.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

In `apps/core/app/models/school.rb`:
```ruby
belongs_to :tenant, counter_cache: true
```

In `apps/core/app/models/assignment.rb`:
```ruby
belongs_to :course, counter_cache: true
```

In `apps/core/app/models/submission.rb`:
```ruby
belongs_to :assignment, counter_cache: true
```

In `apps/core/app/models/discussion.rb`:
```ruby
belongs_to :course, counter_cache: true
```

In `apps/core/app/models/discussion_post.rb`:
```ruby
belongs_to :discussion, counter_cache: true
```

In `apps/core/app/models/quiz.rb`:
```ruby
belongs_to :course, counter_cache: true
```

In `apps/core/app/models/question.rb` (if it belongs_to :question_bank):
```ruby
belongs_to :question_bank, counter_cache: true
```

In `apps/core/app/models/enrollment.rb`:
```ruby
belongs_to :section, counter_cache: true
```

**Note:** Check each model file before modifying — if `counter_cache: true` already exists on the `belongs_to`, skip it. Some may have been added in earlier batches.

### 3. Materialized Views for Analytics

Create materialized views to precompute the heavy analytics queries from Batch 6:

```ruby
class CreateAnalyticsMaterializedViews < ActiveRecord::Migration[8.0]
  def up
    # Daily tenant activity summary
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

      CREATE UNIQUE INDEX idx_tenant_daily_stats_unique ON tenant_daily_stats (tenant_id, stat_date);
      CREATE INDEX idx_tenant_daily_stats_date ON tenant_daily_stats (stat_date);
    SQL

    # Course engagement summary
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

      CREATE UNIQUE INDEX idx_course_engagement_unique ON course_engagement_stats (course_id);
      CREATE INDEX idx_course_engagement_tenant ON course_engagement_stats (tenant_id);
    SQL
  end

  def down
    execute "DROP MATERIALIZED VIEW IF EXISTS course_engagement_stats;"
    execute "DROP MATERIALIZED VIEW IF EXISTS tenant_daily_stats;"
  end
end
```

Create a Sidekiq job to refresh the materialized views:

**File: `apps/core/app/jobs/refresh_analytics_views_job.rb`**

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

Schedule it via Sidekiq cron (add to `config/initializers/sidekiq.rb` or `config/sidekiq_cron.yml`):

```ruby
# config/initializers/sidekiq_cron.rb (or wherever cron jobs are configured)
Sidekiq::Cron::Job.create(
  name: "Refresh analytics views - every hour",
  cron: "0 * * * *",
  class: "RefreshAnalyticsViewsJob"
) if defined?(Sidekiq::Cron)
```

If Sidekiq::Cron is not installed, add a recurring job using whatever scheduling pattern the project already uses (check `config/initializers/` for existing patterns). If none exists, document the cron job requirement and add the `sidekiq-cron` gem:

```ruby
# Gemfile
gem "sidekiq-cron", "~> 2.0"
```

### 4. Composite Index Audit

Create a migration adding indexes for the most common query patterns:

```ruby
class AddPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    # Submission lookups (grading view, inbox)
    add_index :submissions, [:assignment_id, :student_id], unique: true,
      name: "idx_submissions_assignment_student",
      if_not_exists: true
    add_index :submissions, [:assignment_id, :status],
      name: "idx_submissions_assignment_status",
      if_not_exists: true

    # Enrollment lookups (roster, grade passback)
    add_index :enrollments, [:section_id, :user_id], unique: true,
      name: "idx_enrollments_section_user",
      if_not_exists: true

    # Quiz attempts (analytics, grading)
    add_index :quiz_attempts, [:quiz_id, :user_id],
      name: "idx_quiz_attempts_quiz_user",
      if_not_exists: true
    add_index :quiz_attempts, [:quiz_id, :status],
      name: "idx_quiz_attempts_quiz_status",
      if_not_exists: true

    # Discussion posts (thread rendering)
    add_index :discussion_posts, [:discussion_id, :created_at],
      name: "idx_discussion_posts_thread_order",
      if_not_exists: true

    # Standards alignment (coverage reports)
    add_index :assignment_standards, [:standard_id, :assignment_id],
      name: "idx_assignment_standards_lookup",
      if_not_exists: true

    # Audit logs (admin viewing)
    add_index :audit_logs, [:tenant_id, :created_at],
      name: "idx_audit_logs_tenant_time",
      if_not_exists: true
    add_index :audit_logs, [:tenant_id, :action, :created_at],
      name: "idx_audit_logs_tenant_action_time",
      if_not_exists: true

    # Notifications (user inbox)
    add_index :notifications, [:user_id, :read, :created_at],
      name: "idx_notifications_user_unread",
      if_not_exists: true

    # Module items (course content ordering)
    add_index :module_items, [:course_module_id, :position],
      name: "idx_module_items_module_position",
      if_not_exists: true

    # AI invocations (safety dashboard, audit)
    add_index :ai_invocations, [:tenant_id, :created_at],
      name: "idx_ai_invocations_tenant_time",
      if_not_exists: true
  end
end
```

**Important:** Before adding each index, check if it already exists. Use `if_not_exists: true` on every `add_index` call. Some of these may have been added in Batch 5 performance work.

### 5. pg_stat_statements Setup

Create a migration to enable the extension:

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

Create a service to expose slow query data:

**File: `apps/core/app/services/slow_query_service.rb`**

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
    # Extension not available
  end
end
```

### 6. Connection Pooling Configuration

Update `apps/core/config/database.yml` to optimize pool settings:

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000
  prepared_statements: true
  advisory_locks: true

production:
  <<: *default
  url: <%= ENV["DATABASE_URL"] %>
  pool: <%= ENV.fetch("DB_POOL") { 20 } %>
  reaping_frequency: 10
  checkout_timeout: 5
```

Document PgBouncer configuration for production:

**File: `apps/core/config/pgbouncer.ini.example`**

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
log_connections = 0
log_disconnections = 0
stats_period = 60
```

### 7. Write Tests

**File: `apps/core/spec/jobs/refresh_analytics_views_job_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe RefreshAnalyticsViewsJob, type: :job do
  it "refreshes all materialized views without error" do
    expect { described_class.perform_now }.not_to raise_error
  end

  it "is enqueued in the low queue" do
    expect(described_class.new.queue_name).to eq("low")
  end
end
```

**File: `apps/core/spec/services/slow_query_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe SlowQueryService do
  describe ".top_queries" do
    it "returns an array of query stats" do
      result = described_class.top_queries(limit: 5)
      expect(result).to be_an(Array)
    end

    it "respects the limit parameter" do
      result = described_class.top_queries(limit: 3)
      expect(result.length).to be <= 3
    end

    it "returns empty array if extension not available" do
      allow(ActiveRecord::Base.connection).to receive(:execute)
        .and_raise(ActiveRecord::StatementInvalid.new("extension not found"))
      expect(described_class.top_queries).to eq([])
    end
  end
end
```

**File: `apps/core/spec/models/counter_cache_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Counter caches", type: :model do
  let!(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "increments courses_count on tenant when course is created" do
    expect {
      create(:course, tenant: tenant)
    }.to change { tenant.reload.courses_count }.by(1)
  end

  it "increments submissions_count on assignment when submission is created" do
    course = create(:course, tenant: tenant)
    assignment = create(:assignment, course: course, tenant: tenant)
    student = create(:user, tenant: tenant)

    expect {
      create(:submission, assignment: assignment, student: student, tenant: tenant)
    }.to change { assignment.reload.submissions_count }.by(1)
  end

  it "increments enrollments_count on section when enrollment is created" do
    course = create(:course, tenant: tenant)
    section = create(:section, course: course, tenant: tenant)
    student = create(:user, tenant: tenant)

    expect {
      create(:enrollment, section: section, user: student, tenant: tenant)
    }.to change { section.reload.enrollments_count }.by(1)
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
| `db/migrate/YYYYMMDDHHMMSS_add_counter_caches.rb` | Counter cache columns |
| `db/migrate/YYYYMMDDHHMMSS_backfill_counter_caches.rb` | Backfill existing counts |
| `db/migrate/YYYYMMDDHHMMSS_create_analytics_materialized_views.rb` | Analytics MVs |
| `db/migrate/YYYYMMDDHHMMSS_add_performance_indexes_v3.rb` | Composite indexes |
| `db/migrate/YYYYMMDDHHMMSS_enable_pg_stat_statements.rb` | pg_stat_statements extension |
| `apps/core/spec/jobs/refresh_analytics_views_job_spec.rb` | MV refresh tests |
| `apps/core/spec/services/slow_query_service_spec.rb` | Slow query service tests |
| `apps/core/spec/models/counter_cache_spec.rb` | Counter cache verification |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/Gemfile` | Add `bullet` (dev/test), `sidekiq-cron` |
| `apps/core/config/environments/development.rb` | Bullet config |
| `apps/core/config/environments/test.rb` | Bullet config |
| `apps/core/config/database.yml` | Pool size, checkout timeout, reaping |
| `apps/core/app/models/user.rb` | `counter_cache: true` on `belongs_to :tenant` |
| `apps/core/app/models/course.rb` | `counter_cache: true` on `belongs_to :tenant` |
| `apps/core/app/models/school.rb` | `counter_cache: true` on `belongs_to :tenant` |
| `apps/core/app/models/assignment.rb` | `counter_cache: true` on `belongs_to :course` |
| `apps/core/app/models/submission.rb` | `counter_cache: true` on `belongs_to :assignment` |
| `apps/core/app/models/discussion.rb` | `counter_cache: true` on `belongs_to :course` |
| `apps/core/app/models/discussion_post.rb` | `counter_cache: true` on `belongs_to :discussion` |
| `apps/core/app/models/quiz.rb` | `counter_cache: true` on `belongs_to :course` |
| `apps/core/app/models/enrollment.rb` | `counter_cache: true` on `belongs_to :section` |
| Multiple controllers | Add `.includes()` for eager loading |

---

## Definition of Done

- [ ] Bullet gem installed and configured in dev/test
- [ ] All controller index actions reviewed; eager loading added where needed
- [ ] Counter caches added on 11 columns across 7 tables
- [ ] Counter caches backfilled for existing data
- [ ] Materialized views created for tenant_daily_stats and course_engagement_stats
- [ ] RefreshAnalyticsViewsJob runs hourly via Sidekiq cron
- [ ] Composite indexes added for common query patterns (with if_not_exists guards)
- [ ] pg_stat_statements enabled; SlowQueryService exposes top queries
- [ ] database.yml optimized with pool size, checkout timeout, reaping
- [ ] PgBouncer configuration documented
- [ ] All new tests pass
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
