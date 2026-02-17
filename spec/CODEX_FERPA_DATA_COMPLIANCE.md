# CODEX_FERPA_DATA_COMPLIANCE — Student Data Privacy, Export, and Deletion

**Priority:** P0
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Security, Privacy), PRD-15 (Governance), TECH-2.11 (Security)
**Depends on:** None

---

## Problem

US K-12 schools are subject to FERPA (Family Educational Rights and Privacy Act) and COPPA (Children's Online Privacy Protection Act). The platform currently has:

1. **No student data export** — FERPA requires schools to provide parents access to their child's educational records on request. No mechanism exists to generate a complete data package for a student.
2. **No right-to-deletion** — when a student leaves a school or a parent requests record removal, there is no workflow to identify, review, and purge student-specific data while preserving aggregate data integrity.
3. **No consent records** — COPPA requires verifiable parental consent for students under 13. No consent model or tracking exists.
4. **No data inventory** — no documented catalog of what personal data is stored, where, and for how long (required for compliance audits).
5. **No access log for student records** — FERPA requires schools to maintain a record of who accessed a student's educational records. AuditLog exists but isn't scoped to per-student record access tracking.
6. **DataRetentionPolicy exists** — but only for time-based bulk purging, not individual student deletion requests.

---

## Tasks

### 1. Create Student Data Export Service

Create `apps/core/app/services/student_data_export_service.rb`:

```ruby
class StudentDataExportService
  def initialize(student)
    @student = student
    @tenant = student.tenant
  end

  def call
    {
      student_profile: profile_data,
      enrollments: enrollment_data,
      submissions: submission_data,
      quiz_attempts: quiz_attempt_data,
      grades: grade_data,
      discussion_posts: discussion_data,
      messages: message_data,
      ai_interactions: ai_interaction_data,
      guardian_links: guardian_data,
      audit_trail: access_log_data,
      exported_at: Time.current.iso8601,
      export_format_version: "1.0",
    }
  end

  private

  def profile_data
    {
      id: @student.id,
      email: @student.email,
      first_name: @student.first_name,
      last_name: @student.last_name,
      created_at: @student.created_at,
      last_sign_in_at: @student.last_sign_in_at,
      roles: @student.roles.pluck(:name),
    }
  end

  def enrollment_data
    @student.enrollments.includes(section: :course).map do |enrollment|
      {
        course: enrollment.section.course.name,
        section: enrollment.section.name,
        role: enrollment.role,
        enrolled_at: enrollment.created_at,
      }
    end
  end

  def submission_data
    Submission.where(user: @student, tenant: @tenant).includes(:assignment).map do |sub|
      {
        assignment: sub.assignment.title,
        submitted_at: sub.submitted_at,
        grade: sub.grade,
        feedback: sub.feedback,
        status: sub.status,
      }
    end
  end

  # ... additional private methods for each data category
end
```

### 2. Create Student Data Deletion Service

Create `apps/core/app/services/student_data_deletion_service.rb`:

```ruby
class StudentDataDeletionService
  # Deletion strategy:
  # - HARD DELETE: messages, discussion_posts, guardian_links (personal data)
  # - ANONYMIZE: submissions, quiz_attempts, audit_logs (preserve aggregate data)
  # - RETAIN: enrollments (anonymized), grades (anonymized for reporting)

  def initialize(student, requested_by:)
    @student = student
    @requested_by = requested_by
    @tenant = student.tenant
  end

  def preview
    # Returns counts of what would be affected (for admin review before execution)
    {
      submissions_to_anonymize: @student.submissions.count,
      quiz_attempts_to_anonymize: QuizAttempt.where(user: @student).count,
      discussion_posts_to_delete: DiscussionPost.where(user: @student).count,
      messages_to_delete: Message.where(sender: @student).or(Message.where(recipient: @student)).count,
      guardian_links_to_delete: GuardianLink.where(student: @student).or(GuardianLink.where(guardian: @student)).count,
      enrollments_to_anonymize: @student.enrollments.count,
    }
  end

  def execute!
    ActiveRecord::Base.transaction do
      anonymize_submissions
      anonymize_quiz_attempts
      delete_discussion_posts
      delete_messages
      delete_guardian_links
      anonymize_enrollments
      anonymize_audit_logs
      record_deletion_event
      anonymize_user_record
    end
  end

  private

  def anonymize_user_record
    @student.update!(
      email: "deleted-#{@student.id}@removed.local",
      first_name: "Deleted",
      last_name: "User",
      deleted_at: Time.current,
    )
  end

  def record_deletion_event
    AuditLogger.log(
      actor: @requested_by,
      action: "student_data_deletion",
      target: @student,
      metadata: preview.merge(reason: "FERPA deletion request"),
    )
  end
end
```

### 3. Create Consent Model

Create migration and model for parental consent tracking:

```ruby
class CreateConsentRecords < ActiveRecord::Migration[8.0]
  def change
    create_table :consent_records do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :guardian, foreign_key: { to_table: :users }
      t.string :consent_type, null: false   # "coppa", "data_collection", "ai_usage", "photo_release"
      t.string :status, null: false, default: "pending"  # "pending", "granted", "denied", "revoked"
      t.datetime :granted_at
      t.datetime :revoked_at
      t.string :granted_method              # "electronic", "paper", "verbal"
      t.text :notes
      t.timestamps
    end

    add_index :consent_records, [:tenant_id, :student_id, :consent_type], name: "idx_consent_unique"
  end
end
```

Model `apps/core/app/models/consent_record.rb`:
- `include TenantScoped`
- `belongs_to :student, class_name: "User"`
- `belongs_to :guardian, class_name: "User", optional: true`
- Validates consent_type inclusion in `%w[coppa data_collection ai_usage photo_release]`
- Validates status inclusion in `%w[pending granted denied revoked]`
- Scope `active` — `where(status: "granted")`
- Instance method `revoke!(revoked_by:)` — sets status to revoked, records timestamp

### 4. Create Student Record Access Log

Create `apps/core/app/models/concerns/student_record_trackable.rb`:

```ruby
module StudentRecordTrackable
  extend ActiveSupport::Concern

  included do
    after_find :track_record_access, if: -> { Current.user.present? && student_record? }
  end

  private

  def track_record_access
    return if Current.user.id == student_user_id # Students viewing own records don't count

    AuditLogger.log(
      actor: Current.user,
      action: "student_record_access",
      target: self,
      metadata: { student_id: student_user_id, record_type: self.class.name },
    )
  end

  def student_record?
    respond_to?(:user_id) || respond_to?(:student_id)
  end

  def student_user_id
    respond_to?(:student_id) ? student_id : user_id
  end
end
```

Include in Submission, QuizAttempt, and GuardianLink models.

### 5. Create Data Compliance API Endpoints

Create `apps/core/app/controllers/api/v1/data_compliance_controller.rb`:

```ruby
class Api::V1::DataComplianceController < ApplicationController
  before_action :authorize_compliance

  # GET /api/v1/data_compliance/students/:student_id/export
  def export
    student = User.find(params[:student_id])
    data = StudentDataExportService.new(student).call
    render json: data
  end

  # GET /api/v1/data_compliance/students/:student_id/export.zip
  def export_zip
    student = User.find(params[:student_id])
    DataExportJob.perform_later(student.id, Current.user.id, Current.tenant.id)
    render json: { status: "queued", message: "Export is being prepared. You will be notified when ready." }
  end

  # GET /api/v1/data_compliance/students/:student_id/deletion_preview
  def deletion_preview
    student = User.find(params[:student_id])
    preview = StudentDataDeletionService.new(student, requested_by: Current.user).preview
    render json: preview
  end

  # POST /api/v1/data_compliance/students/:student_id/delete
  def delete_student_data
    student = User.find(params[:student_id])
    StudentDataDeletionService.new(student, requested_by: Current.user).execute!
    render json: { status: "completed", message: "Student data has been deleted/anonymized." }
  end

  # GET /api/v1/data_compliance/students/:student_id/access_log
  def access_log
    student = User.find(params[:student_id])
    logs = AuditLog.where(
      "metadata->>'student_id' = ? AND action = ?",
      student.id.to_s, "student_record_access"
    ).order(created_at: :desc).limit(100)
    render json: logs
  end

  # GET /api/v1/data_compliance/consent
  def consent_index
    records = ConsentRecord.where(tenant: Current.tenant)
    records = records.where(student_id: params[:student_id]) if params[:student_id]
    render json: records
  end

  # POST /api/v1/data_compliance/consent
  def consent_create
    record = ConsentRecord.new(consent_params)
    record.tenant = Current.tenant
    record.save!
    render json: record, status: :created
  end

  private

  def authorize_compliance
    authorize :data_compliance, :manage?
  end

  def consent_params
    params.require(:consent_record).permit(
      :student_id, :guardian_id, :consent_type, :status,
      :granted_at, :granted_method, :notes
    )
  end
end
```

### 6. Create Data Export Background Job

Create `apps/core/app/jobs/data_export_job.rb`:
- Generates complete student data export as JSON
- Creates a downloadable ZIP file via Active Storage
- Notifies the requesting admin when complete
- Auto-deletes the export file after 24 hours

### 7. Build Data Compliance Admin Page

Create `apps/web/src/app/admin/compliance/page.tsx`:

**Layout:**
- **Student Search** — Search by name/email to find a student
- **Student Data Panel** — Once selected, shows:
  - Export Data button (downloads JSON/ZIP)
  - Access Log table (who accessed this student's records, when)
  - Consent Records section (status per consent type, grant/revoke buttons)
  - Delete Student Data button (opens confirmation modal with preview counts)

**Consent Management Section:**
- Filter by consent type, status
- Bulk grant/revoke for a class or grade level
- CSV export of consent status report

**Data Inventory Section:**
- Static page listing all personal data fields collected, purpose, retention period
- Required for FERPA compliance audits

### 8. Create Consent Management Page for Guardians

Create `apps/web/src/app/guardian/consent/page.tsx`:
- List of consent requests for each linked student
- Grant/deny buttons per consent type
- Revoke previously granted consent
- View what data is collected (transparency)

### 9. Add Tests

**Backend:**
- `apps/core/spec/services/student_data_export_service_spec.rb`
  - Exports all data categories
  - Scoped to single student (no data leakage)
  - Handles student with no data gracefully

- `apps/core/spec/services/student_data_deletion_service_spec.rb`
  - Preview returns correct counts
  - Execute anonymizes submissions and quiz attempts
  - Execute deletes messages and discussion posts
  - Execute anonymizes user record
  - Records audit log entry
  - Runs in transaction (rollback on error)

- `apps/core/spec/models/consent_record_spec.rb`
  - Validates consent_type and status
  - Revoke method works correctly
  - Tenant scoping

- `apps/core/spec/requests/api/v1/data_compliance_controller_spec.rb`
  - Admin can export student data
  - Admin can preview deletion
  - Admin can execute deletion
  - Teacher cannot access compliance endpoints
  - Consent CRUD works

**Frontend:**
- `apps/web/src/app/admin/compliance/page.test.tsx`
  - Student search renders results
  - Export button triggers download
  - Deletion modal shows preview counts
  - Consent records display

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/student_data_export_service.rb` | Complete student data export |
| `apps/core/app/services/student_data_deletion_service.rb` | FERPA-compliant data deletion |
| `apps/core/db/migrate/YYYYMMDD_create_consent_records.rb` | Consent tracking table |
| `apps/core/app/models/consent_record.rb` | Consent model |
| `apps/core/app/models/concerns/student_record_trackable.rb` | Access tracking concern |
| `apps/core/app/controllers/api/v1/data_compliance_controller.rb` | Compliance API |
| `apps/core/app/policies/data_compliance_policy.rb` | Admin-only policy |
| `apps/core/app/policies/consent_record_policy.rb` | Consent access policy |
| `apps/core/app/serializers/consent_record_serializer.rb` | Consent serializer |
| `apps/core/app/jobs/data_export_job.rb` | Async export generation |
| `apps/web/src/app/admin/compliance/page.tsx` | Admin compliance dashboard |
| `apps/web/src/app/guardian/consent/page.tsx` | Guardian consent management |
| `apps/core/spec/services/student_data_export_service_spec.rb` | Export tests |
| `apps/core/spec/services/student_data_deletion_service_spec.rb` | Deletion tests |
| `apps/core/spec/models/consent_record_spec.rb` | Model tests |
| `apps/core/spec/requests/api/v1/data_compliance_controller_spec.rb` | API tests |
| `apps/web/src/app/admin/compliance/page.test.tsx` | UI tests |
| `apps/core/spec/factories/consent_records.rb` | Factory |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add compliance routes |
| `apps/core/app/models/submission.rb` | Include StudentRecordTrackable |
| `apps/core/app/models/quiz_attempt.rb` | Include StudentRecordTrackable |
| `apps/core/app/models/guardian_link.rb` | Include StudentRecordTrackable |
| `apps/core/app/models/user.rb` | Add deleted_at field handling, consent associations |
| `apps/web/src/components/AppShell.tsx` | Add "Compliance" link under Admin nav |

---

## Definition of Done

- [ ] Student data export generates complete JSON with all data categories
- [ ] Student data deletion anonymizes records and deletes personal content in a transaction
- [ ] Deletion preview shows impact counts before execution
- [ ] ConsentRecord model tracks COPPA and other consent types per student
- [ ] Student record access is tracked via AuditLogger for FERPA compliance
- [ ] Admin compliance page allows search, export, deletion, and consent management
- [ ] Guardian consent page allows parents to grant/revoke consent
- [ ] All data queries are tenant-scoped
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
