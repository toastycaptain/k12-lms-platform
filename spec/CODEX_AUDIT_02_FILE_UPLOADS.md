# CODEX_AUDIT_02 — File Upload Hardening

**Priority:** CRITICAL
**Effort:** 2–3 hours
**Depends On:** None
**Branch:** `audit/02-file-uploads`

---

## Findings

The security audit found:

1. **No content-type validation on user uploads** — `Submission` model has `has_one_attached :attachment` with zero validation. The `submissions_controller.rb:146` permits `:attachment` directly. Users can upload `.exe`, `.sh`, `.php`, or any file type.
2. **No file size limits** — No maximum file size enforced. A user could upload multi-GB files, filling disk or S3 storage.
3. **System-generated attachments also unvalidated** — `LessonPlan`, `UnitPlan`, `QuestionBank` have attached PDFs/QTI exports. While system-generated (lower risk), validation is good defense-in-depth.

---

## Fixes

### 1. Create AttachmentValidatable Concern

**File: `apps/core/app/models/concerns/attachment_validatable.rb`**

```ruby
module AttachmentValidatable
  extend ActiveSupport::Concern

  ALLOWED_IMAGE_TYPES = %w[
    image/jpeg
    image/png
    image/gif
    image/webp
  ].freeze

  ALLOWED_DOCUMENT_TYPES = %w[
    application/pdf
    application/msword
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    application/vnd.ms-powerpoint
    application/vnd.openxmlformats-officedocument.presentationml.presentation
    text/plain
    text/csv
    text/html
    application/zip
    application/x-zip-compressed
  ].freeze

  ALLOWED_SUBMISSION_TYPES = (ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES).freeze

  ALLOWED_EXPORT_TYPES = %w[
    application/pdf
    application/xml
    text/xml
    application/zip
  ].freeze

  MAX_SUBMISSION_SIZE = 50.megabytes
  MAX_EXPORT_SIZE = 100.megabytes

  DANGEROUS_EXTENSIONS = %w[
    .exe .bat .cmd .com .msi .scr .pif .vbs .vbe .js .jse
    .ws .wsf .wsc .wsh .ps1 .ps1xml .ps2 .ps2xml .psc1 .psc2
    .msh .msh1 .msh2 .mshxml .msh1xml .msh2xml .inf .reg
    .rgs .sct .shb .shs .lnk .dll .so .dylib .sh .bash .php
    .jsp .asp .aspx .cgi .py .rb .pl
  ].freeze

  class_methods do
    def validates_attachment(attribute, content_types: ALLOWED_SUBMISSION_TYPES, max_size: MAX_SUBMISSION_SIZE)
      validate :"validate_#{attribute}_attachment"

      define_method(:"validate_#{attribute}_attachment") do
        attachment = send(attribute)
        return unless attachment.attached?

        blob = attachment.blob

        # Check content type
        unless content_types.include?(blob.content_type)
          errors.add(attribute, "has an unsupported file type (#{blob.content_type}). Allowed: #{content_types.join(', ')}")
        end

        # Check file size
        if blob.byte_size > max_size
          errors.add(attribute, "is too large (#{(blob.byte_size / 1.megabyte.to_f).round(1)}MB). Maximum: #{(max_size / 1.megabyte.to_f).round(0)}MB")
        end

        # Check dangerous extensions
        filename = blob.filename.to_s.downcase
        extension = File.extname(filename)
        if DANGEROUS_EXTENSIONS.include?(extension)
          errors.add(attribute, "has a dangerous file extension (#{extension}). This file type is not allowed.")
        end
      end
    end
  end
end
```

### 2. Apply to Submission Model

**File: `apps/core/app/models/submission.rb`**

Find the `has_one_attached :attachment` line and add validation below it:

```ruby
include AttachmentValidatable
validates_attachment :attachment,
  content_types: AttachmentValidatable::ALLOWED_SUBMISSION_TYPES,
  max_size: 50.megabytes
```

### 3. Apply to LessonPlan Model

**File: `apps/core/app/models/lesson_plan.rb`**

Find `has_one_attached :exported_pdf` and add:

```ruby
include AttachmentValidatable
validates_attachment :exported_pdf,
  content_types: %w[application/pdf],
  max_size: 100.megabytes
```

### 4. Apply to UnitPlan Model

**File: `apps/core/app/models/unit_plan.rb`**

Find `has_one_attached :exported_pdf` and add:

```ruby
include AttachmentValidatable
validates_attachment :exported_pdf,
  content_types: %w[application/pdf],
  max_size: 100.megabytes
```

### 5. Apply to QuestionBank Model

**File: `apps/core/app/models/question_bank.rb`**

Find `has_one_attached :qti_export` and add:

```ruby
include AttachmentValidatable
validates_attachment :qti_export,
  content_types: AttachmentValidatable::ALLOWED_EXPORT_TYPES,
  max_size: 100.megabytes
```

### 6. Scan for Any Other Active Storage Attachments

Run this command to find ALL models with attachments:

```bash
grep -rn "has_one_attached\|has_many_attached" apps/core/app/models/
```

For every result not already covered above, add the `AttachmentValidatable` concern with appropriate content types. If a model uses `has_many_attached`, the validation method needs to iterate over the collection — add this variant to the concern if needed:

```ruby
class_methods do
  def validates_attachments(attribute, content_types: ALLOWED_SUBMISSION_TYPES, max_size: MAX_SUBMISSION_SIZE)
    validate :"validate_#{attribute}_attachments"

    define_method(:"validate_#{attribute}_attachments") do
      attachments = send(attribute)
      return unless attachments.attached?

      attachments.each do |attachment|
        blob = attachment.blob

        unless content_types.include?(blob.content_type)
          errors.add(attribute, "contains a file with unsupported type (#{blob.content_type})")
        end

        if blob.byte_size > max_size
          errors.add(attribute, "contains a file that is too large (#{blob.filename}: #{(blob.byte_size / 1.megabyte.to_f).round(1)}MB)")
        end

        filename = blob.filename.to_s.downcase
        extension = File.extname(filename)
        if DANGEROUS_EXTENSIONS.include?(extension)
          errors.add(attribute, "contains a file with dangerous extension (#{extension})")
        end
      end
    end
  end
end
```

### 7. Add Content-Type Verification on Download

Ensure that when files are served, the `Content-Disposition` header forces download (not inline rendering) for non-image types. Check if Active Storage is configured with `disposition: :attachment`. If a custom download controller exists, verify it sets:

```ruby
response.headers["Content-Disposition"] = "attachment; filename=\"#{blob.filename}\""
response.headers["X-Content-Type-Options"] = "nosniff"
```

If Active Storage serves files via redirect (default S3 behavior), this is handled by S3 content-type headers. Verify `storage.yml` sets proper content-type on upload.

### 8. Write Tests

**File: `apps/core/spec/models/concerns/attachment_validatable_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe AttachmentValidatable, type: :model do
  let!(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "content type validation" do
    it "allows PDF attachments on submissions" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, student: student, tenant: tenant)
      submission.attachment.attach(
        io: StringIO.new("fake pdf"),
        filename: "homework.pdf",
        content_type: "application/pdf"
      )

      expect(submission).to be_valid
    end

    it "rejects executable files" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, student: student, tenant: tenant)
      submission.attachment.attach(
        io: StringIO.new("malicious content"),
        filename: "malware.exe",
        content_type: "application/x-msdownload"
      )

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("unsupported file type")
    end

    it "rejects files exceeding size limit" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, student: student, tenant: tenant)

      # Create a blob that reports a large size
      blob = ActiveStorage::Blob.create_before_direct_upload!(
        filename: "large.pdf",
        byte_size: 60.megabytes,
        checksum: "fake",
        content_type: "application/pdf"
      )
      submission.attachment.attach(blob)

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("too large")
    end

    it "rejects dangerous file extensions" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, student: student, tenant: tenant)
      submission.attachment.attach(
        io: StringIO.new("#!/bin/bash\nrm -rf /"),
        filename: "script.sh",
        content_type: "text/plain"
      )

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("dangerous file extension")
    end

    it "allows common document types" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      %w[application/pdf image/jpeg image/png text/plain text/csv].each do |content_type|
        submission = build(:submission, assignment: assignment, student: student, tenant: tenant)
        ext = { "application/pdf" => "pdf", "image/jpeg" => "jpg", "image/png" => "png", "text/plain" => "txt", "text/csv" => "csv" }[content_type]
        submission.attachment.attach(
          io: StringIO.new("content"),
          filename: "file.#{ext}",
          content_type: content_type
        )
        expect(submission).to be_valid, "Expected #{content_type} to be allowed but it was rejected"
      end
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/models/concerns/attachment_validatable.rb` | File upload validation concern |
| `apps/core/spec/models/concerns/attachment_validatable_spec.rb` | Upload validation tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/app/models/submission.rb` | Add `include AttachmentValidatable` and `validates_attachment :attachment` |
| `apps/core/app/models/lesson_plan.rb` | Add `include AttachmentValidatable` and `validates_attachment :exported_pdf` |
| `apps/core/app/models/unit_plan.rb` | Add `include AttachmentValidatable` and `validates_attachment :exported_pdf` |
| `apps/core/app/models/question_bank.rb` | Add `include AttachmentValidatable` and `validates_attachment :qti_export` |
| Any other model with `has_one_attached`/`has_many_attached` | Add appropriate validation |

## Definition of Done

- [ ] AttachmentValidatable concern created with content-type whitelist, size limit, and dangerous extension blocklist
- [ ] Submission model rejects non-whitelisted file types
- [ ] Submission model rejects files over 50MB
- [ ] Submission model rejects dangerous extensions (.exe, .sh, .php, etc.)
- [ ] All system-generated attachments (PDF, QTI) validated with appropriate types
- [ ] Every `has_one_attached`/`has_many_attached` in the codebase has validation applied
- [ ] All tests pass: `bundle exec rspec`
- [ ] `bundle exec rubocop` passes
