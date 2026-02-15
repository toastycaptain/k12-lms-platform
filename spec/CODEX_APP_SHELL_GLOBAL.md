# Codex Instructions — App Shell & Global UX Infrastructure

## Objective

Build the global UX infrastructure specified in UX Spec §3.2 (App Shell) and §3.3 (Auth & Onboarding) that every user touches. The app shell sidebar exists but the top bar is incomplete — it's missing school selection, global search, and notifications. There's no onboarding flow and no client-side role guards.

---

## What Already Exists (DO NOT recreate)

### Frontend
- `src/components/AppShell.tsx` — left sidebar nav with Plan, Teach, Assess, Report, Communicate, Admin sections
- `src/components/ProtectedRoute.tsx` — checks authentication only (no role check)
- `src/lib/auth-context.tsx` — provides user object with roles
- `src/lib/api.ts` — apiFetch helper

### Backend
- Tenants, Schools models — tenant has_many schools
- Users model — has roles via user_roles join table
- All controllers enforce tenant scoping via Current.tenant

---

## Task 1: Global Search

UX §3.2 specifies a search bar in the top bar. Teachers need to find units, lessons, standards, courses, and assignments quickly.

**Create:** `apps/core/app/controllers/api/v1/search_controller.rb`

```ruby
class Api::V1::SearchController < ApplicationController
  def index
    query = params[:q].to_s.strip
    return render json: { results: [] } if query.length < 2

    results = []

    # Search units
    units = policy_scope(UnitPlan).where("title ILIKE ?", "%#{query}%").limit(5)
    results += units.map { |u| { type: "unit_plan", id: u.id, title: u.title, url: "/plan/units/#{u.id}" } }

    # Search lessons
    lessons = policy_scope(LessonPlan).where("title ILIKE ?", "%#{query}%").limit(5)
    results += lessons.map { |l| { type: "lesson_plan", id: l.id, title: l.title, url: "/plan/units/#{l.unit_plan_id}/lessons/#{l.id}" } }

    # Search courses
    courses = policy_scope(Course).where("name ILIKE ?", "%#{query}%").limit(5)
    results += courses.map { |c| { type: "course", id: c.id, title: c.name, url: "/teach/courses/#{c.id}" } }

    # Search standards
    standards = policy_scope(Standard).where("code ILIKE :q OR description ILIKE :q", q: "%#{query}%").limit(5)
    results += standards.map { |s| { type: "standard", id: s.id, title: "#{s.code}: #{s.description.truncate(60)}", url: "/plan/standards" } }

    # Search assignments
    assignments = policy_scope(Assignment).where("title ILIKE ?", "%#{query}%").limit(5)
    results += assignments.map { |a| { type: "assignment", id: a.id, title: a.title, url: "/teach/courses/#{a.course_id}/assignments/#{a.id}" } }

    render json: { results: results }
  end
end
```

**Add route:** `get "search", to: "search#index"` inside the `namespace :api -> namespace :v1` block.

**Create:** `apps/core/app/policies/search_policy.rb` — allow all authenticated users.

**Create:** `apps/web/src/components/GlobalSearch.tsx`

**Requirements:**
1. Search input in the top bar of AppShell
2. Debounced input (300ms) — calls `GET /api/v1/search?q=query` on each keystroke
3. Dropdown results panel below the input showing grouped results by type
4. Each result shows: type icon (📋 unit, 📝 lesson, 📚 course, 📏 standard, 📎 assignment), title
5. Click result navigates to the URL
6. Keyboard navigation: arrow keys to select, Enter to navigate, Escape to close
7. "No results" state when query returns empty
8. Show while typing, hide on blur (with delay for click)

**Integrate into AppShell:** Add `<GlobalSearch />` to the top bar area.

---

## Task 2: Notification System

UX §3.2 specifies a notifications bell in the top bar.

**Create migration:** `apps/core/db/migrate/[timestamp]_create_notifications.rb`

```ruby
class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :notification_type, null: false  # e.g., "assignment_published", "submission_graded", "approval_status_changed"
      t.string :title, null: false
      t.text :message
      t.string :url  # link to navigate to
      t.string :notifiable_type  # polymorphic
      t.bigint :notifiable_id
      t.datetime :read_at
      t.timestamps
    end
    add_index :notifications, [:user_id, :read_at]
    add_index :notifications, [:notifiable_type, :notifiable_id]
  end
end
```

**Create:** `apps/core/app/models/notification.rb`
```ruby
class Notification < ApplicationRecord
  include TenantScoped

  belongs_to :user
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :notification_type, presence: true
  validates :title, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc).limit(20) }

  def read!
    update!(read_at: Time.current) if read_at.nil?
  end

  def read?
    read_at.present?
  end
end
```

**Create:** `apps/core/app/controllers/api/v1/notifications_controller.rb`
- `GET /api/v1/notifications` — list user's notifications (recent, paginated)
- `GET /api/v1/notifications/unread_count` — returns `{ count: N }`
- `PATCH /api/v1/notifications/:id/read` — mark as read
- `POST /api/v1/notifications/mark_all_read` — mark all as read

**Create:** `apps/core/app/policies/notification_policy.rb` — users can only see/modify their own notifications.

**Create:** `apps/core/app/services/notification_service.rb`
```ruby
class NotificationService
  def self.notify(user:, type:, title:, message: nil, url: nil, actor: nil, notifiable: nil)
    return if Current.tenant.blank?

    Notification.create!(
      tenant: Current.tenant,
      user: user,
      actor: actor,
      notification_type: type,
      title: title,
      message: message,
      url: url,
      notifiable: notifiable
    )
  end

  def self.notify_enrolled_students(course:, type:, title:, message: nil, url: nil, actor: nil, notifiable: nil)
    student_ids = Enrollment.where(section: course.sections, role: "student").distinct.pluck(:user_id)
    User.where(id: student_ids).find_each do |student|
      notify(user: student, type: type, title: title, message: message, url: url, actor: actor, notifiable: notifiable)
    end
  end
end
```

**Add notification triggers to existing controllers** (add one line after key actions):

In `assignments_controller.rb` — after publish:
```ruby
NotificationService.notify_enrolled_students(course: @assignment.course, type: "assignment_published", title: "New assignment: #{@assignment.title}", url: "/learn/courses/#{@assignment.course_id}/assignments/#{@assignment.id}", actor: current_user, notifiable: @assignment)
```

In `submissions_controller.rb` — after grade:
```ruby
NotificationService.notify(user: @submission.user, type: "submission_graded", title: "#{@submission.assignment.title} has been graded", url: "/learn/courses/#{@submission.assignment.course_id}/assignments/#{@submission.assignment_id}", actor: current_user, notifiable: @submission)
```

In `approvals_controller.rb` — after status change:
```ruby
NotificationService.notify(user: @approval.submitted_by, type: "approval_status_changed", title: "Your unit '#{@approval.approvable.title}' was #{@approval.status}", actor: current_user, notifiable: @approval)
```

**Add routes:**
```ruby
resources :notifications, only: [:index, :show, :update] do
  collection do
    get :unread_count
    post :mark_all_read
  end
  member do
    patch :read
  end
end
```

**Create:** `apps/web/src/components/NotificationBell.tsx`

**Requirements:**
1. Bell icon in the top bar with unread count badge
2. Poll `GET /api/v1/notifications/unread_count` every 30 seconds (or on page focus)
3. Click opens a dropdown panel showing recent notifications
4. Each notification: title, message preview, time ago, read/unread indicator
5. Click notification: mark as read + navigate to URL
6. "Mark all read" button at the top
7. "View all" link to `/notifications` page

**Create:** `apps/web/src/app/notifications/page.tsx` — full notifications list page
1. Paginated list of all notifications
2. Filter: All / Unread
3. Mark as read on click

**Integrate into AppShell:** Add `<NotificationBell />` to the top bar area.

---

## Task 3: School Selector

UX §3.2 specifies a school selector in the top bar. Users belonging to multiple schools need to switch context.

**Create:** `apps/web/src/components/SchoolSelector.tsx`

**Requirements:**
1. Dropdown in the top bar showing the current school name
2. On mount, fetch `GET /api/v1/schools` — if user belongs to only one school, show it as static text (no dropdown)
3. If multiple schools, show a dropdown
4. Selecting a school stores the selection in React state/context and passes it as a header or parameter in subsequent API calls
5. Display school name prominently

**Backend:** Check if the schools endpoint exists. If not, add a simple `GET /api/v1/schools` that returns schools the current user has access to (via their tenant).

**Integrate into AppShell:** Add `<SchoolSelector />` to the top bar, left of the search.

---

## Task 4: First-Time Setup Wizard

UX §3.3 specifies a first-time setup flow for new users.

**Create:** `apps/web/src/app/setup/page.tsx`

**Requirements:**
1. Step-by-step wizard (3-4 steps) shown ONLY on first login (check a flag on the user object like `onboarding_complete`)
2. Step 1 — **Welcome**: "Welcome to [school name]! Let's get you set up." + role display
3. Step 2 — **Preferences** (teacher): Select subjects, grade levels (stored as user preferences)
4. Step 3 — **Quick Tour**: Brief visual walkthrough of main sections (Plan, Teach, Assess)
5. Step 4 — **Done**: "You're all set!" with CTA buttons: "Create Your First Unit" or "Browse Templates"
6. "Skip Setup" link on every step
7. On completion, update the user: `PATCH /api/v1/me` with `{ onboarding_complete: true }`

**Backend addition:**

Add `onboarding_complete` to users table if it doesn't exist:

```ruby
class AddOnboardingCompleteToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :onboarding_complete, :boolean, default: false, unless column_exists?(:users, :onboarding_complete)
    add_column :users, :preferences, :jsonb, default: {}, unless column_exists?(:users, :preferences)
  end
end
```

Update the sessions controller or `me` endpoint to return `onboarding_complete`.
Update `PATCH /api/v1/me` to accept `onboarding_complete` and `preferences`.

**Integrate:** In the auth context or dashboard, check `user.onboarding_complete` — if false, redirect to `/setup`.

---

## Task 5: Role-Based Route Guards

From SPRINT_UPCOMING item 15. Currently any logged-in user can navigate to admin pages.

**Modify:** `apps/web/src/components/ProtectedRoute.tsx`

**Requirements:**
1. Accept optional `requiredRoles` prop: `string[]`
2. If `requiredRoles` is provided, check that the current user has at least one of the required roles
3. If the user lacks the required role, redirect to `/unauthorized` or show an inline "Access Denied" message
4. If no `requiredRoles` prop, behave as before (authentication only)

**Create:** `apps/web/src/app/unauthorized/page.tsx`
- Simple page: "You don't have permission to access this page."
- "Go to Dashboard" button

**Apply role guards to route groups by wrapping in layouts or page-level guards:**
- `/admin/*` — `["admin"]`
- `/plan/*` — `["admin", "curriculum_lead", "teacher"]`
- `/teach/*` — `["admin", "teacher"]`
- `/assess/*` — `["admin", "teacher"]`
- `/learn/*` — `["admin", "teacher", "student"]` (teacher may want to preview student view)
- `/communicate/*` — all authenticated (no role restriction)

---

## Architecture Rules

1. All new models MUST include `TenantScoped`
2. All new controllers MUST use Pundit authorization
3. Notification creation should be fire-and-forget — don't let notification failures block the main action (wrap in begin/rescue)
4. Global search uses ILIKE for simplicity — not Postgres FTS. Good enough for the scale we're targeting.
5. All frontend components follow existing patterns: `apiFetch`, loading/error states, `"use client"`
6. Any new migrations use `unless column_exists?` / `unless table_exists?` for idempotency

---

## Testing

```bash
cd apps/core && bundle exec rspec
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] Global search endpoint and component in top bar
- [ ] Notification model, service, controller, and triggers on key actions
- [ ] NotificationBell component in top bar with unread count
- [ ] Notifications list page
- [ ] School selector in top bar (static for single-school, dropdown for multi)
- [ ] First-time setup wizard at `/setup` with skip option
- [ ] User model has `onboarding_complete` and `preferences` fields
- [ ] ProtectedRoute supports `requiredRoles` prop
- [ ] Role guards applied to all route groups
- [ ] Unauthorized page
- [ ] All lint and build checks pass
