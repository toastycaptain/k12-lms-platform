# CODEX_TEACHER_PROGRESS_ANALYTICS — Student Engagement, At-Risk Indicators, and Progress Tracking

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-18 (Course Delivery — grade → feedback → mastery), PRD-8 (Weekly Active Teachers), UX-3.4 (Teacher Screens)
**Depends on:** CODEX_ADMIN_ANALYTICS_DASHBOARD (shared analytics patterns)

---

## Problem

Teachers have a gradebook showing grades but lack actionable intelligence about student progress:

1. **No engagement tracking** — no visibility into which students are actively participating vs. disengaged
2. **No at-risk early warning** — no automated identification of students falling behind (low grades, missing work, declining activity)
3. **No progress over time** — no trend visualization showing whether a student is improving or declining
4. **No completion funnels** — no view of how students move through course modules (started → in progress → completed)
5. **No time-on-task data** — no indication of how long students spend on assignments or quizzes
6. **No comparative view** — no way to compare a student's performance against class averages
7. **No actionable recommendations** — data exists but isn't synthesized into "what should I do next"

Teachers currently must mentally track student engagement by scanning the gradebook row by row.

---

## Tasks

### 1. Create Student Engagement Scoring Service

Create `apps/core/app/services/student_engagement_service.rb`:

```ruby
class StudentEngagementService
  WEIGHTS = {
    submission_rate: 0.30,
    on_time_rate: 0.20,
    quiz_completion_rate: 0.20,
    discussion_participation: 0.15,
    login_recency: 0.15,
  }.freeze

  def initialize(course, student)
    @course = course
    @student = student
  end

  def score
    components = {
      submission_rate: submission_rate_score,
      on_time_rate: on_time_score,
      quiz_completion_rate: quiz_completion_score,
      discussion_participation: discussion_score,
      login_recency: login_recency_score,
    }

    weighted = components.sum { |key, val| val * WEIGHTS[key] }

    {
      overall_score: weighted.round(1),
      components: components,
      level: engagement_level(weighted),
    }
  end

  def engagement_level(score)
    case score
    when 80..100 then "high"
    when 60..79 then "moderate"
    when 40..59 then "low"
    else "critical"
    end
  end

  private

  def submission_rate_score
    total = @course.assignments.count
    return 0 if total.zero?
    submitted = Submission.where(user: @student, assignment: @course.assignments).count
    (submitted.to_f / total * 100).round(1)
  end

  # ... additional scoring methods
end
```

### 2. Create At-Risk Detection Service

Create `apps/core/app/services/at_risk_detection_service.rb`:

```ruby
class AtRiskDetectionService
  # Configurable thresholds (can be overridden per school via tenant settings)
  DEFAULT_THRESHOLDS = {
    grade_average_below: 60,
    missing_assignments_above: 2,
    days_since_login_above: 7,
    engagement_score_below: 40,
    grade_decline_percent: 15,  # grade dropped >15% vs prior period
  }.freeze

  def initialize(course)
    @course = course
    @thresholds = DEFAULT_THRESHOLDS
  end

  def at_risk_students
    enrolled_students.filter_map do |student|
      flags = detect_risk_flags(student)
      next if flags.empty?

      {
        student_id: student.id,
        name: "#{student.first_name} #{student.last_name}",
        flags: flags,
        risk_level: risk_level(flags),
        engagement: StudentEngagementService.new(@course, student).score,
        recommended_actions: recommended_actions(flags),
      }
    end
  end

  private

  def detect_risk_flags(student)
    flags = []
    flags << { type: "low_grade", value: average_grade(student) } if average_grade(student) < @thresholds[:grade_average_below]
    flags << { type: "missing_work", value: missing_count(student) } if missing_count(student) > @thresholds[:missing_assignments_above]
    flags << { type: "inactive", value: days_since_login(student) } if days_since_login(student) > @thresholds[:days_since_login_above]
    flags << { type: "declining", value: grade_decline(student) } if grade_decline(student) > @thresholds[:grade_decline_percent]
    flags
  end

  def risk_level(flags)
    return "high" if flags.size >= 3 || flags.any? { |f| f[:type] == "inactive" && f[:value] > 14 }
    return "medium" if flags.size >= 2
    "low"
  end

  def recommended_actions(flags)
    flags.map do |flag|
      case flag[:type]
      when "low_grade" then "Schedule a check-in to discuss academic support"
      when "missing_work" then "Send a reminder about missing assignments"
      when "inactive" then "Reach out to verify attendance and engagement"
      when "declining" then "Review recent work and provide targeted feedback"
      end
    end
  end
end
```

### 3. Create Progress Tracking API Endpoints

Create `apps/core/app/controllers/api/v1/progress_controller.rb`:

```ruby
class Api::V1::ProgressController < ApplicationController
  before_action :set_course

  # GET /api/v1/courses/:course_id/progress
  def index
    authorize @course, :show?
    students = enrolled_students
    render json: students.map { |s| student_progress_summary(s) }
  end

  # GET /api/v1/courses/:course_id/progress/:student_id
  def show
    authorize @course, :show?
    student = User.find(params[:student_id])
    render json: detailed_student_progress(student)
  end

  # GET /api/v1/courses/:course_id/progress/at_risk
  def at_risk
    authorize @course, :show?
    render json: AtRiskDetectionService.new(@course).at_risk_students
  end

  # GET /api/v1/courses/:course_id/progress/engagement_heatmap
  def engagement_heatmap
    authorize @course, :show?
    students = enrolled_students
    assignments = @course.assignments.order(:due_date)

    render json: {
      students: students.map { |s| { id: s.id, name: "#{s.first_name} #{s.last_name}" } },
      assignments: assignments.map { |a| { id: a.id, title: a.title, due_date: a.due_date } },
      cells: heatmap_cells(students, assignments),
    }
  end

  # GET /api/v1/courses/:course_id/progress/completion_funnel
  def completion_funnel
    authorize @course, :show?
    modules = @course.course_modules.includes(:module_items).order(:position)
    render json: modules.map { |m| module_completion(m) }
  end

  private

  def student_progress_summary(student)
    {
      id: student.id,
      name: "#{student.first_name} #{student.last_name}",
      grade_average: calculate_average(student),
      engagement: StudentEngagementService.new(@course, student).score,
      missing_count: missing_count(student),
      trend: grade_trend(student),  # "improving", "stable", "declining"
    }
  end

  def detailed_student_progress(student)
    {
      **student_progress_summary(student),
      assignment_grades: per_assignment_grades(student),
      quiz_scores: per_quiz_scores(student),
      grade_history: weekly_grade_history(student),
      module_progress: per_module_progress(student),
    }
  end
end
```

### 4. Build Student Progress Dashboard Page

Create `apps/web/src/app/teach/courses/[courseId]/progress/page.tsx`:

**Layout:**
- **Summary Cards** — Enrolled count, average engagement score, at-risk count, completion rate
- **At-Risk Alert Section** — Collapsible panel at top showing at-risk students with flags and recommended actions. Each student row has a "Send Message" quick action button.

**Engagement Heatmap:**
- Grid: rows = students, columns = assignments
- Cell colors: green (submitted on time), yellow (submitted late), red (missing), blue (in progress), gray (not yet due)
- Hover shows grade and submission date
- Click navigates to grading view for that submission

**Student Progress Table:**
- Columns: Name, Grade Average, Engagement Score (with colored dot), Missing Work, Trend (arrow icon), Last Active
- Sortable by any column
- Click student name to expand inline detail panel or navigate to student detail page
- Filter: all, at-risk only, high engagement only

**Module Completion Funnel:**
- Horizontal bar chart showing per-module completion rates
- Each module bar shows: not started | in progress | completed segments

### 5. Build Student Detail Progress Page

Create `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/page.tsx`:

**Layout:**
- Student header: name, email, enrollment date, overall grade, engagement score
- **Grade Trend Line** — SVG line chart showing weekly grade averages over the term
- **Assignment Timeline** — Vertical timeline of submissions with grades, status, and feedback given
- **Module Progress** — Visual checklist of module items (completed/in progress/not started)
- **Comparison** — "vs. Class Average" toggle that overlays class average line on the grade trend

### 6. Add Tests

**Backend:**
- `apps/core/spec/services/student_engagement_service_spec.rb`
  - Calculates weighted engagement score
  - Returns correct engagement level for score ranges
  - Handles zero assignments gracefully
  - Each component score is 0-100

- `apps/core/spec/services/at_risk_detection_service_spec.rb`
  - Identifies students with low grades
  - Identifies students with missing work
  - Identifies inactive students
  - Calculates correct risk level from flag count
  - Returns recommended actions per flag type
  - Returns empty array when no at-risk students

- `apps/core/spec/requests/api/v1/progress_controller_spec.rb`
  - Index returns progress for all enrolled students
  - Show returns detailed progress for single student
  - At-risk endpoint returns flagged students
  - Heatmap returns student x assignment grid
  - Completion funnel returns per-module data
  - Authorization: course teacher can access, unrelated teacher cannot

**Frontend:**
- `apps/web/src/app/teach/courses/[courseId]/progress/page.test.tsx`
  - Renders summary cards
  - Renders at-risk alert section
  - Heatmap renders grid with correct colors
  - Table sorts by columns
  - Filter toggles work

- `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/page.test.tsx`
  - Renders student header
  - Renders grade trend chart
  - Renders assignment timeline

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/student_engagement_service.rb` | Weighted engagement scoring |
| `apps/core/app/services/at_risk_detection_service.rb` | At-risk student identification |
| `apps/core/app/controllers/api/v1/progress_controller.rb` | Progress tracking API |
| `apps/web/src/app/teach/courses/[courseId]/progress/page.tsx` | Progress dashboard |
| `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/page.tsx` | Student detail page |
| `apps/core/spec/services/student_engagement_service_spec.rb` | Engagement tests |
| `apps/core/spec/services/at_risk_detection_service_spec.rb` | At-risk tests |
| `apps/core/spec/requests/api/v1/progress_controller_spec.rb` | API tests |
| `apps/web/src/app/teach/courses/[courseId]/progress/page.test.tsx` | Dashboard tests |
| `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/page.test.tsx` | Detail page tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add progress routes nested under courses |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx` | Add "Progress" tab to course navigation |

---

## Definition of Done

- [ ] StudentEngagementService calculates weighted scores across 5 dimensions
- [ ] AtRiskDetectionService identifies students meeting risk thresholds
- [ ] At-risk results include risk level and recommended actions
- [ ] Progress API returns per-student summaries, details, heatmap, and funnel data
- [ ] Progress dashboard renders engagement heatmap with color-coded cells
- [ ] At-risk alert section shows flagged students with action buttons
- [ ] Student detail page shows grade trend line and assignment timeline
- [ ] Module completion funnel renders per-module bars
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
