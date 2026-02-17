# CODEX_ADMIN_ANALYTICS_DASHBOARD — Platform Analytics and Success Metrics

**Priority:** P0
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-8 (MVP Success Metrics), PRD-22 (Observability), PRD-6 (Admin Problems — reduce tool sprawl)
**Depends on:** None

---

## Problem

PRD-8 defines five explicit success metrics but no dashboards exist to measure them:

| Metric | PRD Target | Current Measurement |
|--------|-----------|---------------------|
| Time-to-first-unit | < 20 minutes | Not measured |
| Weekly Active Teachers | ≥ 60% | Not measured |
| Unit publish rate | ≥ 40% | Not measured |
| Drive attach time | < 30 seconds | Not measured |
| AI weekly usage | ≥ 25% | Not measured |

The "Report" section in the left nav has only a generic overview page and standards coverage. School administrators have no visibility into:

1. **Platform adoption** — which teachers are using the system, how often, what features
2. **Content production** — units created, published, version counts, template reuse rates
3. **Student engagement** — submission rates, quiz completion, discussion participation
4. **AI usage** — invocations per teacher, task types, policy enforcement events
5. **System health** — API response times, error rates, job queue depth (admin-facing)
6. **Historical trends** — all metrics over time (weekly, monthly, term, year)

---

## Tasks

### 1. Create Analytics Aggregation Service

Create `apps/core/app/services/analytics_aggregation_service.rb`:

```ruby
class AnalyticsAggregationService
  def initialize(tenant, date_range: nil)
    @tenant = tenant
    @date_range = date_range || (30.days.ago..Time.current)
  end

  def platform_summary
    {
      active_teachers: active_teachers_count,
      active_students: active_students_count,
      total_users: total_users_count,
      teacher_activity_rate: teacher_activity_rate,
      student_activity_rate: student_activity_rate,
    }
  end

  def content_metrics
    {
      units_created: units_created_count,
      units_published: units_published_count,
      publish_rate: unit_publish_rate,
      lessons_created: lessons_created_count,
      templates_used: template_usage_count,
      template_reuse_rate: template_reuse_rate,
      avg_time_to_first_unit: avg_time_to_first_unit,
    }
  end

  def engagement_metrics
    {
      submissions_count: submissions_in_range,
      quiz_attempts_count: quiz_attempts_in_range,
      quiz_completion_rate: quiz_completion_rate,
      discussion_posts_count: discussion_posts_in_range,
      avg_submissions_per_student: avg_submissions_per_student,
      assignments_with_submissions_rate: assignment_submission_rate,
    }
  end

  def ai_metrics
    {
      total_invocations: ai_invocations_count,
      unique_ai_teachers: unique_ai_users_count,
      ai_usage_rate: ai_weekly_usage_rate,
      invocations_by_task: invocations_by_task_type,
      avg_tokens_per_invocation: avg_tokens,
      policy_blocks_count: policy_blocks_count,
    }
  end

  def trend_data(interval: :weekly)
    # Returns arrays of {period, value} for each key metric
    # interval: :daily, :weekly, :monthly
    {
      active_teachers_trend: teacher_trend(interval),
      content_created_trend: content_trend(interval),
      submissions_trend: submissions_trend(interval),
      ai_usage_trend: ai_usage_trend(interval),
    }
  end

  private

  def active_teachers_count
    User.joins(:roles).where(roles: { name: "teacher" })
        .where(last_sign_in_at: @date_range)
        .where(tenant: @tenant).count
  end

  def teacher_activity_rate
    total = User.joins(:roles).where(roles: { name: "teacher" }, tenant: @tenant).count
    return 0 if total.zero?
    (active_teachers_count.to_f / total * 100).round(1)
  end

  # ... additional private methods for each metric
end
```

### 2. Create Analytics API Controller

Create `apps/core/app/controllers/api/v1/analytics_controller.rb`:

```ruby
class Api::V1::AnalyticsController < ApplicationController
  before_action :authorize_admin

  # GET /api/v1/analytics/platform
  def platform
    service = AnalyticsAggregationService.new(Current.tenant, date_range: parsed_date_range)
    render json: {
      summary: service.platform_summary,
      content: service.content_metrics,
      engagement: service.engagement_metrics,
      ai: service.ai_metrics,
    }
  end

  # GET /api/v1/analytics/trends
  def trends
    service = AnalyticsAggregationService.new(Current.tenant, date_range: parsed_date_range)
    interval = params[:interval]&.to_sym || :weekly
    render json: service.trend_data(interval: interval)
  end

  # GET /api/v1/analytics/teachers
  def teachers
    teachers = User.joins(:roles)
                   .where(roles: { name: "teacher" }, tenant: Current.tenant)
                   .select("users.*, MAX(users.last_sign_in_at) as last_active")
                   .group("users.id")

    render json: teachers.map { |t| teacher_analytics(t) }
  end

  # GET /api/v1/analytics/courses/:course_id
  def course
    course = Course.find(params[:course_id])
    authorize course, :show?
    render json: CourseAnalyticsService.new(course, date_range: parsed_date_range).call
  end

  private

  def authorize_admin
    authorize :analytics, :view?
  end

  def parsed_date_range
    start_date = params[:start_date]&.to_date || 30.days.ago
    end_date = params[:end_date]&.to_date || Date.current
    start_date.beginning_of_day..end_date.end_of_day
  end
end
```

### 3. Create Analytics Policy

Create `apps/core/app/policies/analytics_policy.rb`:
- `view?` — admin, curriculum_lead roles
- `export?` — admin only
- Headless policy (no model, uses `authorize :analytics, :view?`)

### 4. Create Course Analytics Service

Create `apps/core/app/services/course_analytics_service.rb`:
- Per-course metrics: enrollment, submission rates, grade distribution, at-risk students
- Assignment-level breakdown: submission counts, average grades, on-time rates
- Quiz analytics: attempt rates, average scores, question difficulty

### 5. Build Admin Analytics Dashboard Page

Create `apps/web/src/app/admin/analytics/page.tsx`:

**Layout:**
- Date range picker (7d, 30d, 90d, term, year, custom)
- Four metric cards at top: Active Teachers (%), Unit Publish Rate (%), AI Usage Rate (%), Student Engagement Rate (%)
- Each card shows current value, target (from PRD-8), and trend arrow (up/down vs prior period)

**Sections (tabbed):**
- **Overview** — Summary cards + trend line charts (active teachers over time, content creation over time)
- **Content** — Units created/published, template reuse, lesson counts, publish pipeline funnel
- **Engagement** — Submissions, quiz completions, discussion activity, per-course breakdown table
- **AI Usage** — Invocations by task type (bar chart), unique users, policy blocks, tokens consumed
- **Teachers** — Sortable table: name, last active, units created, AI invocations, students

**Charts:** Use a lightweight charting approach:
- Trend lines rendered as SVG `<polyline>` in a small component (no chart library dependency)
- Bar charts as CSS grid with percentage-width divs
- Distribution charts as stacked horizontal bars

### 6. Build Course Analytics Page

Create `apps/web/src/app/teach/courses/[courseId]/analytics/page.tsx`:
- Teacher-facing (not admin-only)
- Enrollment count, active students, submission rates
- Assignment completion heatmap (students x assignments, green/yellow/red/gray)
- Grade distribution histogram
- At-risk students list (students with < 60% average or > 2 missing assignments)

### 7. Add Navigation Links

Update existing pages:
- `/admin/dashboard` — Add "Analytics" card linking to `/admin/analytics`
- `/teach/courses/[courseId]` — Add "Analytics" tab in course navigation
- AppShell left nav "Report" section — Add "Platform Analytics" link for admin role

### 8. Add Tests

**Backend:**
- `apps/core/spec/services/analytics_aggregation_service_spec.rb`
  - Platform summary returns correct counts
  - Content metrics calculates publish rate correctly
  - AI metrics counts invocations by task type
  - Trend data returns correct number of periods
  - Empty data returns zeros (not errors)
  - Date range filtering works correctly

- `apps/core/spec/services/course_analytics_service_spec.rb`
  - Returns per-course enrollment and submission data
  - Grade distribution calculation
  - At-risk student identification

- `apps/core/spec/requests/api/v1/analytics_controller_spec.rb`
  - Admin can access platform analytics
  - Teacher cannot access platform analytics
  - Teacher can access own course analytics
  - Date range filtering via query params
  - Tenant scoping enforced

**Frontend:**
- `apps/web/src/app/admin/analytics/page.test.tsx`
  - Renders metric cards with data
  - Date range picker changes request params
  - Tab switching renders correct sections
  - Loading skeletons display

- `apps/web/src/app/teach/courses/[courseId]/analytics/page.test.tsx`
  - Renders course metrics
  - At-risk students list displays

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/analytics_aggregation_service.rb` | Platform-wide metric aggregation |
| `apps/core/app/services/course_analytics_service.rb` | Per-course analytics |
| `apps/core/app/controllers/api/v1/analytics_controller.rb` | Analytics API endpoints |
| `apps/core/app/policies/analytics_policy.rb` | Admin-only access control |
| `apps/web/src/app/admin/analytics/page.tsx` | Admin analytics dashboard |
| `apps/web/src/app/teach/courses/[courseId]/analytics/page.tsx` | Course analytics page |
| `apps/core/spec/services/analytics_aggregation_service_spec.rb` | Service tests |
| `apps/core/spec/services/course_analytics_service_spec.rb` | Course analytics tests |
| `apps/core/spec/requests/api/v1/analytics_controller_spec.rb` | API tests |
| `apps/web/src/app/admin/analytics/page.test.tsx` | Dashboard UI tests |
| `apps/web/src/app/teach/courses/[courseId]/analytics/page.test.tsx` | Course analytics UI tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add analytics routes |
| `apps/web/src/app/admin/dashboard/page.tsx` | Add analytics card link |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx` | Add analytics tab |
| `apps/web/src/components/AppShell.tsx` | Add analytics link to Report nav |

---

## Definition of Done

- [ ] AnalyticsAggregationService returns platform, content, engagement, AI, and trend metrics
- [ ] CourseAnalyticsService returns per-course enrollment, submission, and grade data
- [ ] Admin analytics dashboard renders all five PRD-8 metrics with targets and trends
- [ ] Course analytics page shows completion heatmap and at-risk students
- [ ] Date range picker filters all metrics correctly
- [ ] Analytics endpoints restricted to admin/curriculum_lead roles
- [ ] Course analytics accessible to course teachers
- [ ] All backend service and request specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
- [ ] Tenant scoping enforced on all queries
