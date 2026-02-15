# Codex Instructions — Student Experience

## Objective

Build dedicated student-facing screens per UX Spec §3.5 and PRD-18 (course delivery workflow: view modules → submit → grade → feedback → mastery). Students are a primary user (PRD-3) but currently share the same generic views as teachers. This task creates student-specific pages with appropriate data scoping and UX.

---

## What Already Exists (DO NOT recreate)

### Backend (all APIs exist)
- Courses, Sections, Enrollments — students are enrolled via enrollment records
- CourseModules, ModuleItems — module structure with ordering
- Assignments — with due dates, points, submission types
- Submissions — CRUD + grade action, status tracking
- Quizzes, QuizAttempts, AttemptAnswers — full assessment flow
- QuizAccommodations — extra time, extended attempts per student
- Rubrics, RubricCriteria, RubricRatings, RubricScores — grading data
- Discussions, DiscussionPosts — threaded discussions

### Frontend
- `src/app/dashboard/page.tsx` — generic dashboard (needs student-specific variant)
- `src/app/teach/courses/[courseId]/page.tsx` — course home (teacher-oriented)
- `src/components/ProtectedRoute.tsx` — auth check
- `src/components/AppShell.tsx` — sidebar with Learn section (or needs one)
- `src/lib/api.ts` — apiFetch helper

### Backend Policies
- All policies have student-scoped logic (students see only their own submissions, enrolled courses, etc.)

---

## Task 1: Student Dashboard

Students need a dashboard focused on upcoming work, recent grades, and course navigation.

**Create:** `apps/web/src/app/learn/dashboard/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`, `useAuth`
2. **Upcoming Assignments** section: fetch `GET /api/v1/assignments` (scoped by policy to enrolled courses), filter to those with `due_date` in the future, sort by soonest first, show top 5
   - Each card: assignment title, course name, due date with countdown ("Due in 2 days"), points possible
   - Click navigates to assignment submission page
3. **Recent Grades** section: fetch `GET /api/v1/submissions?status=graded` (student's own), show latest 5
   - Each card: assignment title, grade/points, feedback preview, date graded
   - Click navigates to submission detail
4. **My Courses** section: fetch `GET /api/v1/courses` (scoped to enrolled), show as cards
   - Each card: course name, teacher name, section, module progress (X of Y complete)
   - Click navigates to student course view
5. Greeting: "Welcome back, {first_name}" with current date
6. Empty states for each section when no data

---

## Task 2: Student Course View with Module Progression

Students need to see their course modules in a sequential, progress-tracked layout.

**Create:** `apps/web/src/app/learn/courses/[courseId]/page.tsx`

**Requirements:**
1. Course header: course name, teacher name, section, term
2. Module list: fetch `GET /api/v1/courses/:courseId/course_modules` — show published modules only
3. Each module card shows:
   - Module title and description
   - Progress bar: items completed / total items
   - Status indicator: not started, in progress, completed
   - Expand to show module items
4. Module items within each module:
   - Type icon (assignment, quiz, discussion, resource)
   - Title
   - Status: not started, in progress, submitted, graded
   - Due date if applicable
   - Click navigates to the appropriate page (assignment submission, quiz attempt, discussion)
5. Overall course progress bar at the top
6. If modules are gated (sequential unlock), gray out locked modules with "Complete previous module to unlock" message

**Backend addition if completion tracking doesn't exist:**

Check if a `module_item_completions` table or tracking mechanism exists. If not:

**Create:** `apps/core/db/migrate/[timestamp]_create_module_item_completions.rb`
```ruby
class CreateModuleItemCompletions < ActiveRecord::Migration[8.0]
  def change
    create_table :module_item_completions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :module_item, null: false, foreign_key: true
      t.datetime :completed_at, null: false
      t.timestamps
    end
    add_index :module_item_completions, [:user_id, :module_item_id], unique: true
  end
end
```

**Create:** `apps/core/app/models/module_item_completion.rb`
```ruby
class ModuleItemCompletion < ApplicationRecord
  include TenantScoped
  belongs_to :user
  belongs_to :module_item
  validates :module_item_id, uniqueness: { scope: :user_id }
end
```

**Create:** `apps/core/app/controllers/api/v1/module_item_completions_controller.rb`
- `POST /api/v1/module_items/:module_item_id/complete` — marks item as completed
- `DELETE /api/v1/module_items/:module_item_id/complete` — unmarks
- `GET /api/v1/course_modules/:id/progress` — returns completion counts per user

Add routes, policy (students can complete items in their enrolled courses), factory, and spec.

---

## Task 3: Assignment Submission Page

Students need a rich submission page that shows the assignment details, allows submission, and displays feedback after grading.

**Create:** `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx`

**Requirements:**
1. Assignment header: title, description, points possible, due date
2. Status banner:
   - "Not submitted" with due date countdown
   - "Submitted on [date]" with "Resubmit" option if allowed
   - "Graded: X/Y points" with feedback section
   - "Past due" warning if past due and not submitted
3. Submission form (shown when not yet graded):
   - Text entry area for online text submissions
   - File upload button for file submissions (Active Storage)
   - Google Drive picker for Drive link submissions
   - "Submit Assignment" button — calls `POST /api/v1/assignments/:id/submissions`
4. After grading, display:
   - Grade with points (e.g., "85/100")
   - Teacher feedback text
   - Rubric breakdown if rubric was used: each criterion with the selected rating and score
   - "Resubmit" button if resubmission is allowed
5. Attached resources section: show any resource links attached to this assignment
6. Standards aligned: show which standards this assignment assesses

---

## Task 4: Quiz Attempt Page

Students need a quiz-taking interface with timer, question navigation, and accommodation support.

**Create:** `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx`

**Requirements:**
1. Pre-attempt screen (before starting):
   - Quiz title, description, points possible, time limit, number of questions, attempts allowed
   - "Start Quiz" button — calls `POST /api/v1/quizzes/:id/quiz_attempts` to create attempt
   - If student has used all attempts, show "No attempts remaining"
   - If accommodations exist (extra time, extended attempts), show adjusted values
2. During attempt:
   - Question display: one question at a time or all at once (based on quiz setting if available, default to all)
   - Question types: multiple choice (radio buttons), multiple answer (checkboxes), true/false, short answer (text input), essay (textarea)
   - Answer saving: auto-save answers on change — call `PATCH /api/v1/quiz_attempts/:id/attempt_answers/:id` or batch save
   - Timer: if time limit exists, show countdown timer in a fixed position. When time expires, auto-submit.
   - Question navigation: sidebar or top bar showing question numbers with answered/unanswered indicators
   - "Submit Quiz" button with confirmation dialog: "Are you sure? You have X unanswered questions."
   - Submit calls `POST /api/v1/quiz_attempts/:id/submit`
3. After submission:
   - Show score if quiz allows immediate results
   - If not, show "Your quiz has been submitted. Results will be available when released by your teacher."

---

## Task 5: Quiz Results Page

After a quiz is graded or auto-scored, students can review their results.

**Create:** `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx`

**Requirements:**
1. Score summary: "You scored X out of Y points (Z%)"
2. Per-question review (if teacher allows review):
   - Question text
   - Student's answer (highlighted)
   - Correct answer (highlighted green if different from student's)
   - Points earned / points possible per question
   - For auto-graded: show correct/incorrect icon
   - For manually graded: show teacher feedback if any
3. If review is not allowed, show only the total score
4. "Return to Course" button
5. "Retake Quiz" button if attempts remain

---

## Task 6: Student Grade Summary

Students need to see their grades across all courses.

**Create:** `apps/web/src/app/learn/grades/page.tsx`

**Requirements:**
1. Per-course grade summary: course name, current average (calculated from graded submissions), letter grade equivalent
2. Expand course to see individual assignments:
   - Assignment title, points earned / points possible, status, due date
   - Click navigates to submission detail
3. Visual grade distribution: simple bar showing grade breakdown (optional but nice)
4. Filter by course, term
5. Add "Grades" link under Learn section in AppShell

---

## Task 7: Update AppShell for Student Navigation

**Modify:** `apps/web/src/components/AppShell.tsx`

**Requirements:**
1. Add a "Learn" section to the sidebar (if not already present) with:
   - Dashboard → `/learn/dashboard`
   - My Courses → `/learn/courses` (create a simple list page)
   - Grades → `/learn/grades`
2. The Learn section should appear for users with the `student` role
3. The Plan and Teach sections should NOT appear for student-only users
4. Admin section should NOT appear for student-only users
5. If user has multiple roles (e.g., teacher + admin), show all applicable sections

**Create:** `apps/web/src/app/learn/courses/page.tsx` — simple enrolled courses list
1. Fetch `GET /api/v1/courses` (policy scopes to enrolled)
2. Card grid: course name, teacher, section, term
3. Click navigates to `/learn/courses/:id`

---

## Architecture Rules

1. All student pages live under `/learn/` route prefix to separate from teacher (`/teach/`, `/plan/`) and admin (`/admin/`) routes
2. All API calls go through existing endpoints — the backend policies already scope data for students (enrolled courses only, own submissions only, etc.)
3. Student pages use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
4. No new backend controllers unless explicitly noted (e.g., module_item_completions) — reuse existing APIs
5. Any new models MUST include `TenantScoped`
6. Any new migrations use `unless table_exists?` / `unless column_exists?` for idempotency

---

## Testing

```bash
cd apps/core && bundle exec rspec
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] Student Dashboard at `/learn/dashboard` with upcoming, grades, courses
- [ ] Student Course View at `/learn/courses/:id` with module progression
- [ ] Module item completion tracking (model, controller, API)
- [ ] Assignment Submission page with submission form and feedback display
- [ ] Quiz Attempt page with timer, question types, auto-save, submit
- [ ] Quiz Results page with per-question review
- [ ] Grade Summary page at `/learn/grades`
- [ ] AppShell has Learn section for students with role-based visibility
- [ ] All lint and build checks pass
- [ ] No new Rubocop violations
