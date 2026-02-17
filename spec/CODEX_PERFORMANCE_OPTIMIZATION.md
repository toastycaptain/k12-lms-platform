# CODEX_PERFORMANCE_OPTIMIZATION — Query Optimization, Caching, and N+1 Prevention

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Performance), PRD-8 (MVP Success Metrics — Drive attach < 30s)
**Depends on:** None

---

## Problem

The backend uses straightforward ActiveRecord queries without optimization. Several patterns create performance risks at scale:

1. **N+1 queries** — controllers load associations without `includes`/`preload`, causing sequential queries per record
2. **No query-level caching** — repeated reads (standards, frameworks, templates) hit the database every time
3. **No fragment caching** — serializer output isn't cached
4. **Unbounded queries** — some endpoints don't limit result sets
5. **Frontend request waterfalls** — pages issue sequential API calls instead of parallel ones (partially addressed, but gradebook/dashboard patterns remain)
6. **No database query monitoring** — no N+1 detection or slow query logging

---

## Tasks

### 1. Add Bullet Gem for N+1 Detection

Add to `Gemfile` (development/test group):
```ruby
gem "bullet", "~> 8.0"
```

Configure in `apps/core/config/environments/development.rb`:
```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.bullet_logger = true
  Bullet.rails_logger = true
  Bullet.add_footer = true
end
```

Configure in `apps/core/config/environments/test.rb`:
```ruby
config.after_initialize do
  Bullet.enable = true
  Bullet.raise = true  # Fail tests on N+1
end
```

### 2. Fix N+1 Queries in Controllers

Audit and fix every controller that loads associations:

**High-priority controllers (most likely to have N+1):**

| Controller | Current | Fix |
|-----------|---------|-----|
| `courses_controller#index` | `Course.all` | `Course.includes(:sections, :enrollments)` |
| `assignments_controller#index` | nested course lookup | `includes(:submissions, :resource_links, :rubric)` |
| `unit_plans_controller#index` | loads versions separately | `includes(:unit_versions, current_version: :standards)` |
| `submissions_controller#index` | loads user per submission | `includes(:user, :assignment)` |
| `discussions_controller#index` | loads posts count | `includes(:discussion_posts)` or counter cache |
| `quiz_attempts_controller#index` | loads answers per attempt | `includes(:attempt_answers)` |
| `gradebook_controller#show` | sequential fetches | Consolidate into single query with `includes` |
| `templates_controller#index` | loads versions | `includes(:template_versions)` |
| `standards_controller#index` | loads framework per standard | `includes(:standard_framework)` |
| `module_items_controller#index` | polymorphic association | `includes(:module_itemable)` if feasible |

### 3. Add Counter Caches

Add counter caches for frequently counted associations:

```ruby
# Migration
class AddCounterCaches < ActiveRecord::Migration[8.0]
  def change
    add_column :courses, :assignments_count, :integer, default: 0, null: false
    add_column :courses, :enrollments_count, :integer, default: 0, null: false
    add_column :assignments, :submissions_count, :integer, default: 0, null: false
    add_column :discussions, :discussion_posts_count, :integer, default: 0, null: false
    add_column :quizzes, :quiz_attempts_count, :integer, default: 0, null: false
    add_column :question_banks, :questions_count, :integer, default: 0, null: false
    add_column :message_threads, :messages_count, :integer, default: 0, null: false
  end
end
```

Update models:
```ruby
# In Assignment model
belongs_to :course, counter_cache: true

# In Submission model
belongs_to :assignment, counter_cache: true
```

Reset counters with a Rake task:
```ruby
task reset_counters: :environment do
  Course.find_each { |c| Course.reset_counters(c.id, :assignments, :enrollments) }
  # ... etc
end
```

### 4. Add Low-Level Caching for Slow Reads

Add Redis-backed caching for frequently-read, rarely-changed data:

```ruby
# Standards frameworks (change rarely)
def index
  frameworks = Rails.cache.fetch("tenant:#{Current.tenant.id}:standard_frameworks", expires_in: 1.hour) do
    StandardFramework.all.to_a
  end
  render json: frameworks
end

# Standards (change rarely)
def index
  standards = Rails.cache.fetch("tenant:#{Current.tenant.id}:standards:#{params[:framework_id]}", expires_in: 1.hour) do
    Standard.where(standard_framework_id: params[:framework_id]).to_a
  end
  render json: standards
end
```

Add cache invalidation in model callbacks:
```ruby
class Standard < ApplicationRecord
  after_commit :bust_cache

  private
  def bust_cache
    Rails.cache.delete("tenant:#{tenant_id}:standards:#{standard_framework_id}")
  end
end
```

### 5. Add Eager Loading to Serializers

For serializers that include nested associations, ensure the controller preloads them:

```ruby
# In CoursesController
def show
  @course = Course.includes(
    sections: { enrollments: :user },
    assignments: [:rubric, :resource_links],
    course_modules: { module_items: :module_itemable },
  ).find(params[:id])
end
```

### 6. Add Database Indexes for Common Queries

Audit and add missing composite indexes:

```ruby
class AddPerformanceIndexes < ActiveRecord::Migration[8.0]
  def change
    # Submissions by user + assignment (grading lookups)
    add_index :submissions, [:user_id, :assignment_id], unique: true,
      if_not_exists: true

    # Enrollments by user (dashboard queries)
    add_index :enrollments, [:user_id, :section_id],
      if_not_exists: true

    # Notifications by user + read status (bell queries)
    add_index :notifications, [:user_id, :read_at],
      if_not_exists: true

    # Quiz attempts by user + quiz (attempt history)
    add_index :quiz_attempts, [:user_id, :quiz_id],
      if_not_exists: true

    # Audit logs by timestamp (recent query)
    add_index :audit_logs, :created_at,
      if_not_exists: true
  end
end
```

### 7. Add Query Logging in Development

Create `apps/core/config/initializers/query_logging.rb`:

```ruby
if Rails.env.development?
  ActiveSupport::Notifications.subscribe("sql.active_record") do |_name, start, finish, _id, payload|
    duration = (finish - start) * 1000
    if duration > 100  # Log queries slower than 100ms
      Rails.logger.warn("SLOW QUERY (#{duration.round(1)}ms): #{payload[:sql]}")
    end
  end
end
```

### 8. Add Request Timing Middleware

Create `apps/core/app/middleware/request_timing.rb`:

```ruby
class RequestTiming
  def initialize(app)
    @app = app
  end

  def call(env)
    start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    status, headers, body = @app.call(env)
    duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000).round(1)

    headers["X-Request-Duration-Ms"] = duration.to_s

    if duration > 500
      Rails.logger.warn("SLOW REQUEST (#{duration}ms): #{env['REQUEST_METHOD']} #{env['PATH_INFO']}")
    end

    [status, headers, body]
  end
end
```

### 9. Add Tests

- Update existing request specs to verify no N+1 queries (Bullet raises in test mode)
- Add `apps/core/spec/performance/n_plus_one_spec.rb` — targeted N+1 verification for top 10 endpoints
- Verify counter caches are accurate after operations

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_add_counter_caches.rb` | Counter cache columns |
| `apps/core/db/migrate/YYYYMMDD_add_performance_indexes_v2.rb` | Missing indexes |
| `apps/core/app/middleware/request_timing.rb` | Request duration tracking |
| `apps/core/config/initializers/query_logging.rb` | Slow query logging |
| `apps/core/lib/tasks/counters.rake` | Counter cache reset task |
| `apps/core/spec/performance/n_plus_one_spec.rb` | N+1 detection tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/Gemfile` | Add bullet gem |
| `apps/core/config/environments/development.rb` | Configure Bullet |
| `apps/core/config/environments/test.rb` | Configure Bullet (raise on N+1) |
| `apps/core/config/application.rb` | Add RequestTiming middleware |
| 10+ controllers | Add `includes`/`preload` for eager loading |
| 7+ models | Add `counter_cache: true` on associations |

---

## Definition of Done

- [ ] Bullet gem installed and configured (raises in test, logs in dev)
- [ ] No N+1 queries detected by Bullet in existing test suite
- [ ] Top 10 controllers use eager loading (`includes`)
- [ ] 7 counter caches added and accurate
- [ ] Redis caching for standards and frameworks
- [ ] Cache invalidation on data changes
- [ ] Performance indexes added for common query patterns
- [ ] Slow query logging active in development
- [ ] Request timing header on all responses
- [ ] All existing specs pass (no Bullet violations)
- [ ] No Rubocop violations
