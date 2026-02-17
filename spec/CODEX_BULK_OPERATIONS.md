# CODEX_BULK_OPERATIONS — Bulk Grading, CSV Import/Export, and Batch Actions

**Priority:** P2
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-5 (Teacher Problems — reduce friction), PRD-6 (Admin Problems — reduce tool sprawl), PRD-22 (Grading), PRD-8 (Performance metrics)
**Why Now:** Critical for teacher productivity in classes of 25–35 students
**Depends on:** None

---

## Problem

Teachers managing classes of 25–35 students and admins onboarding hundreds of users at the start of a school year have no bulk operations. Every action must be performed one-at-a-time:

1. **No bulk grading** — teachers grade submissions one by one; can't enter grades in a spreadsheet-style interface
2. **No CSV user import** — admins manually create each user account; no way to import from SIS exports
3. **No CSV grade export** — teachers can't export grades to external tools or share with administrators
4. **No batch publish/archive** — can't publish or archive multiple units, assignments, or courses at once
5. **No bulk enrollment** — can't enroll a list of students into a section from a CSV or paste
6. **No batch notification** — can't send announcements to multiple courses at once

---

## Tasks

### 1. Create Bulk Grade Entry API

Add to `apps/core/app/controllers/api/v1/bulk_grades_controller.rb`:

```ruby
class Api::V1::BulkGradesController < ApplicationController
  # PATCH /api/v1/courses/:course_id/bulk_grades
  def update
    authorize @course, :grade?

    grades = params.require(:grades) # Array of { submission_id:, grade:, feedback: }
    results = []

    ActiveRecord::Base.transaction do
      grades.each do |grade_entry|
        submission = Submission.find(grade_entry[:submission_id])
        next unless SubmissionPolicy.new(Current.user, submission).grade?

        submission.update!(
          grade: grade_entry[:grade],
          feedback: grade_entry[:feedback],
          graded_at: Time.current,
          graded_by: Current.user,
        )
        results << { submission_id: submission.id, status: "graded" }
      end
    end

    render json: { results: results, graded_count: results.size }
  end
end
```

### 2. Create CSV User Import

Create `apps/core/app/jobs/csv_user_import_job.rb`:

```ruby
class CsvUserImportJob < ApplicationJob
  queue_as :default

  def perform(tenant_id, csv_content, role, imported_by_id)
    Current.tenant = Tenant.find(tenant_id)
    imported_by = User.find(imported_by_id)
    results = { created: 0, skipped: 0, errors: [] }

    CSV.parse(csv_content, headers: true).each_with_index do |row, index|
      email = row["email"]&.strip&.downcase
      next results[:skipped] += 1 if email.blank?
      next results[:skipped] += 1 if User.exists?(email: email, tenant: Current.tenant)

      user = User.create!(
        email: email,
        first_name: row["first_name"]&.strip || "User",
        last_name: row["last_name"]&.strip || email.split("@").first,
        tenant: Current.tenant,
      )
      user.add_role(role.to_sym)
      results[:created] += 1
    rescue ActiveRecord::RecordInvalid => e
      results[:errors] << { row: index + 2, email: email, error: e.message }
    end

    # Store results for polling
    Rails.cache.write(
      "csv_import:#{imported_by_id}:#{tenant_id}",
      results,
      expires_in: 1.hour,
    )

    AuditLogger.log(
      actor: imported_by,
      action: "bulk_user_import",
      metadata: results.merge(role: role),
    )
  end
end
```

Create `apps/core/app/controllers/api/v1/csv_imports_controller.rb`:

```ruby
class Api::V1::CsvImportsController < ApplicationController
  # POST /api/v1/csv_imports/users
  def users
    authorize :csv_import, :create?

    csv_content = params.require(:file).read
    role = params.require(:role)

    CsvUserImportJob.perform_later(
      Current.tenant.id, csv_content, role, Current.user.id
    )

    render json: { status: "queued", message: "Import started" }
  end

  # GET /api/v1/csv_imports/users/status
  def users_status
    authorize :csv_import, :create?
    result = Rails.cache.read("csv_import:#{Current.user.id}:#{Current.tenant.id}")

    if result
      render json: { status: "complete", results: result }
    else
      render json: { status: "processing" }
    end
  end
end
```

### 3. Create CSV Grade Export

Create `apps/core/app/services/gradebook_csv_export_service.rb`:

```ruby
class GradebookCsvExportService
  def initialize(course)
    @course = course
  end

  def call
    students = enrolled_students
    assignments = @course.assignments.order(:due_at)

    CSV.generate(headers: true) do |csv|
      # Header row
      csv << ["Student Name", "Email", *assignments.map(&:title), "Course Average"]

      # Student rows
      students.each do |student|
        grades = assignments.map do |a|
          sub = Submission.find_by(user: student, assignment: a)
          sub&.grade || ""
        end
        avg = calculate_average(student, assignments)
        csv << ["#{student.last_name}, #{student.first_name}", student.email, *grades, avg]
      end

      # Summary row
      averages = assignments.map { |a| assignment_average(a) }
      csv << ["CLASS AVERAGE", "", *averages, overall_average(students, assignments)]
    end
  end

  private

  def enrolled_students
    User.joins(enrollments: :section)
        .where(sections: { course_id: @course.id })
        .where(enrollments: { role: "student" })
        .order(:last_name, :first_name)
  end
end
```

Add export endpoint to gradebook controller:
```ruby
# GET /api/v1/courses/:course_id/gradebook/export.csv
def export
  authorize @course, :show?
  csv = GradebookCsvExportService.new(@course).call
  send_data csv, filename: "gradebook-#{@course.name.parameterize}-#{Date.current}.csv", type: "text/csv"
end
```

### 4. Create Batch Publish/Archive API

Create `apps/core/app/controllers/api/v1/batch_actions_controller.rb`:

```ruby
class Api::V1::BatchActionsController < ApplicationController
  # POST /api/v1/batch_actions/publish
  def publish
    authorize :batch_action, :publish?
    ids = params.require(:ids)
    type = params.require(:type) # "unit_plans", "assignments", "courses"

    model = resolve_model(type)
    records = policy_scope(model).where(id: ids)

    updated = records.update_all(status: "published", published_at: Time.current)
    render json: { updated_count: updated }
  end

  # POST /api/v1/batch_actions/archive
  def archive
    authorize :batch_action, :archive?
    ids = params.require(:ids)
    type = params.require(:type)

    model = resolve_model(type)
    records = policy_scope(model).where(id: ids)

    updated = records.update_all(status: "archived", archived_at: Time.current)
    render json: { updated_count: updated }
  end

  private

  def resolve_model(type)
    {
      "unit_plans" => UnitPlan,
      "assignments" => Assignment,
      "courses" => Course,
      "templates" => Template,
    }.fetch(type) { raise ActionController::BadRequest, "Unknown type: #{type}" }
  end
end
```

### 5. Create Bulk Enrollment API

Add to `apps/core/app/controllers/api/v1/bulk_enrollments_controller.rb`:

```ruby
class Api::V1::BulkEnrollmentsController < ApplicationController
  # POST /api/v1/sections/:section_id/bulk_enroll
  def create
    authorize @section, :update?

    emails = params.require(:emails) # Array of email strings
    results = { enrolled: 0, not_found: [], already_enrolled: [] }

    emails.each do |email|
      user = User.find_by(email: email.strip.downcase, tenant: Current.tenant)
      unless user
        results[:not_found] << email
        next
      end

      if Enrollment.exists?(user: user, section: @section)
        results[:already_enrolled] << email
        next
      end

      Enrollment.create!(user: user, section: @section, tenant: Current.tenant, role: "student")
      results[:enrolled] += 1
    end

    render json: results
  end
end
```

### 6. Build Bulk Grade Entry UI

Create `apps/web/src/app/teach/courses/[courseId]/gradebook/bulk-grade/page.tsx`:

- Spreadsheet-style grid with student rows and assignment columns
- Inline editable grade cells (click to type, tab to move to next)
- Changed cells highlighted with visual indicator
- "Save All Changes" button that sends batch PATCH
- Validation: grades must be 0–100 or within points_possible range
- Keyboard navigation: Tab, Enter, arrow keys between cells
- Undo last change with Ctrl+Z

### 7. Build CSV Import UI

Create `apps/web/src/app/admin/users/import/page.tsx`:

- File upload dropzone (accepts .csv)
- CSV preview showing first 5 rows
- Role selector dropdown (student, teacher, guardian)
- Column mapping preview (auto-detect email, first_name, last_name)
- "Import" button with confirmation modal
- Progress indicator polling for status
- Results summary: created count, skipped count, errors with row numbers
- Download template CSV link

### 8. Build Batch Action Toolbar

Create `apps/web/src/components/BatchActionBar.tsx`:

```typescript
interface BatchActionBarProps {
  selectedCount: number;
  onPublish?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onClearSelection: () => void;
}
```

- Fixed bar at bottom of page when items are selected
- Shows selection count: "3 items selected"
- Action buttons: Publish, Archive, Delete (based on context)
- "Clear selection" button
- Slide-up animation on appear

Add selection checkboxes to list pages:
- `/plan/units` — Unit library
- `/teach/courses/[courseId]/assignments` — Assignment list
- `/plan/templates` — Template library

### 9. Add Tests

**Backend:**
- `apps/core/spec/requests/api/v1/bulk_grades_controller_spec.rb`
- `apps/core/spec/requests/api/v1/csv_imports_controller_spec.rb`
- `apps/core/spec/requests/api/v1/batch_actions_controller_spec.rb`
- `apps/core/spec/requests/api/v1/bulk_enrollments_controller_spec.rb`
- `apps/core/spec/jobs/csv_user_import_job_spec.rb`
- `apps/core/spec/services/gradebook_csv_export_service_spec.rb`

**Frontend:**
- `apps/web/src/app/teach/courses/[courseId]/gradebook/bulk-grade/page.test.tsx`
- `apps/web/src/app/admin/users/import/page.test.tsx`
- `apps/web/src/components/__tests__/BatchActionBar.test.tsx`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/bulk_grades_controller.rb` | Bulk grade entry API |
| `apps/core/app/controllers/api/v1/csv_imports_controller.rb` | CSV import API |
| `apps/core/app/controllers/api/v1/batch_actions_controller.rb` | Batch publish/archive API |
| `apps/core/app/controllers/api/v1/bulk_enrollments_controller.rb` | Bulk enrollment API |
| `apps/core/app/jobs/csv_user_import_job.rb` | Async CSV processing |
| `apps/core/app/services/gradebook_csv_export_service.rb` | Grade CSV generation |
| `apps/core/app/policies/csv_import_policy.rb` | Import authorization (admin only) |
| `apps/core/app/policies/batch_action_policy.rb` | Batch action authorization |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/bulk-grade/page.tsx` | Spreadsheet grade entry |
| `apps/web/src/app/admin/users/import/page.tsx` | CSV import UI |
| `apps/web/src/components/BatchActionBar.tsx` | Selection action toolbar |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add bulk operations routes |
| `apps/core/app/controllers/api/v1/gradebook_controller.rb` | Add CSV export action |
| `apps/web/src/app/plan/units/page.tsx` | Add selection checkboxes + batch bar |
| `apps/web/src/app/plan/templates/page.tsx` | Add selection checkboxes + batch bar |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx` | Add "Bulk Grade" + "Export CSV" buttons |
| `apps/web/src/app/admin/users/page.tsx` | Add "Import CSV" button |

---

## Definition of Done

- [ ] Bulk grade PATCH accepts array of {submission_id, grade, feedback} and grades in transaction
- [ ] CSV user import job processes file asynchronously with results polling
- [ ] CSV grade export generates downloadable file with student grades and averages
- [ ] Batch publish/archive updates multiple records atomically
- [ ] Bulk enrollment accepts email list and enrolls matching users
- [ ] Spreadsheet-style bulk grade UI with inline editing and keyboard navigation
- [ ] CSV import page with file upload, preview, role selection, and results
- [ ] BatchActionBar appears on list pages when items selected
- [ ] All policies restrict: grades to course teachers, imports to admins, batch actions to owners
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
