# CODEX_STUDENT_PORTFOLIO — Student Work Portfolio and Learning Evidence Collection

**Priority:** P3
**Effort:** Large (10–14 hours)
**Spec Refs:** PRD-4 (Parent/Guardian secondary user), PRD-18 (Course Delivery — mastery), PRD-3 (Student primary user)
**Depends on:** CODEX_FERPA_DATA_COMPLIANCE (consent for sharing), CODEX_RESOURCE_LIBRARY (file management patterns)

---

## Problem

Students produce work across multiple courses — assignments, quizzes, discussion posts, projects — but there is no way to curate, showcase, or reflect on this work:

1. **No portfolio collection** — students cannot select their best work to showcase
2. **No reflection entries** — no way for students to write reflections on their learning process
3. **No standards-aligned evidence** — no way to connect portfolio items to standards and demonstrate mastery
4. **No guardian sharing** — parents cannot view curated student work (the guardian portal shows grades but not actual work)
5. **No export/download** — students transferring schools cannot take their portfolio with them
6. **No teacher feedback on portfolios** — no way for teachers to comment on portfolio entries or curate recommended pieces
7. **No portfolio templates** — teachers cannot define required portfolio entries for a course or project

---

## Tasks

### 1. Create Portfolio Models

Create migrations:

```ruby
class CreatePortfolioInfrastructure < ActiveRecord::Migration[8.0]
  def change
    create_table :portfolios do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description
      t.string :visibility, null: false, default: "private"  # "private", "guardians", "teachers", "school"
      t.string :status, null: false, default: "active"       # "active", "archived"
      t.string :portfolio_type, null: false, default: "personal"  # "personal", "course", "showcase"
      t.references :course, foreign_key: true                 # nil for personal portfolios
      t.timestamps
    end

    add_index :portfolios, [:tenant_id, :student_id]

    create_table :portfolio_entries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :portfolio, null: false, foreign_key: true
      t.string :title, null: false
      t.text :reflection                                       # Student's reflection on this work
      t.string :entry_type, null: false                        # "submission", "quiz_attempt", "file", "external_link", "text"
      t.references :submission, foreign_key: true              # Link to existing submission
      t.references :quiz_attempt, foreign_key: true            # Link to existing quiz attempt
      t.references :resource, foreign_key: true                # Link to uploaded file/resource
      t.string :external_url                                   # For external work links
      t.text :content                                          # For text-type entries
      t.integer :position, null: false, default: 0
      t.datetime :featured_at                                  # Teacher-featured flag
      t.timestamps
    end

    add_index :portfolio_entries, [:portfolio_id, :position]

    create_table :portfolio_entry_standards do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :portfolio_entry, null: false, foreign_key: true
      t.references :standard, null: false, foreign_key: true
      t.string :mastery_level, null: false, default: "approaching"  # "not_met", "approaching", "met", "exceeded"
      t.timestamps
    end

    add_index :portfolio_entry_standards, [:portfolio_entry_id, :standard_id], unique: true, name: "idx_entry_standard_unique"

    create_table :portfolio_comments do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :portfolio_entry, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false
      t.timestamps
    end

    create_table :portfolio_templates do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :course, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.jsonb :required_entries, null: false, default: []
      # Each entry: { title, entry_type, description, standard_ids }
      t.timestamps
    end
  end
end
```

### 2. Create Portfolio Models

Model `apps/core/app/models/portfolio.rb`:
- `include TenantScoped`
- `belongs_to :student, class_name: "User"`
- `belongs_to :course, optional: true`
- `has_many :portfolio_entries, -> { order(position: :asc) }, dependent: :destroy`
- Validates visibility inclusion
- Scope `visible_to_guardians` — `where(visibility: %w[guardians teachers school])`

Model `apps/core/app/models/portfolio_entry.rb`:
- `include TenantScoped`
- `belongs_to :portfolio`
- `belongs_to :submission, optional: true`
- `belongs_to :quiz_attempt, optional: true`
- `belongs_to :resource, optional: true`
- `has_many :portfolio_entry_standards, dependent: :destroy`
- `has_many :standards, through: :portfolio_entry_standards`
- `has_many :portfolio_comments, dependent: :destroy`
- Validates entry_type inclusion in `%w[submission quiz_attempt file external_link text]`
- Custom validation: referenced association must exist for entry_type

Model `apps/core/app/models/portfolio_comment.rb`:
- `include TenantScoped`
- `belongs_to :portfolio_entry`
- `belongs_to :author, class_name: "User"`

Model `apps/core/app/models/portfolio_template.rb`:
- `include TenantScoped`
- `belongs_to :created_by, class_name: "User"`
- `belongs_to :course, optional: true`

### 3. Create Portfolio API Endpoints

Create `apps/core/app/controllers/api/v1/portfolios_controller.rb`:

```ruby
class Api::V1::PortfoliosController < ApplicationController
  # GET /api/v1/portfolios
  def index
    authorize Portfolio
    portfolios = policy_scope(Portfolio).includes(:portfolio_entries)
    render json: portfolios
  end

  # POST /api/v1/portfolios
  def create
    authorize Portfolio
    portfolio = Portfolio.new(portfolio_params)
    portfolio.student = Current.user
    portfolio.tenant = Current.tenant
    portfolio.save!
    render json: portfolio, status: :created
  end

  # POST /api/v1/portfolios/:id/entries
  def add_entry
    portfolio = Portfolio.find(params[:id])
    authorize portfolio, :update?
    entry = portfolio.portfolio_entries.create!(entry_params.merge(tenant: Current.tenant))
    render json: entry, status: :created
  end

  # POST /api/v1/portfolios/:id/entries/:entry_id/reflect
  def reflect
    portfolio = Portfolio.find(params[:id])
    authorize portfolio, :update?
    entry = portfolio.portfolio_entries.find(params[:entry_id])
    entry.update!(reflection: params[:reflection])
    render json: entry
  end

  # POST /api/v1/portfolios/:id/entries/:entry_id/align_standards
  def align_standards
    portfolio = Portfolio.find(params[:id])
    authorize portfolio, :update?
    entry = portfolio.portfolio_entries.find(params[:entry_id])
    params[:standards].each do |std|
      entry.portfolio_entry_standards.find_or_create_by!(
        standard_id: std[:standard_id], tenant: Current.tenant
      ) { |pes| pes.mastery_level = std[:mastery_level] }
    end
    render json: entry
  end

  # POST /api/v1/portfolios/:id/entries/:entry_id/feature
  def feature
    portfolio = Portfolio.find(params[:id])
    authorize portfolio, :feature?  # Teacher-only action
    entry = portfolio.portfolio_entries.find(params[:entry_id])
    entry.update!(featured_at: Time.current)
    render json: entry
  end

  # GET /api/v1/portfolios/:id/export
  def export
    portfolio = Portfolio.find(params[:id])
    authorize portfolio, :export?
    data = PortfolioExportService.new(portfolio).call
    render json: data
  end
end
```

### 4. Create Portfolio Policy

Create `apps/core/app/policies/portfolio_policy.rb`:
- Students can CRUD their own portfolios
- Teachers can view portfolios for students in their courses, add comments, feature entries
- Guardians can view portfolios with visibility "guardians" or higher for linked students
- Admin can view all portfolios in tenant
- `export?` — student (own) or guardian (linked student) or admin

### 5. Build Student Portfolio Page

Create `apps/web/src/app/learn/portfolio/page.tsx`:

**Layout:**
- **Portfolio list** — Cards showing each portfolio (personal, per-course) with entry count and last updated
- **Create Portfolio** button — opens modal (title, description, type, course if applicable, visibility)

Create `apps/web/src/app/learn/portfolio/[portfolioId]/page.tsx`:

**Layout:**
- Portfolio header: title, description, visibility badge, entry count
- **Entry Grid** — Cards for each entry showing:
  - Entry type icon (assignment, quiz, file, link, text)
  - Title and thumbnail/preview
  - Standards badges (color-coded by mastery level)
  - Reflection excerpt
  - Teacher comments count
  - Featured badge (if teacher-featured)
- **Add Entry** button — modal with:
  - Select from recent submissions (fetched from student's courses)
  - Select from quiz results
  - Upload file (uses Resource Library pattern)
  - Add external link
  - Write text entry
- **Reflection Editor** — inline editable text area per entry
- **Standards Alignment** — select standards and self-assess mastery level
- **Reorder** — drag-and-drop to reorder entries
- **Share Settings** — visibility toggle (private, guardians, teachers, school)

### 6. Build Portfolio Entry Detail Page

Create `apps/web/src/app/learn/portfolio/[portfolioId]/entries/[entryId]/page.tsx`:

**Layout:**
- Full entry view: title, content/link/submission display
- Reflection (editable by student)
- Standards alignment with mastery levels
- Comments thread (teachers and student)
- Related grade/feedback from original submission (if linked)

### 7. Build Guardian Portfolio View

Update `apps/web/src/app/guardian/students/[studentId]/portfolio/page.tsx`:
- Read-only view of shared portfolios
- Entry cards with reflections
- Comment capability (guardians can comment)
- Download/export button

### 8. Build Teacher Portfolio Review View

Create `apps/web/src/app/teach/courses/[courseId]/portfolios/page.tsx`:
- List all student portfolios for the course
- Per-student row: student name, entry count, standards coverage, last updated
- Click to view student's portfolio
- "Feature" button on entries
- Add comments

### 9. Create Portfolio Export Service

Create `apps/core/app/services/portfolio_export_service.rb`:
- Generates a complete portfolio package as JSON (for data portability)
- Includes all entries, reflections, standards alignments, and comments
- File attachments included as download URLs (time-limited signed URLs)

### 10. Add Tests

**Backend:**
- `apps/core/spec/models/portfolio_spec.rb` — validations, associations, scopes
- `apps/core/spec/models/portfolio_entry_spec.rb` — entry types, standards alignment
- `apps/core/spec/policies/portfolio_policy_spec.rb` — student, teacher, guardian, admin access
- `apps/core/spec/requests/api/v1/portfolios_controller_spec.rb` — CRUD, entries, reflect, align, feature, export
- `apps/core/spec/services/portfolio_export_service_spec.rb` — export completeness

**Frontend:**
- `apps/web/src/app/learn/portfolio/page.test.tsx` — portfolio list, create
- `apps/web/src/app/learn/portfolio/[portfolioId]/page.test.tsx` — entries, add, reorder
- `apps/web/src/app/teach/courses/[courseId]/portfolios/page.test.tsx` — teacher review

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_portfolio_infrastructure.rb` | All portfolio tables |
| `apps/core/app/models/portfolio.rb` | Portfolio model |
| `apps/core/app/models/portfolio_entry.rb` | Entry model |
| `apps/core/app/models/portfolio_entry_standard.rb` | Standards join model |
| `apps/core/app/models/portfolio_comment.rb` | Comment model |
| `apps/core/app/models/portfolio_template.rb` | Template model |
| `apps/core/app/controllers/api/v1/portfolios_controller.rb` | Portfolio API |
| `apps/core/app/policies/portfolio_policy.rb` | Access policy |
| `apps/core/app/policies/portfolio_comment_policy.rb` | Comment policy |
| `apps/core/app/serializers/portfolio_serializer.rb` | Portfolio serializer |
| `apps/core/app/serializers/portfolio_entry_serializer.rb` | Entry serializer |
| `apps/core/app/services/portfolio_export_service.rb` | Export service |
| `apps/web/src/app/learn/portfolio/page.tsx` | Student portfolio list |
| `apps/web/src/app/learn/portfolio/[portfolioId]/page.tsx` | Portfolio detail |
| `apps/web/src/app/learn/portfolio/[portfolioId]/entries/[entryId]/page.tsx` | Entry detail |
| `apps/web/src/app/teach/courses/[courseId]/portfolios/page.tsx` | Teacher portfolio review |
| `apps/web/src/app/guardian/students/[studentId]/portfolio/page.tsx` | Guardian portfolio view |
| `apps/core/spec/models/portfolio_spec.rb` | Model tests |
| `apps/core/spec/models/portfolio_entry_spec.rb` | Entry tests |
| `apps/core/spec/policies/portfolio_policy_spec.rb` | Policy tests |
| `apps/core/spec/requests/api/v1/portfolios_controller_spec.rb` | API tests |
| `apps/core/spec/services/portfolio_export_service_spec.rb` | Export tests |
| `apps/web/src/app/learn/portfolio/page.test.tsx` | List tests |
| `apps/web/src/app/learn/portfolio/[portfolioId]/page.test.tsx` | Detail tests |
| `apps/web/src/app/teach/courses/[courseId]/portfolios/page.test.tsx` | Teacher review tests |
| `apps/core/spec/factories/portfolios.rb` | Factory |
| `apps/core/spec/factories/portfolio_entries.rb` | Factory |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add portfolio routes |
| `apps/core/app/models/user.rb` | Add portfolio associations |
| `apps/web/src/components/AppShell.tsx` | Add "Portfolio" link under Learn nav for students |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx` | Add "Portfolios" tab |
| `apps/web/src/app/guardian/students/[studentId]/page.tsx` | Add "Portfolio" link |

---

## Definition of Done

- [ ] Portfolio model supports personal and course-based portfolios with configurable visibility
- [ ] PortfolioEntry supports 5 entry types (submission, quiz, file, link, text)
- [ ] Students can add entries, write reflections, and align work to standards
- [ ] Teachers can view student portfolios, add comments, and feature entries
- [ ] Guardians can view shared portfolios and add comments
- [ ] Portfolio templates allow teachers to define required entries
- [ ] Portfolio export generates complete data package for portability
- [ ] Standards mastery levels tracked per entry (not met, approaching, met, exceeded)
- [ ] Drag-and-drop reordering of portfolio entries
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
