# CODEX_STUDENT_PROGRESS_REPORTS — Dedicated Student Progress and Mastery API

**Priority:** P1
**Effort:** Medium (5–6 hours)
**Spec Refs:** PRD-18 (Course Delivery — mastery), PRD-22 (Grading), UX-3.5 (Student Screens)
**Depends on:** None

---

## Problem

The gradebook provides teacher-facing grade data, and module_item_completions tracks item-level progress, but there is no student-facing progress report that:

1. **Aggregates across courses** — students can't see overall academic standing
2. **Shows standards mastery** — no view of which standards a student has mastered vs. gaps
3. **Tracks progress over time** — no time-series data for grades or mastery
4. **Reports for guardians** — guardian portal needs a progress summary to display

---

## Tasks

### 1. Create Student Progress Controller

Create `apps/core/app/controllers/api/v1/student_progress_controller.rb`:

```ruby
class Api::V1::StudentProgressController < ApplicationController
  # GET /api/v1/students/:student_id/progress
  def show
    authorize :student_progress
    student = User.find(params[:student_id])

    render json: {
      student: { id: student.id, name: student.full_name },
      courses: course_progress(student),
      standards_mastery: standards_mastery(student),
      overall: overall_summary(student),
    }
  end

  # GET /api/v1/students/:student_id/progress/course/:course_id
  def course_detail
    authorize :student_progress
    student = User.find(params[:student_id])
    course = Course.find(params[:course_id])

    render json: {
      course: { id: course.id, name: course.name },
      assignments: assignment_progress(student, course),
      quizzes: quiz_progress(student, course),
      module_completion: module_progress(student, course),
      standards: course_standards_mastery(student, course),
      grade_trend: grade_trend(student, course),
    }
  end

  private

  def course_progress(student)
    courses = Course.joins(sections: :enrollments).where(enrollments: { user: student })
    courses.map do |course|
      subs = Submission.where(user: student, assignment: course.assignments)
      {
        id: course.id, name: course.name,
        average: calculate_average(subs),
        completed_assignments: subs.where.not(grade: nil).count,
        total_assignments: course.assignments.count,
        completion_rate: completion_rate(subs, course),
      }
    end
  end

  def standards_mastery(student)
    # Aggregate standards mastery across all enrolled courses
    standards_data = {}
    enrolled_courses(student).each do |course|
      course.assignments.includes(:standards).each do |assignment|
        sub = Submission.find_by(user: student, assignment: assignment)
        next unless sub&.grade

        assignment.standards.each do |standard|
          standards_data[standard.id] ||= { standard: standard, scores: [] }
          standards_data[standard.id][:scores] << (sub.grade.to_f / assignment.points_possible * 100)
        end
      end
    end

    standards_data.values.map do |data|
      avg = data[:scores].sum / data[:scores].size
      {
        id: data[:standard].id,
        code: data[:standard].code,
        description: data[:standard].description,
        framework: data[:standard].standard_framework&.name,
        average_score: avg.round(1),
        mastered: avg >= mastery_threshold,
        attempt_count: data[:scores].size,
      }
    end
  end

  def grade_trend(student, course)
    Submission.where(user: student, assignment: course.assignments)
              .where.not(graded_at: nil)
              .order(:graded_at)
              .pluck(:graded_at, :grade, :assignment_id)
              .map { |date, grade, aid| { date: date, grade: grade, assignment_id: aid } }
  end
end
```

### 2. Create Student Progress Policy

- Students can view their own progress
- Teachers can view progress for students in their courses
- Admins can view any student
- Guardians can view linked students' progress

### 3. Create Student Progress Frontend Page

Create `apps/web/src/app/learn/progress/page.tsx`:
- Cross-course summary cards (average, completion rate per course)
- Standards mastery overview (mastered vs. not mastered)
- Course drill-down with assignment history and grade trend chart

### 4. Create Guardian Progress View

Create `apps/web/src/app/guardian/progress/[studentId]/page.tsx`:
- Read-only view of student progress (reuse StudentProgress component)
- Accessible to users with guardian_links to the student

### 5. Add Tests

- `apps/core/spec/requests/api/v1/student_progress_controller_spec.rb`
- `apps/core/spec/policies/student_progress_policy_spec.rb`
- `apps/web/src/app/learn/progress/page.test.tsx`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/student_progress_controller.rb` | Progress API |
| `apps/core/app/policies/student_progress_policy.rb` | Authorization |
| `apps/core/spec/requests/api/v1/student_progress_controller_spec.rb` | Request spec |
| `apps/core/spec/policies/student_progress_policy_spec.rb` | Policy spec |
| `apps/web/src/app/learn/progress/page.tsx` | Student progress page |
| `apps/web/src/app/guardian/progress/[studentId]/page.tsx` | Guardian progress view |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add student progress routes |
| `apps/web/src/components/AppShell.tsx` | Add Progress link under Learn nav |

---

## Definition of Done

- [ ] `GET /api/v1/students/:id/progress` returns cross-course summary + standards mastery
- [ ] `GET /api/v1/students/:id/progress/course/:course_id` returns detailed course progress with grade trend
- [ ] Students can view own progress only
- [ ] Teachers can view students in their courses
- [ ] Guardians can view linked students
- [ ] Student progress page displays course summaries and mastery overview
- [ ] Guardian progress view works for linked students
- [ ] All specs pass
