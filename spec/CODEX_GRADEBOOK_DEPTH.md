# CODEX_GRADEBOOK_DEPTH — Full Gradebook Implementation

**Priority:** P0
**Effort:** Medium (8–10 hours)
**Spec Refs:** PRD-18 (Course Delivery — grade → feedback → mastery), PRD-22 (Grading), UX-3.4 (Grading View)
**Depends on:** None

---

## Problem

The gradebook controller is 22 lines and returns a flat list of `[user_id, assignment_id, grade, status]`. PRD-18 envisions a complete course delivery workflow ending in "grade → feedback → mastery." The current implementation:

1. **No grade aggregation** — no course average, assignment averages, or student totals
2. **No weighted categories** — assignments, quizzes, discussions aren't grouped by type with weights
3. **No grade statistics** — no class mean, median, distribution
4. **No mastery tracking** — PRD-18 explicitly includes "mastery" as a workflow endpoint
5. **No CSV/bulk export** — teachers can't download grades
6. **No late/missing indicators** — no visual distinction between submitted, late, and missing work
7. **Frontend is thin** — gradebook page is 150 lines delegating to a generic ResponsiveTable

---

## Tasks

### 1. Expand Gradebook Controller

Rewrite `apps/core/app/controllers/api/v1/gradebook_controller.rb`:

```ruby
class Api::V1::GradebookController < ApplicationController
  before_action :set_course

  # GET /api/v1/courses/:course_id/gradebook
  def show
    authorize @course, :show?

    students = User.joins(:enrollments).where(enrollments: { section: @course.sections })
    assignments = @course.assignments.order(:due_date)
    submissions = Submission.where(assignment: assignments, user: students)
    quiz_attempts = QuizAttempt.where(quiz: @course.quizzes, user: students)

    render json: {
      students: students.map { |s| student_row(s, assignments, submissions, quiz_attempts) },
      assignments: assignments.map { |a| assignment_summary(a, submissions) },
      course_summary: course_summary(students, assignments, submissions, quiz_attempts),
    }
  end

  # GET /api/v1/courses/:course_id/gradebook/export
  def export
    authorize @course, :show?
    # Generate CSV with student grades
    csv_data = GradebookExportService.new(@course).call
    send_data csv_data, filename: "gradebook-#{@course.id}.csv", type: "text/csv"
  end

  private

  def student_row(student, assignments, submissions, quiz_attempts)
    student_submissions = submissions.select { |s| s.user_id == student.id }
    student_attempts = quiz_attempts.select { |a| a.user_id == student.id }
    {
      id: student.id,
      name: "#{student.first_name} #{student.last_name}",
      email: student.email,
      grades: assignments.map { |a| grade_cell(a, student_submissions) },
      quiz_grades: quiz_summary(student_attempts),
      course_average: calculate_average(student_submissions),
      missing_count: count_missing(student, assignments, student_submissions),
      late_count: count_late(student_submissions),
    }
  end

  def assignment_summary(assignment, submissions)
    assignment_subs = submissions.select { |s| s.assignment_id == assignment.id }
    graded = assignment_subs.select { |s| s.grade.present? }
    {
      id: assignment.id,
      title: assignment.title,
      due_date: assignment.due_date,
      points_possible: assignment.points_possible,
      submission_count: assignment_subs.size,
      graded_count: graded.size,
      average: graded.any? ? (graded.sum { |s| s.grade.to_f } / graded.size).round(2) : nil,
      median: graded.any? ? median(graded.map { |s| s.grade.to_f }) : nil,
    }
  end

  def course_summary(students, assignments, submissions, quiz_attempts)
    {
      student_count: students.size,
      assignment_count: assignments.size,
      overall_average: overall_average(submissions),
      grade_distribution: grade_distribution(students, assignments, submissions),
    }
  end
end
```

### 2. Create GradebookExportService

Create `apps/core/app/services/gradebook_export_service.rb`:
- Generate CSV with headers: Student Name, Email, [Assignment 1], [Assignment 2], ..., Course Average
- One row per student
- Include grade values and missing/late indicators
- Include summary row at bottom (class averages)

### 3. Rebuild Gradebook Frontend

Rewrite `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx`:

**Layout:**
- Sticky header row with assignment names (rotated 45° for space)
- Sticky first column with student names
- Scrollable grid body for grade cells
- Summary row at bottom with class averages

**Grade cells:**
- Color-coded: green (≥90%), yellow (70-89%), orange (60-69%), red (<60%), gray (missing)
- Show grade value and status icon (checkmark, late clock, missing X)
- Click to navigate to grading view for that submission

**Controls:**
- Sort by: student name, course average, specific assignment
- Filter by: grade range, missing work, late submissions
- Export CSV button
- Toggle: show/hide quiz grades

**Summary panel (collapsible):**
- Class average
- Grade distribution chart (A/B/C/D/F counts)
- Assignment completion rate
- Students with missing work count

### 4. Add Mastery Tracking

Create mastery indicators based on standards alignment:
- If assignments are aligned to standards, calculate per-student standards mastery
- Mastery = percentage of standard-aligned assignments where student scored ≥ mastery threshold (configurable, default 80%)
- Show mastery badges on student rows

### 5. Add Tests

**Backend:**
- `apps/core/spec/requests/api/v1/gradebook_controller_spec.rb` — expand to test:
  - Full gradebook response shape
  - Student row calculations (average, missing, late)
  - Assignment summary calculations (average, median)
  - Course summary (distribution)
  - Export CSV format and content
  - Authorization (teacher/admin only)
  - Tenant scoping

- `apps/core/spec/services/gradebook_export_service_spec.rb`:
  - CSV header format
  - Grade values in cells
  - Missing/late indicators
  - Summary row

**Frontend:**
- Update `apps/web/src/app/teach/courses/[courseId]/gradebook/page.test.tsx`:
  - Renders student grid
  - Sorts by column
  - Filters by grade range
  - Export button triggers download
  - Grade cells have correct colors

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/gradebook_export_service.rb` | CSV export service |
| `apps/core/spec/services/gradebook_export_service_spec.rb` | Export service tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/gradebook_controller.rb` | Full gradebook implementation |
| `apps/core/config/routes.rb` | Add gradebook/export route |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx` | Rich gradebook UI |
| `apps/core/spec/requests/api/v1/gradebook_controller_spec.rb` | Expanded tests |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.test.tsx` | Frontend tests |

---

## Definition of Done

- [ ] Gradebook endpoint returns per-student grades, averages, missing/late counts
- [ ] Assignment summary includes average, median, submission counts
- [ ] Course summary includes overall average and grade distribution
- [ ] CSV export generates downloadable file with complete grade data
- [ ] Frontend displays scrollable grid with sticky headers and color-coded cells
- [ ] Sort and filter controls functional
- [ ] Missing/late visual indicators on grade cells
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no lint errors
