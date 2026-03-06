# Step 6 — Enforce school scoping for district-scale correctness

## Outcome

After this step:

- The backend understands an explicit **school context** for each request.
- Data access is safely scoped so users cannot accidentally (or maliciously) read/write across schools inside the same tenant.
- Admins/curriculum leads can still opt into cross-school views when needed.
- Policy scopes and key create/update flows enforce:
  - the selected school
  - course ownership
  - planning context ownership

This step is essential for multi-school tenants (district-style deployments).

---

## Why this is needed in the current repo

Today:

- `Current` only tracks `tenant` and `user`.
- Many policy scopes return `scope.all` for privileged users.
- Several controllers accept `school_id` or `course_id` but don’t enforce that they match a consistent school context.

In a multi-school tenant, that creates:

- accidental cross-school edits
- confusing admin UIs
- security risks if authorization checks miss a join

---

## Design decisions

### Decision 1 — Add `Current.school`
We mirror the pattern used for tenant/user:

- `Current.school` is set per request
- It may be nil if the request is not school-scoped

### Decision 2 — Use an explicit header for school context
Use one header consistently:

- `X-School-Id: <school_id>`

(You can also allow `school_id` param as fallback.)

### Decision 3 — Prefer policy scopes over default_scope
Avoid global `default_scope` for school because:

- some admin flows legitimately need cross-school access
- default scopes can produce confusing behavior

Instead:

- policy scopes filter by `Current.school` when present
- create/update actions validate school consistency

---

## Implementation plan

### 1) Extend `Current`

**Modify:** `apps/core/app/models/current.rb`

Add:

```rb
class Current < ActiveSupport::CurrentAttributes
  attribute :tenant, :user, :school
end
```

---

### 2) Resolve school context per request

**Modify:** `apps/core/app/controllers/application_controller.rb`

Add a `before_action` after tenant/user resolution:

- `resolve_school_context`

Implementation outline:

```rb
before_action :authenticate_user!
before_action :resolve_school_context
```

Add methods:

```rb
def resolve_school_context
  Current.school = nil

  school_id = request.headers["X-School-Id"].presence || params[:school_id].presence
  return if school_id.blank?

  school = School.unscoped.find_by(id: school_id.to_i, tenant_id: Current.tenant.id)
  return render(json: { error: "School not found" }, status: :not_found) if school.nil?

  unless user_allowed_for_school?(Current.user, school)
    return render(json: { error: "Forbidden" }, status: :forbidden)
  end

  Current.school = school
  request.env["current_school_id"] = school.id
end

# Simple starter; refine as needed
def user_allowed_for_school?(user, school)
  return true if user.has_role?(:admin) || user.has_role?(:curriculum_lead)

  # Teachers/students allowed if they have any enrollment in the school
  Enrollment.joins(section: :course)
    .where(user_id: user.id, courses: { school_id: school.id })
    .exists?
end
```

Performance note:

- The enrollment check runs only when header/param is present.

---

### 3) Enforce school consistency on create/update

For school-scoped resources, ensure the record’s school matches `Current.school` (when set).

Examples:

#### Courses
- `Course.school_id` must equal `Current.school.id` if Current.school present

#### Planning contexts
- `PlanningContext.school_id` must equal `Current.school.id`

#### Curriculum documents
- `CurriculumDocument.school_id` must equal `Current.school.id`

Implementation options:

- controller-level check (recommended)
- model validation that runs only when `Current.school` is present

Controller check example:

```rb
if Current.school && record.school_id != Current.school.id
  render json: { error: "School mismatch" }, status: :unprocessable_content
  return
end
```

---

### 4) Update Pundit policy scopes to respect `Current.school`

For each model that is school-scoped (has `school_id` directly, or through a course/context), update the `Scope#resolve`.

#### 4.1) CoursePolicy::Scope

**Modify:** `apps/core/app/policies/course_policy.rb`

If `Current.school` present, filter:

- privileged users: `scope.where(school_id: Current.school.id)`
- teachers/students: the existing join scope already filters by their enrollments; additionally ensure course.school_id matches Current.school

#### 4.2) UnitPlanPolicy::Scope (legacy)

**Modify:** `apps/core/app/policies/unit_plan_policy.rb`

UnitPlan is indirectly school-scoped via course.

If `Current.school` present:

- privileged users: `scope.joins(:course).where(courses: { school_id: Current.school.id })`

#### 4.3) LessonPlanPolicy::Scope (legacy)

LessonPlan is indirectly school-scoped via unit_plan → course.

#### 4.4) New policies (Step 5)

- PlanningContextPolicy::Scope
- CurriculumDocumentPolicy::Scope

These should always filter by `school_id` when `Current.school` present.

---

### 5) Ensure nested routes can’t “escape” school scope

Example:

- `GET /courses/:id` should not return a course in a different school when `X-School-Id` is set.

This is naturally enforced if:

- controller uses `policy_scope(Course).find(params[:id])` (instead of `Course.find`)

Audit controllers for:

- `.find(params[:id])` on school-scoped models

Replace with:

- `policy_scope(Model).find(params[:id])`

or:

- `policy_scope(Model).find_by!(id: params[:id])`

---

### 6) Add request specs

Add tests that cover:

1. With `X-School-Id` set, user cannot access resources from other schools
2. Without `X-School-Id`, privileged users can access all schools (if desired)
3. Teachers cannot set `X-School-Id` to a school they have no enrollment in

Suggested spec helpers:

- create two schools in same tenant
- create teacher enrolled only in one school
- request other school with header and expect 403

---

## Rollout plan

Feature flag:

- `school_scoping_v1` (default false)

When off:

- do not resolve `Current.school`

When on:

- enforce `Current.school` and apply policy scope filters

Start by enabling for a single internal tenant.

---

## Acceptance criteria

- Requests with `X-School-Id` are scoped to that school.
- Teachers/students cannot access other schools within the same tenant.
- Admins can still access cross-school resources when header not present.
- New planning contexts/documents (Step 5) cannot be created under the wrong school.
