# CODEX_DRIVE_INTEGRATION_DEPTH — Deepen Google Drive Integration

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-9 (Drive attachments), PRD-20 (Google-Native workflow), PRD-13 (Google Integrations)
**Depends on:** None

---

## Problem

`GoogleDriveService` is 41 lines with only 3 methods: `create_document`, `create_presentation`, `get_file`. PRD-20 envisions a "Google-native experience" with the workflow: "Attach Drive → create Docs/Slides → assign via Classroom." Several capabilities are missing:

1. **No file sharing/permissions** — created documents aren't shared with students or co-teachers
2. **No folder organization** — no course-level or unit-level folders in Drive
3. **No file copying** — can't duplicate templates to student accounts
4. **No file type detection** — no logic to display appropriate icons or previews
5. **No bulk operations** — can't attach multiple files at once
6. **No file preview URLs** — can't generate embeddable preview links
7. **No token refresh handling** — `GoogleTokenService` exists but not integrated into drive retries

---

## Tasks

### 1. Expand GoogleDriveService

Add methods to `apps/core/app/services/google_drive_service.rb`:

```ruby
class GoogleDriveService
  # Existing methods (keep)
  # create_document, create_presentation, get_file

  # New: Share file with users
  def share_file(file_id, email:, role: "reader", type: "user")
    permission = Google::Apis::DriveV3::Permission.new(
      email_address: email,
      role: role,  # "reader", "writer", "commenter"
      type: type,  # "user", "group", "domain"
    )
    drive_service.create_permission(file_id, permission, send_notification_email: false)
  end

  # New: Share file with multiple users (batch)
  def share_file_batch(file_id, emails:, role: "reader")
    emails.each do |email|
      share_file(file_id, email: email, role: role)
    rescue Google::Apis::Error => e
      Rails.logger.warn("Failed to share #{file_id} with #{email}: #{e.message}")
    end
  end

  # New: Create course folder
  def create_folder(name, parent_id: nil)
    folder = Google::Apis::DriveV3::File.new(
      name: name,
      mime_type: "application/vnd.google-apps.folder",
      parents: parent_id ? [parent_id] : nil,
    )
    drive_service.create_file(folder, fields: "id, name, webViewLink")
  end

  # New: Copy file (for distributing templates to students)
  def copy_file(file_id, new_name:, folder_id: nil)
    copy = Google::Apis::DriveV3::File.new(
      name: new_name,
      parents: folder_id ? [folder_id] : nil,
    )
    drive_service.copy_file(file_id, copy, fields: "id, name, webViewLink, mimeType")
  end

  # New: List files in folder
  def list_files(folder_id: nil, query: nil, page_size: 50)
    q_parts = []
    q_parts << "'#{folder_id}' in parents" if folder_id
    q_parts << query if query
    q_parts << "trashed = false"

    drive_service.list_files(
      q: q_parts.join(" and "),
      page_size: page_size,
      fields: "files(id, name, mimeType, webViewLink, iconLink, thumbnailLink, modifiedTime, size)",
    )
  end

  # New: Generate preview/embed URL
  def preview_url(file_id)
    "https://drive.google.com/file/d/#{file_id}/preview"
  end

  # New: Generate file icon based on mime type
  def self.file_icon(mime_type)
    case mime_type
    when /document/ then "doc"
    when /spreadsheet/ then "sheet"
    when /presentation/ then "slide"
    when /form/ then "form"
    when /folder/ then "folder"
    when /pdf/ then "pdf"
    when /image/ then "image"
    when /video/ then "video"
    else "file"
    end
  end
end
```

### 2. Add Course Folder Management

Add methods to `GoogleClassroomService` or create a new concern:

When a course is created:
- Optionally create a Drive folder for the course
- Store folder ID in `courses.settings` JSONB field
- Create sub-folders: "Assignments", "Resources", "Student Work"

Add `CreateCourseFolderJob`:
```ruby
class CreateCourseFolderJob < ApplicationJob
  def perform(course_id)
    course = Course.find(course_id)
    user = course.created_by || User.joins(:user_roles).where(user_roles: { role: Role.find_by(name: "admin") }).first
    return unless user&.google_connected?

    drive = GoogleDriveService.new(user)
    folder = drive.create_folder(course.name)
    course.update!(settings: course.settings.merge("drive_folder_id" => folder.id))
  end
end
```

### 3. Add Assignment Distribution

When a teacher creates an assignment with a Drive template:
- Copy the template to each student's Drive
- Share the copy with the student as writer
- Track the copy in `resource_links` with the student's copy file ID

Create `DistributeAssignmentJob`:
```ruby
class DistributeAssignmentJob < ApplicationJob
  def perform(assignment_id)
    assignment = Assignment.find(assignment_id)
    template_link = assignment.resource_links.find_by(link_type: "template")
    return unless template_link

    teacher = assignment.course.sections.first&.enrollments&.find_by(role: "teacher")&.user
    return unless teacher&.google_connected?

    drive = GoogleDriveService.new(teacher)
    students = User.joins(enrollments: :section).where(sections: { course_id: assignment.course_id })

    students.find_each do |student|
      copy = drive.copy_file(
        template_link.url,
        new_name: "#{student.last_name} - #{assignment.title}",
      )
      drive.share_file(copy.id, email: student.email, role: "writer")

      ResourceLink.create!(
        tenant: Current.tenant,
        linkable: assignment,
        url: copy.web_view_link,
        title: copy.name,
        link_type: "student_copy",
        metadata: { student_id: student.id, file_id: copy.id },
      )
    end
  end
end
```

### 4. Enhance Drive Controller

Update `apps/core/app/controllers/api/v1/drive_controller.rb`:
- Add `share` action — share file with users
- Add `folder` action — create/list course folders
- Add `copy` action — copy file for distribution
- Add `preview` action — return preview URL

### 5. Enhance GoogleDrivePicker Component

Update `apps/web/src/components/GoogleDrivePicker.tsx`:
- Show file type icons based on MIME type
- Support multi-file selection
- Show file preview thumbnail
- Display file size and last modified date
- Add "Create New" dropdown (Doc, Sheet, Slide, Form)

### 6. Add Token Refresh Integration

Ensure `GoogleTokenService.refresh_if_needed!(user)` is called before every Drive API call. Add retry logic:

```ruby
def with_token_refresh(user)
  yield
rescue Google::Apis::AuthorizationError
  GoogleTokenService.refresh!(user)
  yield  # retry once
end
```

### 7. Add Tests

- `apps/core/spec/services/google_drive_service_spec.rb` — all new methods
- `apps/core/spec/jobs/create_course_folder_job_spec.rb`
- `apps/core/spec/jobs/distribute_assignment_job_spec.rb`
- `apps/core/spec/requests/api/v1/drive_controller_spec.rb` — new endpoints

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/jobs/create_course_folder_job.rb` | Create Drive folder for course |
| `apps/core/app/jobs/distribute_assignment_job.rb` | Distribute template to students |
| `apps/core/spec/jobs/create_course_folder_job_spec.rb` | Job spec |
| `apps/core/spec/jobs/distribute_assignment_job_spec.rb` | Job spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/services/google_drive_service.rb` | Add sharing, folders, copy, preview |
| `apps/core/app/controllers/api/v1/drive_controller.rb` | Add share, folder, copy endpoints |
| `apps/core/config/routes.rb` | Add drive routes |
| `apps/web/src/components/GoogleDrivePicker.tsx` | Multi-select, icons, preview |
| `apps/core/spec/services/google_drive_service_spec.rb` | Expanded tests |
| `apps/core/spec/requests/api/v1/drive_controller_spec.rb` | Expanded tests |

---

## Definition of Done

- [ ] GoogleDriveService supports sharing, folders, copy, list, and preview
- [ ] Token refresh integrated with retry logic
- [ ] Course folder creation job functional
- [ ] Assignment distribution job copies templates to students
- [ ] Drive controller has share, folder, copy, and preview endpoints
- [ ] GoogleDrivePicker supports multi-select and file type icons
- [ ] All specs pass
- [ ] No Rubocop violations
