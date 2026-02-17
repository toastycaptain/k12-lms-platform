# CODEX_GUARDIAN_PORTAL — Parent/Guardian Read-Only Views

**Priority:** P2
**Effort:** Large (12–16 hours)
**Spec Refs:** PRD-4 (Secondary Users — Parent/Guardian, optional in MVP), PRD-3 (Primary Users)
**Depends on:** None

---

## Problem

PRD-4 identifies Parent/Guardian as a secondary user persona, optional in MVP. The data model includes `guardian_links` in the TECH_SPEC §2.4 but no implementation exists. As the platform moves toward production use, schools will need parent visibility into:

1. Student grades and progress
2. Assignment completion status
3. Upcoming due dates
4. Teacher announcements

This is a read-only portal — guardians cannot modify data, submit work, or interact with course content.

---

## Tasks

### 1. Create Guardian Data Model

Create migration for `guardian_links` table (referenced in TECH_SPEC but not yet created):

```ruby
class CreateGuardianLinks < ActiveRecord::Migration[8.0]
  def change
    create_table :guardian_links do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :guardian, null: false, foreign_key: { to_table: :users }
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :relationship, null: false, default: "parent"  # parent, guardian, other
      t.string :status, null: false, default: "active"        # active, inactive
      t.timestamps
    end

    add_index :guardian_links, [:tenant_id, :guardian_id, :student_id], unique: true
  end
end
```

Create model `apps/core/app/models/guardian_link.rb`:
```ruby
class GuardianLink < ApplicationRecord
  include TenantScoped

  belongs_to :guardian, class_name: "User"
  belongs_to :student, class_name: "User"

  validates :relationship, inclusion: { in: %w[parent guardian other] }
  validates :status, inclusion: { in: %w[active inactive] }
  validates :student_id, uniqueness: { scope: [:tenant_id, :guardian_id] }
end
```

### 2. Create Guardian API Endpoints

Create `apps/core/app/controllers/api/v1/guardian_controller.rb`:

```ruby
class Api::V1::GuardianController < ApplicationController
  # GET /api/v1/guardian/students — list linked students
  def students
    authorize :guardian, :index?
    links = GuardianLink.where(guardian: Current.user, status: "active")
    students = User.where(id: links.pluck(:student_id))
    render json: students, each_serializer: StudentSummarySerializer
  end

  # GET /api/v1/guardian/students/:id/grades — student's grades
  def grades
    authorize :guardian, :show?
    student = linked_student(params[:id])
    enrollments = Enrollment.where(user: student)
    submissions = Submission.where(user: student, assignment: Assignment.where(course: enrollments.map(&:course)))
    render json: submissions, each_serializer: GuardianGradeSerializer
  end

  # GET /api/v1/guardian/students/:id/assignments — student's assignments
  def assignments
    authorize :guardian, :show?
    student = linked_student(params[:id])
    courses = student.enrollments.map(&:course)
    assignments = Assignment.where(course: courses).where("due_date >= ?", 30.days.ago)
    render json: assignments, each_serializer: GuardianAssignmentSerializer
  end

  # GET /api/v1/guardian/students/:id/announcements — course announcements
  def announcements
    authorize :guardian, :show?
    student = linked_student(params[:id])
    courses = student.enrollments.map(&:course)
    announcements = Announcement.where(course: courses).order(created_at: :desc).limit(20)
    render json: announcements
  end

  private

  def linked_student(student_id)
    link = GuardianLink.find_by!(guardian: Current.user, student_id: student_id, status: "active")
    link.student
  end
end
```

### 3. Create Guardian Policy

Create `apps/core/app/policies/guardian_policy.rb`:

```ruby
class GuardianPolicy < ApplicationPolicy
  def index?
    user.has_role?(:guardian)
  end

  def show?
    user.has_role?(:guardian) &&
      GuardianLink.exists?(guardian: user, student_id: record, status: "active")
  end
end
```

### 4. Add Routes

Update `apps/core/config/routes.rb`:

```ruby
namespace :guardian do
  get :students
  get "students/:id/grades", to: "guardian#grades"
  get "students/:id/assignments", to: "guardian#assignments"
  get "students/:id/announcements", to: "guardian#announcements"
end
```

### 5. Create Guardian Serializers

Create serializers that expose only safe, read-only data:
- `GuardianGradeSerializer` — score, assignment title, course name, graded_at
- `GuardianAssignmentSerializer` — title, due_date, course name, status (submitted/missing/graded)
- `StudentSummarySerializer` — first_name, last_name, enrolled courses

### 6. Build Guardian Frontend Pages

Create pages under `apps/web/src/app/guardian/`:

```
guardian/
  layout.tsx          — ProtectedRoute(roles: ["guardian"])
  dashboard/
    page.tsx          — List linked students with course summary
  students/
    [studentId]/
      page.tsx        — Student overview (grades summary, upcoming assignments)
      grades/
        page.tsx      — Full grade breakdown by course
      assignments/
        page.tsx      — Upcoming and past assignments with status
```

**Dashboard page features:**
- List of linked students with photo/avatar
- Per-student summary: courses enrolled, overall grade average, overdue assignments count
- Quick links to student detail pages

**Student detail page features:**
- Grades by course (table with course name, current grade, trend)
- Upcoming assignments (next 7 days)
- Recent announcements

### 7. Add Guardian to Admin User Management

Update `apps/web/src/app/admin/users/page.tsx`:
- Add "Guardian" to role filter options
- Show guardian links in user detail view
- Add "Link Guardian" action to student user records

### 8. Update AppShell for Guardian Role

Update `apps/web/src/components/AppShell.tsx`:
- Add guardian-specific nav items (only "My Students" link)
- Hide Plan, Teach, Assess, Admin nav items for guardian role
- Show simplified top bar (no search, school selector only)

### 9. Add Tests

**Backend:**
- `apps/core/spec/models/guardian_link_spec.rb` — model validations, associations, scoping
- `apps/core/spec/policies/guardian_policy_spec.rb` — role-based access
- `apps/core/spec/requests/api/v1/guardian_controller_spec.rb` — all endpoints

**Frontend:**
- `apps/web/src/app/guardian/dashboard/page.test.tsx` — renders student list
- `apps/web/src/app/guardian/students/[studentId]/page.test.tsx` — renders student detail

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_guardian_links.rb` | Guardian links table |
| `apps/core/app/models/guardian_link.rb` | Guardian-student relationship model |
| `apps/core/app/controllers/api/v1/guardian_controller.rb` | Guardian API endpoints |
| `apps/core/app/policies/guardian_policy.rb` | Guardian authorization |
| `apps/core/app/serializers/guardian_grade_serializer.rb` | Grade serializer |
| `apps/core/app/serializers/guardian_assignment_serializer.rb` | Assignment serializer |
| `apps/core/app/serializers/student_summary_serializer.rb` | Student summary serializer |
| `apps/core/spec/models/guardian_link_spec.rb` | Model specs |
| `apps/core/spec/policies/guardian_policy_spec.rb` | Policy specs |
| `apps/core/spec/requests/api/v1/guardian_controller_spec.rb` | Request specs |
| `apps/web/src/app/guardian/layout.tsx` | Guardian layout with role guard |
| `apps/web/src/app/guardian/dashboard/page.tsx` | Guardian dashboard |
| `apps/web/src/app/guardian/students/[studentId]/page.tsx` | Student overview |
| `apps/web/src/app/guardian/students/[studentId]/grades/page.tsx` | Grade detail |
| `apps/web/src/app/guardian/students/[studentId]/assignments/page.tsx` | Assignment detail |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add guardian routes |
| `apps/core/app/models/user.rb` | Add `has_many :guardian_links` association |
| `apps/web/src/components/AppShell.tsx` | Guardian-specific navigation |
| `apps/web/src/app/admin/users/page.tsx` | Guardian role in admin UI |

---

## Definition of Done

- [ ] `guardian_links` table created with tenant scoping
- [ ] GuardianLink model with validations and associations
- [ ] 4 Guardian API endpoints functional and tenant-scoped
- [ ] GuardianPolicy restricts access to guardian role with active links only
- [ ] 3 guardian serializers exposing read-only data
- [ ] 4 guardian frontend pages rendering student data
- [ ] AppShell shows guardian-specific navigation
- [ ] Admin users page supports guardian role management
- [ ] All model, policy, and request specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no lint errors, build succeeds
