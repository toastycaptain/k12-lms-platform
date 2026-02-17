# CODEX_ACADEMIC_YEAR_ROLLOVER — End-of-Year Operations and Term Transitions

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-6 (Curriculum & Admin Problems — maintain coherent curriculum across grades), PRD-22 (Functional — audit logging), TECH-2.4 (Core Data Model — academic_years, terms)
**Depends on:** None

---

## Problem

The data model includes `academic_years` and `terms` tables, but there are no operations for managing year-end transitions. Schools run on academic calendars (typically August–June or September–July), and at the end of each year:

1. **No year rollover process** — no way to close out a year and start a new one
2. **No course archival** — completed courses stay in active lists alongside new ones
3. **No enrollment reset** — students who graduated or moved grades remain enrolled
4. **No template carry-forward** — teachers must manually recreate or find previous year's unit plans
5. **No grade finalization** — no "close grades" action to lock gradebooks
6. **No data retention alignment** — DataRetentionPolicy exists but isn't tied to year boundaries
7. **No admin year-transition wizard** — admins must manually manage all transitions

TECH-2.4 defines `academic_years` and `terms` in the Identity/Organization data model, but no workflows exist to manage their lifecycle.

---

## Tasks

### 1. Create Academic Year Lifecycle API

Update `apps/core/app/controllers/api/v1/academic_years_controller.rb` (extend existing):

```ruby
# POST /api/v1/academic_years/:id/close
def close
  authorize @academic_year, :manage?

  AcademicYearCloseService.new(@academic_year, Current.user).call

  render json: @academic_year.reload
end

# POST /api/v1/academic_years/:id/rollover
def rollover
  authorize @academic_year, :manage?

  new_year = AcademicYearRolloverService.new(@academic_year, params.permit(
    :name, :start_date, :end_date, :copy_templates, :copy_standards, :archive_courses
  )).call

  render json: new_year, status: :created
end
```

### 2. Create AcademicYearCloseService

Create `apps/core/app/services/academic_year_close_service.rb`:

```ruby
class AcademicYearCloseService
  def initialize(academic_year, actor)
    @academic_year = academic_year
    @actor = actor
  end

  def call
    ActiveRecord::Base.transaction do
      finalize_grades
      archive_courses
      update_year_status
      log_closure
    end
  end

  private

  def finalize_grades
    # Lock all gradebooks for courses in this academic year
    courses_in_year.each do |course|
      course.update!(grades_finalized: true, grades_finalized_at: Time.current)
    end
  end

  def archive_courses
    courses_in_year.where(status: "active").update_all(
      status: "archived",
      archived_at: Time.current,
    )
  end

  def update_year_status
    @academic_year.update!(
      status: "closed",
      closed_at: Time.current,
      closed_by: @actor,
    )
  end

  def log_closure
    AuditLogger.log(
      actor: @actor,
      action: "academic_year_closed",
      auditable: @academic_year,
      metadata: {
        courses_archived: courses_in_year.count,
        year_name: @academic_year.name,
      },
    )
  end

  def courses_in_year
    Course.where(academic_year: @academic_year)
  end
end
```

### 3. Create AcademicYearRolloverService

Create `apps/core/app/services/academic_year_rollover_service.rb`:

```ruby
class AcademicYearRolloverService
  def initialize(source_year, options = {})
    @source_year = source_year
    @options = options
  end

  def call
    ActiveRecord::Base.transaction do
      new_year = create_new_year
      create_terms(new_year)
      copy_templates(new_year) if @options[:copy_templates]
      copy_standard_frameworks(new_year) if @options[:copy_standards]
      log_rollover(new_year)
      new_year
    end
  end

  private

  def create_new_year
    AcademicYear.create!(
      tenant: Current.tenant,
      name: @options[:name] || next_year_name,
      start_date: @options[:start_date] || @source_year.start_date + 1.year,
      end_date: @options[:end_date] || @source_year.end_date + 1.year,
      status: "active",
    )
  end

  def create_terms(new_year)
    @source_year.terms.each do |term|
      Term.create!(
        tenant: Current.tenant,
        academic_year: new_year,
        name: term.name,
        start_date: term.start_date + 1.year,
        end_date: term.end_date + 1.year,
      )
    end
  end

  def copy_templates(new_year)
    # Templates are year-agnostic, but we can mark them as "carried forward"
    Template.where(academic_year: @source_year).find_each do |template|
      template.dup.tap do |new_template|
        new_template.academic_year = new_year
        new_template.status = "draft"
        new_template.save!
      end
    end
  end

  def copy_standard_frameworks(new_year)
    # Standards are typically year-agnostic, but coverage tracking is per-year
    # This creates the linkage for the new year's coverage reports
  end

  def next_year_name
    if @source_year.name =~ /(\d{4})-(\d{4})/
      "#{$2}-#{$2.to_i + 1}"
    else
      "#{@source_year.name} (Next)"
    end
  end

  def log_rollover(new_year)
    AuditLogger.log(
      actor: Current.user,
      action: "academic_year_rollover",
      auditable: new_year,
      metadata: {
        source_year: @source_year.name,
        new_year: new_year.name,
        templates_copied: @options[:copy_templates] || false,
        standards_copied: @options[:copy_standards] || false,
      },
    )
  end
end
```

### 4. Add Grade Finalization

Add migration:
```ruby
class AddGradeFinalizationToCourses < ActiveRecord::Migration[8.0]
  def change
    add_column :courses, :grades_finalized, :boolean, default: false, null: false
    add_column :courses, :grades_finalized_at, :datetime
    add_column :academic_years, :status, :string, default: "active", null: false
    add_column :academic_years, :closed_at, :datetime
    add_reference :academic_years, :closed_by, foreign_key: { to_table: :users }
  end
end
```

Update GradebookController to prevent grade changes on finalized courses:
```ruby
before_action :check_grades_not_finalized!, only: [:update, :bulk_update]

def check_grades_not_finalized!
  if @course.grades_finalized?
    render json: { error: "Grades have been finalized for this course" }, status: :forbidden
  end
end
```

### 5. Create Year-End Admin Wizard Pages

Create `apps/web/src/app/admin/year-end/`:

```
year-end/
  page.tsx           — Year-end dashboard: current year status, action buttons
  close/
    page.tsx         — Close current year: review courses, finalize grades, confirm
  rollover/
    page.tsx         — Create new year: name, dates, options (copy templates/standards)
  review/
    page.tsx         — Post-rollover review: verify new year, terms, templates
```

**Year-end dashboard features:**
- Current academic year card with status
- Summary: X courses active, Y students enrolled, Z grades pending
- "Close Year" button (disabled if grades not finalized in all courses)
- "Create New Year" button (available after year is closed)
- History of past academic years with close dates

**Close year wizard:**
- Step 1: Review courses — list all active courses with unfinalized grades count
- Step 2: Finalize grades — bulk finalize or flag courses needing attention
- Step 3: Archive courses — confirm archival of all courses
- Step 4: Close year — final confirmation with summary

**Rollover wizard:**
- Step 1: New year details — name, start/end dates
- Step 2: Term structure — auto-populated from previous year, editable
- Step 3: Options — checkboxes for copy templates, copy standards
- Step 4: Confirm and create

### 6. Add Enrollment Deactivation

Create `apps/core/app/jobs/enrollment_deactivation_job.rb`:

```ruby
class EnrollmentDeactivationJob < ApplicationJob
  queue_as :default

  def perform(academic_year_id)
    year = AcademicYear.find(academic_year_id)
    Current.tenant = year.tenant

    courses = Course.where(academic_year: year)
    count = Enrollment.where(section: Section.where(course: courses))
                      .where(status: "active")
                      .update_all(status: "inactive", deactivated_at: Time.current)

    AuditLogger.log(
      actor: year.closed_by,
      action: "enrollments_deactivated",
      auditable: year,
      metadata: { deactivated_count: count },
    )
  end
end
```

Add `status` and `deactivated_at` to enrollments if not present:
```ruby
class AddStatusToEnrollments < ActiveRecord::Migration[8.0]
  def change
    add_column :enrollments, :status, :string, default: "active", null: false unless column_exists?(:enrollments, :status)
    add_column :enrollments, :deactivated_at, :datetime unless column_exists?(:enrollments, :deactivated_at)
  end
end
```

### 7. Add Tests

**Backend:**
- `apps/core/spec/services/academic_year_close_service_spec.rb`
  - Finalizes grades on all courses
  - Archives active courses
  - Updates year status to closed
  - Creates audit log entry

- `apps/core/spec/services/academic_year_rollover_service_spec.rb`
  - Creates new academic year with correct dates
  - Creates matching terms shifted by one year
  - Optionally copies templates
  - Creates audit log entry

- `apps/core/spec/jobs/enrollment_deactivation_job_spec.rb`
  - Deactivates enrollments for closed year
  - Does not affect other years' enrollments

**Frontend:**
- `apps/web/src/app/admin/year-end/page.test.tsx`
  - Renders year summary
  - Close button disabled when grades not finalized

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_add_grade_finalization.rb` | Finalization columns |
| `apps/core/db/migrate/YYYYMMDD_add_enrollment_status.rb` | Enrollment status columns |
| `apps/core/app/services/academic_year_close_service.rb` | Year closure logic |
| `apps/core/app/services/academic_year_rollover_service.rb` | Year rollover logic |
| `apps/core/app/jobs/enrollment_deactivation_job.rb` | Enrollment deactivation |
| `apps/web/src/app/admin/year-end/page.tsx` | Year-end dashboard |
| `apps/web/src/app/admin/year-end/close/page.tsx` | Close year wizard |
| `apps/web/src/app/admin/year-end/rollover/page.tsx` | New year wizard |
| `apps/web/src/app/admin/year-end/review/page.tsx` | Post-rollover review |
| `apps/core/spec/services/academic_year_close_service_spec.rb` | Service spec |
| `apps/core/spec/services/academic_year_rollover_service_spec.rb` | Service spec |
| `apps/core/spec/jobs/enrollment_deactivation_job_spec.rb` | Job spec |
| `apps/web/src/app/admin/year-end/page.test.tsx` | Frontend test |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/academic_years_controller.rb` | Add close and rollover actions |
| `apps/core/app/controllers/api/v1/gradebook_controller.rb` | Block updates on finalized courses |
| `apps/core/config/routes.rb` | Add year-end routes |
| `apps/core/app/models/course.rb` | Add grades_finalized scope |
| `apps/core/app/models/academic_year.rb` | Add status, closed_at, closed_by |
| `apps/core/app/models/enrollment.rb` | Add status, deactivated_at |
| `apps/web/src/components/AppShell.tsx` | Add Year-End link under Admin nav |

---

## Definition of Done

- [ ] AcademicYearCloseService finalizes grades, archives courses, closes year
- [ ] AcademicYearRolloverService creates new year with terms, optionally copies templates
- [ ] Grade finalization prevents further grade changes on closed courses
- [ ] EnrollmentDeactivationJob deactivates enrollments for closed year
- [ ] Year-end admin dashboard shows current year status and actions
- [ ] Close year wizard walks through grade finalization and archival
- [ ] Rollover wizard creates new year with configurable options
- [ ] All operations create audit log entries
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
