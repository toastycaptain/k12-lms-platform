# Codex Instructions — Assessment Analytics

## Objective

Build teacher-facing assessment analytics per PRD-19 (assessment workflow ends with "analyze") and PRD-8 (success metrics). Teachers need to understand quiz performance at the class and question level. Currently the quizzes controller has a `results` action that returns raw attempt data, and the `/report` page shows only high-level summary cards. This task adds item analysis, score distributions, and a dedicated analytics dashboard.

---

## What Already Exists (DO NOT recreate)

### Backend
- `Quiz` model with `quiz_attempts`, `quiz_items`, `questions` associations
- `QuizAttempt` model with `score`, `percentage`, `time_spent_seconds`, `status`, `attempt_answers`
- `AttemptAnswer` model with `is_correct`, `points_awarded`, `question_id`, `answer` (jsonb)
- `Question` model with `prompt`, `question_type`, `points`, `choices` (jsonb), `correct_answer` (jsonb)
- `QuizzesController#results` — returns quiz with all attempts (id, user_id, attempt_number, score, percentage, status)
- `QuizAttemptsController` — index, create, show, submit, grade_all
- Routes: `resources :quizzes` with nested `quiz_items`, `attempts`, `accommodations`

### Frontend
- `apps/web/src/app/report/page.tsx` — high-level summary dashboard (4 cards + recent submissions table)
- Teacher quiz management pages exist under `/teach/courses/[courseId]/`
- Student quiz attempt and results pages exist under `/learn/`

---

## Task 1: Quiz Analytics Endpoint

**Create:** `apps/core/app/controllers/api/v1/quiz_analytics_controller.rb`

```ruby
class Api::V1::QuizAnalyticsController < ApplicationController
  def show
    quiz = policy_scope(Quiz).find(params[:quiz_id])
    authorize quiz, :results?

    attempts = quiz.quiz_attempts.where(status: "graded").includes(:attempt_answers)
    questions = quiz.questions.includes(:quiz_items)

    analytics = {
      quiz_id: quiz.id,
      quiz_title: quiz.title,
      total_attempts: attempts.count,
      unique_students: attempts.distinct.count(:user_id),
      score_stats: score_statistics(attempts),
      score_distribution: score_distribution(attempts),
      time_stats: time_statistics(attempts),
      item_analysis: item_analysis(attempts, questions, quiz)
    }

    render json: analytics
  end

  private

  def score_statistics(attempts)
    scores = attempts.pluck(:percentage).compact
    return { mean: 0, median: 0, min: 0, max: 0, std_dev: 0 } if scores.empty?

    sorted = scores.sort
    n = sorted.length
    mean = sorted.sum / n.to_f
    median = n.odd? ? sorted[n / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
    variance = sorted.sum { |s| (s - mean)**2 } / n.to_f

    { mean: mean.round(1), median: median.round(1), min: sorted.first, max: sorted.last, std_dev: Math.sqrt(variance).round(1) }
  end

  def score_distribution(attempts)
    percentages = attempts.pluck(:percentage).compact
    buckets = { "0-59" => 0, "60-69" => 0, "70-79" => 0, "80-89" => 0, "90-100" => 0 }
    percentages.each do |p|
      case p
      when 0...60 then buckets["0-59"] += 1
      when 60...70 then buckets["60-69"] += 1
      when 70...80 then buckets["70-79"] += 1
      when 80...90 then buckets["80-89"] += 1
      else buckets["90-100"] += 1
      end
    end
    buckets
  end

  def time_statistics(attempts)
    times = attempts.pluck(:time_spent_seconds).compact
    return { mean: 0, min: 0, max: 0 } if times.empty?
    { mean: (times.sum / times.length.to_f).round, min: times.min, max: times.max }
  end

  def item_analysis(attempts, questions, quiz)
    questions.map do |question|
      quiz_item = quiz.quiz_items.find_by(question_id: question.id)
      answers = AttemptAnswer.where(quiz_attempt: attempts, question_id: question.id)
      total = answers.count
      correct = answers.where(is_correct: true).count

      {
        question_id: question.id,
        prompt: question.prompt.truncate(120),
        question_type: question.question_type,
        points: quiz_item&.points || question.points,
        total_responses: total,
        correct_count: correct,
        difficulty: total > 0 ? (correct.to_f / total).round(3) : nil,
        avg_points: total > 0 ? (answers.sum(:points_awarded).to_f / total).round(2) : nil,
        choice_distribution: choice_distribution(question, answers)
      }
    end
  end

  def choice_distribution(question, answers)
    return nil unless %w[multiple_choice true_false multiple_answer].include?(question.question_type)

    dist = Hash.new(0)
    answers.pluck(:answer).each do |ans|
      selected = ans.is_a?(Array) ? ans : [ans]
      selected.each { |s| dist[s.to_s] += 1 }
    end
    dist
  end
end
```

**Add route** inside the `resources :quizzes` block:
```ruby
resources :quizzes, only: [] do
  get :analytics, to: "quiz_analytics#show", on: :member
end
```

**Create:** `apps/core/app/policies/quiz_analytics_policy.rb` — defer to QuizPolicy (teachers and admins who can see quiz results can see analytics).

---

## Task 2: Class Performance Endpoint

Teachers need per-student performance across all quizzes in a course.

**Add action to** `apps/core/app/controllers/api/v1/quiz_analytics_controller.rb`:

```ruby
def course_summary
  course = policy_scope(Course).find(params[:course_id])
  authorize course, :show?

  quizzes = course.quizzes.where(status: %w[published closed])
  attempts = QuizAttempt.where(quiz: quizzes, status: "graded")

  student_ids = attempts.distinct.pluck(:user_id)
  students = User.where(id: student_ids)

  student_summaries = students.map do |student|
    student_attempts = attempts.where(user_id: student.id)
    scores = student_attempts.pluck(:percentage).compact
    {
      user_id: student.id,
      name: "#{student.first_name} #{student.last_name}",
      quizzes_taken: student_attempts.select(:quiz_id).distinct.count,
      average_score: scores.any? ? (scores.sum / scores.length.to_f).round(1) : nil,
      highest_score: scores.max,
      lowest_score: scores.min
    }
  end

  render json: {
    course_id: course.id,
    total_quizzes: quizzes.count,
    total_graded_attempts: attempts.count,
    class_average: attempts.average(:percentage)&.round(1),
    students: student_summaries.sort_by { |s| -(s[:average_score] || 0) }
  }
end
```

**Add route:**
```ruby
resources :courses, only: [] do
  get "quiz_performance", to: "quiz_analytics#course_summary", on: :member
end
```

---

## Task 3: Quiz Analytics Dashboard Page

**Create:** `apps/web/src/app/teach/courses/[courseId]/quizzes/[quizId]/analytics/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`, `useAuth`
2. Fetch analytics from `GET /api/v1/quizzes/:quizId/analytics`
3. **Score Summary Cards**: mean, median, min, max, std dev, total attempts, unique students
4. **Score Distribution Chart**: horizontal bar chart showing student counts per bucket (0-59, 60-69, 70-79, 80-89, 90-100) with color coding (red/orange/yellow/green/blue)
5. **Time Statistics**: average, min, max time spent (formatted as minutes:seconds)
6. **Item Analysis Table**: one row per question showing:
   - Question number and prompt preview
   - Question type badge
   - Difficulty index (% correct) with color indicator (green > 0.7, yellow 0.4-0.7, red < 0.4)
   - Total responses and correct count
   - Average points awarded
   - For multiple choice: expandable row showing choice distribution as mini horizontal bars
7. Click on a question row expands to show full prompt text and choice distribution
8. "Back to Quiz" link
9. Empty state when no graded attempts exist

---

## Task 4: Course Performance Dashboard

**Create:** `apps/web/src/app/teach/courses/[courseId]/quiz-performance/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Fetch from `GET /api/v1/courses/:courseId/quiz_performance`
3. **Class Summary Cards**: total quizzes, total graded attempts, class average percentage
4. **Student Performance Table**: sortable by name, average score, quizzes taken
   - Each row: student name, quizzes taken, average score with color, highest/lowest scores
   - Click student row to expand showing per-quiz scores
5. **Quiz Comparison**: list of all quizzes with their class average, helping identify hard/easy quizzes
6. Link from Course Home (Task 8 of CODEX_TEACHER_UX_DEPTH added quick actions — add "Quiz Analytics" alongside "View Gradebook")
7. Add "Quiz Performance" link on individual quiz pages

---

## Task 5: Enhance Report Page

**Modify:** `apps/web/src/app/report/page.tsx`

**Requirements:**
1. Keep existing summary cards (Total Courses, Students, Assignments, Quizzes)
2. Add **Assessment Overview** section below the cards:
   - Average quiz score across all courses (fetch from each course's quiz_performance)
   - Number of quizzes with class average below 60% (flagged for review)
   - Most recent 5 completed quizzes with their class average
3. Add **Submissions Overview** section:
   - Submissions by status: counts for submitted, graded, returned (show as simple stat row)
   - Overdue submissions count (submitted after due_date)
4. Keep the recent submissions table
5. Each quiz in the assessment section links to its analytics page

---

## Task 6: Specs and Factories

**Create:**
- `apps/core/spec/requests/api/v1/quiz_analytics_spec.rb`
  - Test `GET /api/v1/quizzes/:id/analytics` — returns score stats, distribution, item analysis
  - Test with no graded attempts returns zeros/empty
  - Test non-participant teacher gets 403
  - Test item analysis includes correct difficulty calculations
- `apps/core/spec/requests/api/v1/quiz_analytics_course_summary_spec.rb`
  - Test `GET /api/v1/courses/:id/quiz_performance` — returns student summaries
  - Test per-student average calculations
  - Test course with no quizzes returns empty

No new factories needed — use existing `quiz`, `quiz_attempt`, `attempt_answer`, `question` factories.

---

## Architecture Rules

1. Analytics endpoints are read-only — no mutations
2. All calculations happen server-side for consistency
3. Use Pundit — teachers can only see analytics for quizzes/courses they teach, admins can see all
4. Analytics are computed on-demand (no caching for now — school-sized data sets are small enough)
5. Frontend charts use simple CSS/HTML bars — no charting library needed
6. Item analysis difficulty index: ratio of correct answers to total (0.0 = impossible, 1.0 = trivial)

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/quiz_analytics*
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] Quiz analytics endpoint with score stats, distribution, time stats, item analysis
- [ ] Course quiz performance endpoint with per-student summaries
- [ ] Quiz analytics dashboard page with distribution chart and item analysis table
- [ ] Course performance dashboard with student table
- [ ] Report page enhanced with assessment and submissions overview
- [ ] Request specs for both endpoints
- [ ] All lint and build checks pass
