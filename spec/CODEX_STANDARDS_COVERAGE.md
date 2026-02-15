# Codex Instructions — Standards Coverage & Management

## Objective

Build standards coverage reporting per PRD-10 (Phase 2: "Coverage reporting") and an admin standards management interface per UX Spec §3.6 ("Standards Management"). Teachers and curriculum leads need to see which standards are covered across courses, grade levels, and terms — and identify gaps. Admins need to import and manage standard frameworks at the institutional level.

---

## What Already Exists (DO NOT recreate)

### Backend
- `Standard` model — code, description, grade_band, parent_id (self-referential tree), belongs_to standard_framework
- `StandardFramework` model — name, jurisdiction, subject, version, has_many standards
- `AssignmentStandard` — join table linking assignments to standards
- `unit_version_standards` — join table linking unit versions to standards
- `template_version_standards` — join table linking template versions to standards
- `Standard` has tree-building methods: `tree`, `self.build_tree`, `self.build_nodes`
- Routes: `resources :standard_frameworks` (with `tree` member action), `resources :standards`
- `apps/web/src/app/plan/standards/page.tsx` — teacher-facing Standards Browser
- `apps/web/src/app/admin/curriculum-map/page.tsx` — curriculum map showing course-to-standard alignment (fleshed out)
- Routes already have `standards_coverage` on `academic_years` and `courses`

### Frontend
- Admin section in AppShell with "Curriculum Map" link
- No admin Standards Management page exists

---

## Task 1: Standards Coverage Report Endpoint

Check if the existing `standards_coverage` routes have controllers. If not, create them.

**Create or verify:** `apps/core/app/controllers/api/v1/standards_coverage_controller.rb`

```ruby
class Api::V1::StandardsCoverageController < ApplicationController
  # GET /api/v1/academic_years/:academic_year_id/standards_coverage
  def by_academic_year
    academic_year = AcademicYear.find(params[:academic_year_id])
    authorize :standards_coverage, :index?

    frameworks = policy_scope(StandardFramework).includes(standards: :children)
    courses = policy_scope(Course).where(academic_year: academic_year).includes(assignments: :standards)

    covered_standard_ids = AssignmentStandard
      .joins(assignment: :course)
      .where(assignments: { course_id: courses.pluck(:id) })
      .distinct
      .pluck(:standard_id)

    unit_covered_ids = UnitVersionStandard
      .joins(unit_version: { unit_plan: :course })
      .where(unit_plans: { course_id: courses.pluck(:id) })
      .distinct
      .pluck(:standard_id)

    all_covered = (covered_standard_ids + unit_covered_ids).uniq

    report = frameworks.map do |fw|
      standards = fw.standards
      total = standards.count
      covered = standards.where(id: all_covered).count
      {
        framework_id: fw.id,
        framework_name: fw.name,
        subject: fw.subject,
        total_standards: total,
        covered_standards: covered,
        coverage_percentage: total > 0 ? (covered * 100.0 / total).round(1) : 0,
        uncovered: standards.where.not(id: all_covered).map { |s| { id: s.id, code: s.code, description: s.description.truncate(100), grade_band: s.grade_band } }
      }
    end

    render json: { academic_year: academic_year.name, frameworks: report }
  end

  # GET /api/v1/courses/:course_id/standards_coverage
  def by_course
    course = policy_scope(Course).find(params[:course_id])
    authorize :standards_coverage, :index?

    assignment_standard_ids = AssignmentStandard
      .joins(:assignment)
      .where(assignments: { course_id: course.id })
      .distinct
      .pluck(:standard_id)

    unit_standard_ids = UnitVersionStandard
      .joins(unit_version: :unit_plan)
      .where(unit_plans: { course_id: course.id })
      .distinct
      .pluck(:standard_id)

    all_covered_ids = (assignment_standard_ids + unit_standard_ids).uniq
    standards = Standard.where(id: all_covered_ids).includes(:standard_framework)

    # Group by framework
    by_framework = standards.group_by(&:standard_framework).map do |fw, stds|
      total_in_fw = fw.standards.count
      {
        framework_id: fw.id,
        framework_name: fw.name,
        total_standards: total_in_fw,
        covered_standards: stds.length,
        coverage_percentage: total_in_fw > 0 ? (stds.length * 100.0 / total_in_fw).round(1) : 0,
        covered: stds.map { |s| { id: s.id, code: s.code, description: s.description.truncate(100) } }
      }
    end

    render json: { course_id: course.id, course_name: course.name, frameworks: by_framework }
  end
end
```

**Create:** `apps/core/app/policies/standards_coverage_policy.rb`
```ruby
class StandardsCoveragePolicy < ApplicationPolicy
  def index?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end
end
```

**Verify routes exist** (they should already based on routes.rb, but confirm they point to the right controller):
```ruby
resources :academic_years, only: [] do
  get :standards_coverage, to: "standards_coverage#by_academic_year", on: :member
end

resources :courses, only: [] do
  get :standards_coverage, to: "standards_coverage#by_course", on: :member
end
```

---

## Task 2: Standards Coverage Report Page

**Create:** `apps/web/src/app/report/standards-coverage/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Restricted to admin, curriculum_lead, teacher roles
3. **Academic Year Selector**: dropdown fetching from `GET /api/v1/academic_years`
4. **Framework Coverage Cards**: one card per framework showing:
   - Framework name and subject
   - Coverage percentage as a progress bar (green > 80%, yellow 50-80%, red < 50%)
   - "X of Y standards covered" label
   - Click to expand
5. **Expanded Framework View**: shows uncovered standards as a list
   - Each uncovered standard: code, description, grade band
   - "This standard has no aligned content" indicator
6. **Course Drill-Down**: select a course to see per-course coverage
   - Fetch from `GET /api/v1/courses/:id/standards_coverage`
   - Show which standards are covered by assignments vs. unit plans
7. **Summary Stats at Top**: total frameworks, overall coverage percentage, number of fully uncovered standards
8. Add link in AppShell Report section: "Standards Coverage" → `/report/standards-coverage`

---

## Task 3: Admin Standards Management Page

**Create:** `apps/web/src/app/admin/standards/page.tsx`

**Requirements:**
1. Use `"use client"`, `ProtectedRoute`, `AppShell`, `apiFetch`
2. Restricted to admin, curriculum_lead roles
3. **Framework List**: fetch from `GET /api/v1/standard_frameworks`
   - Each framework: name, jurisdiction, subject, version, standard count
   - "Add Framework" button opens create form
   - Click framework to expand and manage standards
4. **Create Framework Form**: name, jurisdiction, subject, version fields → `POST /api/v1/standard_frameworks`
5. **Edit Framework**: inline edit name, jurisdiction, subject, version → `PATCH /api/v1/standard_frameworks/:id`
6. **Delete Framework**: with confirmation dialog → `DELETE /api/v1/standard_frameworks/:id`
7. **Standards Tree View** within a framework:
   - Fetch from `GET /api/v1/standard_frameworks/:id/tree`
   - Display hierarchical tree (parent/child standards with indentation)
   - Each standard shows: code, description, grade_band
8. **Add Standard**: form within framework — code, description, grade_band, parent selector → `POST /api/v1/standards`
9. **Edit Standard**: inline edit → `PATCH /api/v1/standards/:id`
10. **Delete Standard**: with confirmation → `DELETE /api/v1/standards/:id`
11. **Bulk Import**: textarea accepting CSV format (one standard per line: `code,description,grade_band,parent_code`)
    - Parse CSV on the frontend
    - POST each standard to `POST /api/v1/standards` with the framework_id
    - Show progress and results (created count, error count)

---

## Task 4: Standards Gap Analysis View

Add a gap analysis view to the curriculum map page.

**Modify:** `apps/web/src/app/admin/curriculum-map/page.tsx`

**Requirements:**
1. Add a "Gap Analysis" tab or toggle alongside the existing coverage matrix
2. **Gap Analysis View** shows:
   - Standards with ZERO alignment across all courses in the selected academic year
   - Grouped by framework and grade band
   - Each gap: standard code, description, grade band
   - Count of total gaps prominently displayed
3. **Suggested Actions**: for each gap, show:
   - "Assign to Course" button — opens a modal to select a course and create an assignment or unit alignment
   - Course selector fetches from `GET /api/v1/courses`
4. Fetch gap data from the `standards_coverage` endpoint (use the `uncovered` array from Task 1)

---

## Task 5: Specs

**Create:**
- `apps/core/spec/requests/api/v1/standards_coverage_spec.rb`
  - Test `GET /api/v1/academic_years/:id/standards_coverage` — returns framework coverage with correct counts
  - Test uncovered standards are listed
  - Test coverage percentage calculation
  - Test `GET /api/v1/courses/:id/standards_coverage` — returns per-course coverage
  - Test empty course returns 0 coverage
  - Test policy scoping (teachers see only their courses, admins see all)
- `apps/core/spec/policies/standards_coverage_policy_spec.rb`
  - Test admin, curriculum_lead, teacher can access
  - Test student cannot access

---

## Architecture Rules

1. Coverage calculations happen server-side — don't ship raw standard lists to the frontend for counting
2. Standards are covered if aligned via `assignment_standards` OR `unit_version_standards` — both count
3. Use existing Standard tree-building methods for hierarchical display
4. Bulk import is frontend-driven (parse CSV, loop POST requests) — no new backend bulk endpoint needed
5. All endpoints use Pundit authorization
6. Admin standards management uses existing CRUD endpoints — no new backend controllers needed for standards CRUD

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/standards_coverage*
cd apps/web && npm run lint && npm run typecheck && npm run build
```

---

## Definition of Done

- [ ] Standards coverage endpoint for academic years (with uncovered standards list)
- [ ] Standards coverage endpoint for courses
- [ ] Standards Coverage Report page at `/report/standards-coverage`
- [ ] Admin Standards Management page at `/admin/standards` with framework CRUD, tree view, bulk import
- [ ] Gap analysis view on curriculum map page
- [ ] Request and policy specs
- [ ] All lint and build checks pass
