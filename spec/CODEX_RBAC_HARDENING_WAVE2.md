# Codex Instructions — RBAC Hardening Wave 2

## Objective

Tighten all Pundit policy scopes that currently use broad `scope.all` to enforce role-and-ownership-based access. After Wave 1 hardened Course, Enrollment, and UnitPlan policies, this wave targets all remaining high-risk policies that expose academic or student data.

**Spec references:** PRD-9 (RBAC), TECH-2.3 (tenancy + auth), PRD-23 (security)

---

## What Already Exists (DO NOT recreate)

### Hardened Policies (Wave 1 — already done)
- `apps/core/app/policies/course_policy.rb` — role-scoped
- `apps/core/app/policies/enrollment_policy.rb` — role-scoped
- `apps/core/app/policies/unit_plan_policy.rb` — role-scoped

### Infrastructure
- `apps/core/app/models/concerns/tenant_scoped.rb` — all models include this
- `apps/core/app/models/current.rb` — `Current.tenant` and `Current.user`
- `apps/core/app/controllers/application_controller.rb` — sets `Current.tenant` and `Current.user`
- All controllers already call `authorize` via Pundit

### Test Patterns
- `apps/core/spec/policies/course_policy_spec.rb` — example of hardened policy spec
- `apps/core/spec/requests/api/v1/` — request specs exist for all controllers

---

## Authorization Model

### Roles (from User model)
Users have roles via `user_roles` join table: `admin`, `teacher`, `curriculum_lead`, `student`

### Access Rules
| Role | Can See | Can Modify |
|------|---------|------------|
| admin | Everything in tenant | Everything in tenant |
| curriculum_lead | Everything in tenant | Templates, standards, approvals, unit plans |
| teacher | Own courses + enrolled sections | Own assignments, submissions in own courses, own discussions |
| student | Enrolled courses only | Own submissions, own quiz attempts, own discussion posts |

---

## Task 1: Assignment Policy Hardening

**File:** `apps/core/app/policies/assignment_policy.rb`

**Current state:** Likely uses `scope.all` in `Scope#resolve`.

**Required changes:**
1. `Scope#resolve`:
   - Admin/curriculum_lead: `scope.all`
   - Teacher: assignments in courses the teacher is enrolled in (via sections → enrollments) or created by the teacher
   - Student: assignments in courses the student is enrolled in AND assignment status is "published"
2. `show?`: user is admin OR user is enrolled in the assignment's course OR user created the assignment
3. `create?`/`update?`/`destroy?`: admin, curriculum_lead, or teacher enrolled in the assignment's course
4. `publish?`/`close?`: same as create?

**Test:** `apps/core/spec/policies/assignment_policy_spec.rb`
- Test that a student in Course A cannot see assignments from Course B
- Test that a teacher not enrolled in Course A cannot modify Course A assignments
- Test that a student cannot see draft assignments

---

## Task 2: Submission Policy Hardening

**File:** `apps/core/app/policies/submission_policy.rb`

**Required changes:**
1. `Scope#resolve`:
   - Admin: `scope.all`
   - Teacher: submissions for assignments in courses the teacher is enrolled in
   - Student: only the student's own submissions (`scope.where(user_id: user.id)`)
2. `show?`: admin, teacher in the course, or own submission
3. `create?`: student enrolled in the assignment's course
4. `update?` (grade): admin or teacher enrolled in the assignment's course

**Test:** `apps/core/spec/policies/submission_policy_spec.rb`
- Test that Student A cannot see Student B's submissions
- Test that a teacher in Course B cannot grade Course A submissions

---

## Task 3: Quiz & QuizAttempt Policy Hardening

**Files:**
- `apps/core/app/policies/quiz_policy.rb`
- `apps/core/app/policies/quiz_attempt_policy.rb`
- `apps/core/app/policies/quiz_item_policy.rb`
- `apps/core/app/policies/quiz_accommodation_policy.rb`

**Required changes for QuizPolicy:**
1. `Scope#resolve`:
   - Admin/curriculum_lead: `scope.all`
   - Teacher: quizzes in courses the teacher is enrolled in
   - Student: published quizzes in enrolled courses only
2. `create?`/`update?`/`destroy?`: admin or teacher in the quiz's course

**Required changes for QuizAttemptPolicy:**
1. `Scope#resolve`:
   - Admin: `scope.all`
   - Teacher: attempts for quizzes in their courses
   - Student: only own attempts (`scope.where(user_id: user.id)`)
2. `create?`: student enrolled in the quiz's course AND quiz is published
3. `show?`: admin, teacher in the course, or own attempt

**Test files:**
- `apps/core/spec/policies/quiz_policy_spec.rb`
- `apps/core/spec/policies/quiz_attempt_policy_spec.rb`

---

## Task 4: Discussion & DiscussionPost Policy Hardening

**Files:**
- `apps/core/app/policies/discussion_policy.rb`
- `apps/core/app/policies/discussion_post_policy.rb`

**Required changes for DiscussionPolicy:**
1. `Scope#resolve`:
   - Admin: `scope.all`
   - Teacher/student: discussions in enrolled courses only
2. `lock?`/`unlock?`: admin or teacher in the discussion's course

**Required changes for DiscussionPostPolicy:**
1. `create?`: user is enrolled in the discussion's course AND discussion is not locked
2. `destroy?`: admin, teacher in the course, or post author

---

## Task 5: QuestionBank & Question Policy Hardening

**Files:**
- `apps/core/app/policies/question_bank_policy.rb`
- `apps/core/app/policies/question_policy.rb`

**Required changes for QuestionBankPolicy:**
1. `Scope#resolve`:
   - Admin/curriculum_lead/teacher: `scope.all` (question banks are shared resources for content creators)
   - Student: `scope.none` (students should never browse question banks directly)
2. `create?`/`update?`/`destroy?`: admin, curriculum_lead, or teacher

**Required changes for QuestionPolicy:**
1. Same role rules as QuestionBankPolicy
2. Student: `scope.none`

---

## Task 6: Integration & Sync Policy Hardening

**Files:**
- `apps/core/app/policies/integration_config_policy.rb`
- `apps/core/app/policies/sync_run_policy.rb`
- `apps/core/app/policies/sync_log_policy.rb`
- `apps/core/app/policies/sync_mapping_policy.rb`

**Required changes:** All integration/sync resources are admin-only.
1. `Scope#resolve`: admin only — `scope.none` for all other roles
2. All write actions: admin only

---

## Task 7: Request Spec Verification

For each hardened policy, add or update the corresponding request spec in `apps/core/spec/requests/api/v1/` to verify:

1. **Cross-role denial:** A student hitting a teacher-only endpoint gets 403
2. **Cross-course denial:** A teacher in Course A cannot access Course B resources
3. **Own-data isolation:** Student A cannot see Student B's submissions/attempts
4. **Draft filtering:** Students cannot see draft assignments/quizzes

Each request spec should test at minimum:
- Admin can access (positive case)
- Teacher in course can access (positive case)
- Teacher NOT in course is denied (negative case)
- Student can access own data (positive case)
- Student cannot access other student's data (negative case)

---

## Architecture Rules

1. All scope changes MUST preserve tenant scoping (TenantScoped already handles `where(tenant_id: Current.tenant.id)`)
2. Use `user.has_role?("admin")` or equivalent role-checking helper
3. For course-membership checks, use: `Enrollment.exists?(user_id: user.id, section_id: Section.where(course_id: course_id).select(:id))`
4. Cache enrollment lookups where possible to avoid N+1 in scope resolution
5. Never remove the `authorize` call from any controller action

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/policies/ spec/requests/
```

---

## Definition of Done

- [ ] Assignment policy scoped by role and course enrollment
- [ ] Submission policy scoped — students see only own submissions
- [ ] Quiz + QuizAttempt policies scoped by role and course
- [ ] Discussion + DiscussionPost policies scoped by course enrollment
- [ ] QuestionBank + Question policies deny student access
- [ ] Integration/Sync policies restricted to admin only
- [ ] Request specs verify cross-role and cross-course denial for each hardened policy
- [ ] All existing specs still pass
- [ ] No new Rubocop violations
