# CODEX_CONTENT_VERSION_DIFF — Version Comparison Views for Plans, Lessons, and Templates

**Priority:** P0
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-9 (Unit/Lesson versioning), PRD-10 (Templates), TECH-2.4 (unit_versions, lesson_versions, template_versions, question_versions)
**Depends on:** None

---

## Problem

The platform has a full versioning system — unit plans, lessons, templates, and questions all create new versions on save. However:

1. **No diff view** — teachers cannot see what changed between version N and version N-1
2. **No version history list** — no UI to browse all versions of a unit/lesson/template with timestamps and authors
3. **No rollback** — the `current_version_id` pattern supports rollback, but no UI exposes it
4. **No change attribution** — versions have `created_by` but this isn't surfaced to users
5. **Curriculum leads can't review changes** — the approvals workflow exists but reviewers have no way to see what was modified since the last approved version

This is critical for curriculum coordination. When a teacher modifies a unit plan, the curriculum lead needs to quickly see "what exactly changed" before approving.

---

## Tasks

### 1. Create Version Diff Service

Create `apps/core/app/services/version_diff_service.rb`:

```ruby
class VersionDiffService
  def initialize(version_a, version_b)
    @version_a = version_a  # older
    @version_b = version_b  # newer
  end

  def call
    {
      version_a: { id: @version_a.id, version_number: @version_a.version_number, created_at: @version_a.created_at },
      version_b: { id: @version_b.id, version_number: @version_b.version_number, created_at: @version_b.created_at },
      changes: compute_changes,
      summary: change_summary,
    }
  end

  private

  def compute_changes
    diffable_fields.each_with_object([]) do |field, changes|
      old_val = @version_a.send(field)
      new_val = @version_b.send(field)
      next if old_val == new_val

      changes << {
        field: field.to_s,
        label: field.to_s.humanize,
        type: field_type(field),
        old_value: old_val,
        new_value: new_val,
        diff: text_diff(old_val, new_val),
      }
    end
  end

  def text_diff(old_text, new_text)
    return nil unless old_text.is_a?(String) && new_text.is_a?(String)
    # Line-by-line diff
    old_lines = old_text.to_s.split("\n")
    new_lines = new_text.to_s.split("\n")
    compute_line_diff(old_lines, new_lines)
  end

  def compute_line_diff(old_lines, new_lines)
    # Simple LCS-based diff producing add/remove/unchanged markers
    result = []
    lcs = longest_common_subsequence(old_lines, new_lines)
    old_idx = 0
    new_idx = 0
    lcs_idx = 0

    while old_idx < old_lines.size || new_idx < new_lines.size
      if lcs_idx < lcs.size && old_idx < old_lines.size && old_lines[old_idx] == lcs[lcs_idx]
        if new_idx < new_lines.size && new_lines[new_idx] == lcs[lcs_idx]
          result << { type: "unchanged", content: lcs[lcs_idx] }
          old_idx += 1
          new_idx += 1
          lcs_idx += 1
        else
          result << { type: "added", content: new_lines[new_idx] }
          new_idx += 1
        end
      elsif old_idx < old_lines.size
        result << { type: "removed", content: old_lines[old_idx] }
        old_idx += 1
      elsif new_idx < new_lines.size
        result << { type: "added", content: new_lines[new_idx] }
        new_idx += 1
      end
    end

    result
  end

  def diffable_fields
    # Determined by version model type
    case @version_a
    when UnitVersion
      %i[title description objectives essential_questions content]
    when LessonVersion
      %i[title description objectives activities content duration_minutes]
    when TemplateVersion
      %i[title description structure content]
    when QuestionVersion
      %i[content question_type choices correct_answer explanation points]
    else
      []
    end
  end

  def change_summary
    changes = compute_changes
    {
      total_fields_changed: changes.size,
      fields_changed: changes.map { |c| c[:label] },
    }
  end
end
```

### 2. Create Version History API Endpoints

Add to each versioned resource controller:

```ruby
# GET /api/v1/unit_plans/:id/versions
def versions
  unit_plan = UnitPlan.find(params[:id])
  authorize unit_plan, :show?
  versions = unit_plan.unit_versions.order(version_number: :desc)
  render json: versions, each_serializer: VersionSummarySerializer
end

# GET /api/v1/unit_plans/:id/versions/:version_id/diff
def diff
  unit_plan = UnitPlan.find(params[:id])
  authorize unit_plan, :show?
  version_b = unit_plan.unit_versions.find(params[:version_id])
  version_a = unit_plan.unit_versions.where("version_number < ?", version_b.version_number).order(version_number: :desc).first

  if version_a.nil?
    render json: { error: "No previous version to compare" }, status: :unprocessable_entity
    return
  end

  render json: VersionDiffService.new(version_a, version_b).call
end

# POST /api/v1/unit_plans/:id/versions/:version_id/rollback
def rollback
  unit_plan = UnitPlan.find(params[:id])
  authorize unit_plan, :update?
  version = unit_plan.unit_versions.find(params[:version_id])
  unit_plan.update!(current_version: version)
  render json: unit_plan
end
```

Add equivalent endpoints for lesson_plans, templates, and questions.

### 3. Create Version Summary Serializer

Create `apps/core/app/serializers/version_summary_serializer.rb`:
- id, version_number, created_at, created_by (name + email), is_current
- Change summary vs. previous version (fields changed count)

### 4. Build Version History Panel Component

Create `apps/web/src/components/VersionHistoryPanel.tsx`:

```typescript
interface VersionHistoryPanelProps {
  resourceType: "unit_plans" | "lesson_plans" | "templates" | "questions";
  resourceId: string;
}
```

**Layout:**
- Slide-out right panel (similar pattern to AiAssistantPanel)
- Version list: version number, author, date, fields changed badge
- Current version highlighted
- Click any version to view full content
- "Compare" button between any two versions opens diff view

### 5. Build Diff View Component

Create `apps/web/src/components/VersionDiff.tsx`:

```typescript
interface VersionDiffProps {
  diff: {
    version_a: { id: string; version_number: number; created_at: string };
    version_b: { id: string; version_number: number; created_at: string };
    changes: Array<{
      field: string;
      label: string;
      old_value: unknown;
      new_value: unknown;
      diff: Array<{ type: "added" | "removed" | "unchanged"; content: string }> | null;
    }>;
  };
}
```

**Layout:**
- Header: "Version N → Version M" with dates and authors
- Per-field sections:
  - Field label header
  - For text fields: side-by-side or inline diff with red (removed) and green (added) highlighting
  - For JSON fields (choices, metadata): formatted JSON diff
  - For simple values (points, duration): "Changed from X to Y"
- Summary bar at top: "N fields changed"

### 6. Add Rollback Confirmation

Create rollback flow in VersionHistoryPanel:
- "Restore this version" button on each non-current version
- Confirmation modal: "This will set version N as the current version. A new version will not be created. Continue?"
- After rollback, refresh the version list and notify via toast

### 7. Integrate into Editor Pages

Add a "History" button to existing editor pages:
- `/plan/units/[id]` — Unit planner page
- `/plan/units/[id]/lessons/[lessonId]` — Lesson editor page
- `/plan/templates/[templateId]` — Template editor page

Button opens VersionHistoryPanel as a right-side drawer.

### 8. Add Tests

**Backend:**
- `apps/core/spec/services/version_diff_service_spec.rb`
  - Detects changed text fields
  - Generates line-by-line diff for text content
  - Handles JSON field changes (choices array)
  - Returns empty changes array when versions are identical
  - Works for UnitVersion, LessonVersion, TemplateVersion, QuestionVersion

- `apps/core/spec/requests/api/v1/unit_plan_versions_spec.rb`
  - Lists versions in reverse chronological order
  - Diff endpoint returns changes between versions
  - Rollback updates current_version_id
  - Authorization: only users with show? access can view versions
  - 422 when diffing against first version with no predecessor

**Frontend:**
- `apps/web/src/components/__tests__/VersionHistoryPanel.test.tsx`
  - Renders version list
  - Highlights current version
  - Clicking version triggers diff fetch

- `apps/web/src/components/__tests__/VersionDiff.test.tsx`
  - Renders field-level changes
  - Applies correct CSS classes for added/removed lines
  - Displays simple value changes

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/version_diff_service.rb` | Compute diff between two versions |
| `apps/core/app/serializers/version_summary_serializer.rb` | Version list serializer |
| `apps/web/src/components/VersionHistoryPanel.tsx` | Version history right panel |
| `apps/web/src/components/VersionDiff.tsx` | Side-by-side diff renderer |
| `apps/core/spec/services/version_diff_service_spec.rb` | Diff service tests |
| `apps/core/spec/requests/api/v1/unit_plan_versions_spec.rb` | Version API tests |
| `apps/web/src/components/__tests__/VersionHistoryPanel.test.tsx` | Panel tests |
| `apps/web/src/components/__tests__/VersionDiff.test.tsx` | Diff renderer tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/unit_plans_controller.rb` | Add versions, diff, rollback actions |
| `apps/core/app/controllers/api/v1/lesson_plans_controller.rb` | Add versions, diff, rollback actions |
| `apps/core/app/controllers/api/v1/templates_controller.rb` | Add versions, diff, rollback actions |
| `apps/core/config/routes.rb` | Add version routes nested under resources |
| `apps/web/src/app/plan/units/[id]/page.tsx` | Add History button |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` | Add History button |
| `apps/web/src/app/plan/templates/[templateId]/page.tsx` | Add History button |

---

## Definition of Done

- [ ] VersionDiffService computes field-level diffs for all versioned resource types
- [ ] Text content diffs use line-by-line comparison with add/remove/unchanged markers
- [ ] Version history endpoint returns all versions with author and date
- [ ] Diff endpoint returns structured changes between any two versions
- [ ] Rollback endpoint updates current_version_id
- [ ] VersionHistoryPanel renders as a right-side drawer on editor pages
- [ ] VersionDiff component displays changes with red/green highlighting
- [ ] Rollback shows confirmation modal and updates UI
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
