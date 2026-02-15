# Codex Instructions — Teacher UX Depth

## Objective

Deepen all teacher-facing screens to match UX Spec §3.4 and PRD-17 (teacher planning workflow). The pages exist but are thin. This task adds the missing screens (Calendar, Publish Preview, Grading View) and upgrades existing ones (Module Editor, Assignment Editor, Submissions Inbox, Discussions, Course Home).

---

## What Already Exists (DO NOT recreate)

### Frontend Pages
- `src/app/dashboard/page.tsx` — teacher dashboard
- `src/app/plan/units/page.tsx` — Unit Library
- `src/app/plan/units/[id]/page.tsx` — Unit Planner
- `src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` — Lesson Editor
- `src/app/plan/templates/page.tsx` — Template Library
- `src/app/plan/standards/page.tsx` — Standards Browser
- `src/app/teach/courses/page.tsx` — Course listing
- `src/app/teach/courses/[courseId]/page.tsx` — Course Home
- `src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx` — Module view
- `src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx` — Assignment view
- `src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx` — Discussion view
- `src/app/teach/courses/[courseId]/submissions/page.tsx` — Submissions list
- `src/components/AppShell.tsx` — sidebar navigation
- `src/components/AiAssistPanel.tsx` — AI assistant (from M6)
- `src/components/GoogleDrivePicker.tsx` — Drive file picker

### Backend APIs (all exist under /api/v1/)
- Courses, Sections, Enrollments CRUD
- CourseModules CRUD + publish/archive + reorder
- Assignments CRUD + publish/close/archive + push_to_classroom
- Submissions CRUD + grade action
- Discussions CRUD + lock
- DiscussionPosts CRUD
- Rubrics CRUD with nested criteria and ratings
- UnitPlans with versioning, publish, PDF export
- LessonPlans with versioning

---

## Task 1: Calendar View

PRD-17 ends with "schedule" — teachers need to see their units and lessons on a timeline. UX §3.4 lists "Calendar" as a teacher screen.

**Create:** `apps/web/src/app/plan/calendar/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`, `useAuth`
2. Monthly calendar grid (use a simple custom grid — no external calendar library needed)
3. Fetch unit plans from `GET /api/v1/unit_plans` — use `start_date` and `end_date` fields if they exist, otherwise use `created_at`
4. Fetch assignments from `GET /api/v1/assignments` — use `due_date` field
5. Display units as colored bars spanning their date range
6. Display assignment due dates as dot indicators on their due date
7. Click on a unit navigates to `/plan/units/:id`
8. Click on an assignment navigates to the assignment page
9. Month navigation: previous/next month buttons, "Today" button
10. Filter by course dropdown
11. Add "Calendar" link under Plan section in AppShell left nav

**If `start_date`/`end_date` don't exist on unit_plans:**

**Create migration:** `apps/core/db/migrate/[timestamp]_add_dates_to_unit_plans.rb`
```ruby
class AddDatesToUnitPlans < ActiveRecord::Migration[8.0]
  def change
    add_column :unit_plans, :start_date, :date, unless column_exists?(:unit_plans, :start_date)
    add_column :unit_plans, :end_date, :date, unless column_exists?(:unit_plans, :end_date)
  end
end
```

Update the UnitPlan serializer to include `start_date` and `end_date`.

---

## Task 2: Publish Preview Screen

UX §3.4 lists "Publish Preview" as a teacher screen. Teachers should preview exactly what will be published before committing.

**Create:** `apps/web/src/app/plan/units/[id]/preview/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Fetch the unit plan with its current version: `GET /api/v1/unit_plans/:id`
3. Fetch the unit's lessons: `GET /api/v1/unit_plans/:id/lesson_plans`
4. Fetch aligned standards: displayed from the unit version data
5. Display in a read-only, print-friendly layout:
   - Unit title, description, essential questions, enduring understandings
   - Standards aligned (code + description)
   - Lessons listed in order with their titles and summaries
   - Resource links per lesson
   - Version number and current status
6. "Publish" button at the top — calls `POST /api/v1/unit_plans/:id/publish`
7. "Export PDF" button — calls `POST /api/v1/unit_plans/:id/export_pdf`
8. "Back to Editor" link
9. If unit is already published, show a "Published" badge and disable the publish button
10. Add a "Preview" button on the existing Unit Planner page that links here

---

## Task 3: Grading View

UX §3.4 lists "Grading View" as a teacher screen. This is an inline grading interface for a single submission with rubric scoring.

**Create:** `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Fetch the submission: `GET /api/v1/submissions/:submissionId`
3. Fetch the assignment: `GET /api/v1/assignments/:assignmentId`
4. Fetch the rubric if attached: `GET /api/v1/rubrics/:rubricId` with criteria and ratings
5. Left panel: student submission content (text, attached files/links)
6. Right panel: grading controls
   - If rubric exists: show each criterion with clickable rating levels. Selecting a rating sets the score for that criterion.
   - Running total score at the top
   - Overall feedback textarea
   - "Save Grade" button — calls `PATCH /api/v1/submissions/:id` with `{ grade, feedback, rubric_scores: [{criterion_id, rating_id, score}] }`
7. Navigation: "Previous Student" / "Next Student" buttons to cycle through submissions for this assignment
8. Student name and submission date displayed
9. Status badge: submitted, graded, returned

**Backend addition if rubric_scores endpoint doesn't exist:**

**Create:** `apps/core/app/controllers/api/v1/rubric_scores_controller.rb`
- `POST /api/v1/submissions/:submission_id/rubric_scores` — bulk create/update rubric scores
- Accepts `{ scores: [{ rubric_criterion_id, rubric_rating_id, score, comments }] }`
- Creates RubricScore records linked to the submission

**Add route:**
```ruby
resources :submissions, only: [] do
  resources :rubric_scores, only: [:index, :create]
end
```

---

## Task 4: Submissions Inbox Improvements

The submissions list page exists but needs filtering, sorting, and bulk actions.

**Modify:** `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx`

**Requirements:**
1. Filter bar: assignment dropdown, status filter (all, submitted, graded, returned), date range
2. Sort by: submission date, student name, grade
3. Each row shows: student name, assignment title, submitted_at, status badge, grade (if graded)
4. Click row navigates to the grading view (Task 3)
5. Bulk actions: select multiple → "Grade All" (batch navigate), "Return All" (batch update status)
6. Summary stats at top: X submitted, Y graded, Z pending
7. Empty state when no submissions

---

## Task 5: Module Editor Improvements

The module editor exists but needs richer item management.

**Modify:** `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx`

**Requirements:**
1. Module header: editable title, description, status badge (draft/published/archived)
2. Module items list with drag-and-drop reordering (use native HTML5 drag or a lightweight library)
3. "Add Item" button with type selector: Assignment, Quiz, Discussion, Resource Link, Text Header
4. Each item row shows: drag handle, type icon, title, status, actions (edit, remove)
5. Clicking an item navigates to its editor (assignment editor, quiz editor, etc.)
6. Reorder calls `PATCH /api/v1/course_modules/:id/reorder` with `{ item_ids: [ordered_ids] }`
7. "Publish Module" button — publishes the module and all draft items within it
8. "Add Existing" option — search and link an existing assignment or quiz to this module

**Backend addition if reorder endpoint doesn't exist:**

Check if `course_modules_controller.rb` has a `reorder` action. If not:
- Add `reorder` action that accepts `{ item_ids: [] }` and updates `position` on each `ModuleItem`
- Add route: `post :reorder, on: :member` inside `resources :course_modules`

---

## Task 6: Assignment Editor Improvements

**Modify:** `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx`

**Requirements:**
1. Form fields: title, description (rich text area), points_possible, due_date, available_from, available_until
2. Submission type selector: online text, file upload, Google Drive link, no submission
3. Rubric section: "Attach Rubric" button that opens a rubric picker modal
   - List existing rubrics from `GET /api/v1/rubrics`
   - Select and attach
   - Or "Create New Rubric" inline
4. Resources section: "Attach Resource" using GoogleDrivePicker component, or manual URL entry
5. Standards alignment: show aligned standards from the parent unit, allow adding more
6. Status controls: Save Draft, Publish, Close Submissions
7. If assignment is linked to a Google Classroom, show sync status and "Push to Classroom" button

---

## Task 7: Discussion Thread Improvements

**Modify:** `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx`

**Requirements:**
1. Discussion header: title, prompt/description, created_by, status (open/locked)
2. Post list: threaded view — top-level posts with indented replies
3. Each post shows: author name, role badge (teacher/student), created_at, content
4. Reply button on each post — inline reply form
5. New post form at bottom (textarea + submit)
6. Teacher actions: "Lock Discussion" / "Unlock Discussion" button (calls `POST /api/v1/discussions/:id/lock` or unlock)
7. If discussion is locked, hide reply forms and show "This discussion is locked" banner
8. Post count badge in the discussion list

---

## Task 8: Course Home Improvements

**Modify:** `apps/web/src/app/teach/courses/[courseId]/page.tsx`

**Requirements:**
1. Course header: name, section info, term, enrollment count
2. Modules section: list modules in order with progress indicators (X of Y items completed)
3. Quick actions: "Create Module", "Create Assignment", "View Gradebook"
4. Recent activity feed: latest 5 submissions, discussion posts
5. Enrolled students count with link to roster
6. Upcoming assignments (next 5 by due_date) with countdown
7. Classroom sync status if Google Classroom is linked (show last sync date, "Sync Now" button)

---

## Architecture Rules

1. All new pages use `"use client"`, `ProtectedRoute`, `AppShell`
2. All API calls use `apiFetch` from `apps/web/src/lib/api.ts`
3. Role check: these are teacher screens — guard with `requiredRoles={["admin", "curriculum_lead", "teacher"]}` if ProtectedRoute supports it, otherwise check `user?.roles` in the component
4. Follow existing error/loading state patterns (try/catch, loading boolean, error banner)
5. Any new backend endpoints MUST have Pundit authorization and be tenant-scoped
6. Any new migrations use `unless column_exists?` / `unless table_exists?` for idempotency

---

## Testing

```bash
cd apps/core && bundle exec rspec
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] Calendar page at `/plan/calendar` with monthly grid
- [ ] Publish Preview page at `/plan/units/:id/preview`
- [ ] Grading View page with rubric scoring interface
- [ ] Submissions Inbox has filtering, sorting, bulk actions
- [ ] Module Editor has drag-drop reordering and item type management
- [ ] Assignment Editor has rubric attachment and Drive resources
- [ ] Discussion page has threading and lock/unlock
- [ ] Course Home shows module progress, upcoming assignments, recent activity
- [ ] AppShell updated with Calendar link
- [ ] All lint and build checks pass
- [ ] No new Rubocop violations
