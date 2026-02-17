# CODEX_LESSON_PLAN_PDF_EXPORT — Standalone Lesson Plan PDF Export

**Priority:** P1
**Effort:** Small (2–3 hours)
**Spec Refs:** PRD-9 (Phase 1 — PDF export), TECH-2.7 (Background Jobs — PDF exports)
**Depends on:** None

---

## Problem

Unit plans can be exported to PDF via `PdfExportJob`, but individual lesson plans cannot be exported independently. Teachers need to share or print single lessons without exporting the entire unit.

Current state:
- `PdfExportJob` exists and generates PDFs for `UnitPlan` records
- Lessons are included as sections within the unit PDF
- `LessonPlan` model has NO `has_one_attached :exported_pdf`
- `LessonPlansController` has NO `export_pdf` action

---

## Tasks

### 1. Add ActiveStorage Attachment to LessonPlan

Update `apps/core/app/models/lesson_plan.rb`:
```ruby
has_one_attached :exported_pdf
```

### 2. Create LessonPdfExportJob

Create `apps/core/app/jobs/lesson_pdf_export_job.rb`:

```ruby
class LessonPdfExportJob < ApplicationJob
  queue_as :default

  def perform(lesson_plan_id)
    lesson = LessonPlan.find(lesson_plan_id)
    version = lesson.current_version || lesson.lesson_versions.order(version_number: :desc).first
    return unless version

    pdf = Prawn::Document.new do |doc|
      doc.text lesson.title, size: 24, style: :bold
      doc.move_down 8
      doc.text "Version #{version.version_number}", size: 12, color: "666666"
      doc.move_down 4
      doc.text "Duration: #{version.duration_minutes} minutes" if version.duration_minutes
      doc.move_down 16

      if version.objectives.present?
        doc.text "Objectives", size: 16, style: :bold
        doc.move_down 4
        doc.text version.objectives
        doc.move_down 12
      end

      if version.activities.present?
        doc.text "Activities", size: 16, style: :bold
        doc.move_down 4
        doc.text version.activities
        doc.move_down 12
      end

      if version.materials.present?
        doc.text "Materials", size: 16, style: :bold
        doc.move_down 4
        doc.text version.materials
        doc.move_down 12
      end

      if version.assessment_notes.present?
        doc.text "Assessment Notes", size: 16, style: :bold
        doc.move_down 4
        doc.text version.assessment_notes
      end
    end

    lesson.exported_pdf.attach(
      io: StringIO.new(pdf.render),
      filename: "#{lesson.title.parameterize}-lesson.pdf",
      content_type: "application/pdf"
    )
  end
end
```

### 3. Add Controller Actions

Add to `apps/core/app/controllers/api/v1/lesson_plans_controller.rb`:

```ruby
# POST /api/v1/lesson_plans/:id/export_pdf
def export_pdf
  authorize @lesson_plan
  LessonPdfExportJob.perform_later(@lesson_plan.id)
  render json: { status: "queued" }
end

# GET /api/v1/lesson_plans/:id/export_pdf_status
def export_pdf_status
  authorize @lesson_plan
  if @lesson_plan.exported_pdf.attached?
    render json: { status: "ready", download_url: rails_blob_url(@lesson_plan.exported_pdf) }
  else
    render json: { status: "pending" }
  end
end
```

### 4. Add Routes

Add to routes.rb under lesson_plans:
```ruby
member do
  post :export_pdf
  get :export_pdf_status
end
```

### 5. Add Frontend Export Button

Add "Export PDF" button to lesson editor page (`apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx`) that triggers export and polls for completion.

### 6. Add Tests

- `apps/core/spec/jobs/lesson_pdf_export_job_spec.rb`
- Update `apps/core/spec/requests/api/v1/lesson_plans_controller_spec.rb`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/jobs/lesson_pdf_export_job.rb` | Lesson PDF generation |
| `apps/core/spec/jobs/lesson_pdf_export_job_spec.rb` | Job spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/models/lesson_plan.rb` | Add exported_pdf attachment |
| `apps/core/app/controllers/api/v1/lesson_plans_controller.rb` | Add export actions |
| `apps/core/config/routes.rb` | Add export routes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` | Add export button |

---

## Definition of Done

- [ ] LessonPlan has `has_one_attached :exported_pdf`
- [ ] LessonPdfExportJob generates PDF with title, version, objectives, activities, materials
- [ ] POST export_pdf queues job
- [ ] GET export_pdf_status returns download URL when ready
- [ ] Frontend has export button with polling
- [ ] All specs pass
