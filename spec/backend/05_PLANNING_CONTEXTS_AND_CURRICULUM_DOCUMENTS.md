# Step 5 — Add planning contexts + fully generic “Curriculum Document” model (Route 3)

## Outcome

After this step, the backend supports:

- **Planning Contexts** that represent where planning happens:
  - course contexts
  - grade-level teams
  - interdisciplinary teams
  - programme contexts (e.g., IB PYP Programme of Inquiry)
- A **generic Curriculum Document** model that replaces hard-coded `UnitPlan`, `LessonPlan`, and `Template` as the long-term planning spine.
- Documents are:
  - versioned
  - workflow-driven (status)
  - pinned to a curriculum pack key/version/schema
  - linkable to other documents (unit contains lessons, PoI contains units, etc.)

This is the core Route 3 backend change.

---

## Why we need Planning Contexts

The existing model assumes:

- `UnitPlan` belongs to `Course`
- `LessonPlan` belongs to `UnitPlan`

This breaks for:

- IB PYP (transdisciplinary units, grade-level teams, PoI spanning subjects)
- IB MYP interdisciplinary units (multiple subjects / courses)
- DP Core (TOK/EE/CAS) which may be programme-level rather than course-level
- British curriculum where “Scheme of Work” may be owned by a year group + subject, not a course section

The missing abstraction is **planning context**.

---

## Key design decisions

### Decision 1 — Add new models rather than mutate old ones
We will add:

- `PlanningContext`
- `CurriculumDocument`
- `CurriculumDocumentVersion`
- `CurriculumDocumentLink`

…and keep `UnitPlan/LessonPlan/Template` in place until frontend migration.

### Decision 2 — Documents belong to Planning Contexts
Every curriculum document belongs to a planning context. A planning context can reference one or more courses.

### Decision 3 — Relationships are generic edges
Unit→Lesson is represented as a `CurriculumDocumentLink` (`relationship_type="contains"`).

### Decision 4 — Pack + schema pinning is required
Documents store:

- `pack_key`
- `pack_version`
- `schema_key`

These are immutable.

---

## Database changes

### 1) Add planning contexts

**Migration:** `apps/core/db/migrate/XXXXXXXXXXXXXX_create_planning_contexts.rb`

Create table `planning_contexts`:

- `tenant_id` (FK, not null)
- `school_id` (FK, not null)
- `academic_year_id` (FK, nullable if you must support multi-year contexts, but recommended NOT NULL)
- `kind` (string, not null)
- `name` (string, not null)
- `status` (string, not null, default: "active")
- `settings` (jsonb, not null, default `{}`)
- `metadata` (jsonb, not null, default `{}`)
- `created_by_id` (FK to users, not null)
- timestamps

Indexes:

- `index_planning_contexts_on_tenant_id`
- `index_planning_contexts_on_school_id`
- `idx_planning_contexts_tenant_school_year_kind` on `(tenant_id, school_id, academic_year_id, kind)`

Recommended `kind` values:

- `course`
- `grade_team`
- `interdisciplinary`
- `programme`
- `school_wide`
- `custom`

Add a CHECK constraint to restrict kind values if you want strictness.

### 2) Link planning contexts to courses

**Migration:** `XXXXXXXXXXXXXX_create_planning_context_courses.rb`

Table: `planning_context_courses`

- `tenant_id` (FK, not null)
- `planning_context_id` (FK, not null)
- `course_id` (FK, not null)
- timestamps

Indexes:

- unique `(planning_context_id, course_id)`
- index `(tenant_id, course_id)`

### 3) Add generic Curriculum Documents

**Migration:** `XXXXXXXXXXXXXX_create_curriculum_documents.rb`

Table: `curriculum_documents`

- `tenant_id` (FK, not null)
- `school_id` (FK, not null)
- `academic_year_id` (FK, nullable or not-null depending on your planning model)
- `planning_context_id` (FK, not null)

- `document_type` (string, not null) — e.g. `unit_plan`, `lesson_plan`, `template`, `programme_of_inquiry`, `scheme_of_work`

- `title` (string, not null)
- `status` (string, not null, default `draft`) — workflow state

- `current_version_id` (bigint, nullable)

- `created_by_id` (FK, not null)

- `pack_key` (string, not null)
- `pack_version` (string, not null)
- `schema_key` (string, not null)

- `settings` (jsonb, not null, default `{}`)
  - recommended use: dates, schedule, flags, etc.
- `metadata` (jsonb, not null, default `{}`)
  - recommended use: legacy ids, tags, additional info

- `search_vector` (tsvector)

- timestamps

Indexes:

- `index_curriculum_documents_on_tenant_id`
- `idx_curriculum_documents_school_context` on `(tenant_id, school_id, planning_context_id)`
- `idx_curriculum_documents_type` on `(tenant_id, document_type)`
- `idx_curriculum_documents_search_vector` (GIN)

**Important:** Do NOT add a strict inclusion validation for `status`. Status values are pack-defined.

### 4) Add Curriculum Document Versions

**Migration:** `XXXXXXXXXXXXXX_create_curriculum_document_versions.rb`

Table: `curriculum_document_versions`

- `tenant_id` (FK, not null)
- `curriculum_document_id` (FK, not null)
- `version_number` (integer, not null)
- `title` (string, not null)
- `content` (jsonb, not null, default `{}`)
- `created_by_id` (FK, not null)
- timestamps

Indexes:

- unique `(curriculum_document_id, version_number)`
- index `(tenant_id, curriculum_document_id)`

### 5) Add Curriculum Document Links

**Migration:** `XXXXXXXXXXXXXX_create_curriculum_document_links.rb`

Table: `curriculum_document_links`

- `tenant_id` (FK, not null)
- `source_document_id` (FK to curriculum_documents, not null)
- `target_document_id` (FK to curriculum_documents, not null)
- `relationship_type` (string, not null)
- `position` (integer, not null, default 0)
- `metadata` (jsonb, not null, default `{}`)
- timestamps

Indexes:

- unique `(source_document_id, target_document_id, relationship_type)`
- index `(tenant_id, source_document_id, relationship_type, position)`
- index `(tenant_id, target_document_id)`

Add check constraint:

- `source_document_id != target_document_id`

Relationship types (initial):

- `contains` (ordered)
- `derives_from` (template → unit)
- `aligned_with` (cross-links)

Pack constraints for allowed relationships are defined in Step 3 `document_types.*.relationships`.

---

## Model layer

### 1) PlanningContext model

**Create:** `apps/core/app/models/planning_context.rb`

Associations:

- `belongs_to :tenant`
- `belongs_to :school`
- `belongs_to :academic_year`
- `belongs_to :created_by, class_name: "User"`

- `has_many :planning_context_courses`
- `has_many :courses, through: :planning_context_courses`
- `has_many :curriculum_documents`

Validations:

- `kind` presence
- `name` presence

Do NOT validate `kind` too rigidly at first unless you are confident about the full set.

### 2) PlanningContextCourse model

**Create:** `apps/core/app/models/planning_context_course.rb`

- `belongs_to :planning_context`
- `belongs_to :course`
- `validates :course_id, uniqueness: { scope: :planning_context_id }`

### 3) CurriculumDocument model

**Create:** `apps/core/app/models/curriculum_document.rb`

Include:

- `include TenantScoped`
- `include AttachmentValidatable` (if you want PDFs like UnitPlan)

Associations:

- `belongs_to :planning_context`
- `belongs_to :school`
- `belongs_to :academic_year` (optional depending on your choice)
- `belongs_to :created_by, class_name: "User"`

- `belongs_to :current_version, class_name: "CurriculumDocumentVersion", optional: true`
- `has_many :versions, class_name: "CurriculumDocumentVersion", dependent: :destroy`

- `has_many :outgoing_links, class_name: "CurriculumDocumentLink", foreign_key: :source_document_id, dependent: :destroy`
- `has_many :incoming_links, class_name: "CurriculumDocumentLink", foreign_key: :target_document_id, dependent: :destroy`

- `has_many :approvals, as: :approvable, dependent: :destroy`

- `has_one_attached :exported_pdf` (optional)

Validations:

- title presence
- document_type presence
- pack_key/pack_version/schema_key presence

Immutability:

- Prevent changes to pack_key/pack_version/schema_key after create.
  - use `attr_readonly` OR validation that `*_changed?` is false.

Versioning method:

```rb
def create_version!(title:, content:, created_by:)
  next_number = (versions.maximum(:version_number) || 0) + 1

  # validate content via Step 2 service
  Curriculum::DocumentContentService.validate_content!(
    tenant: tenant,
    pack_key: pack_key,
    pack_version: pack_version,
    document_type: document_type,
    schema_key: schema_key,
    content: content
  )

  version = versions.create!(
    tenant: tenant,
    version_number: next_number,
    title: title,
    content: content,
    created_by: created_by
  )

  update!(current_version: version, title: title)
  version
end
```

### 4) CurriculumDocumentVersion model

**Create:** `apps/core/app/models/curriculum_document_version.rb`

- `include TenantScoped`
- `belongs_to :curriculum_document`
- `belongs_to :created_by, class_name: "User"`

Validations:

- version_number presence + uniqueness scoped to document
- title presence
- content presence (hash)

### 5) CurriculumDocumentLink model

**Create:** `apps/core/app/models/curriculum_document_link.rb`

- `include TenantScoped`
- `belongs_to :source_document, class_name: "CurriculumDocument"`
- `belongs_to :target_document, class_name: "CurriculumDocument"`

Validations:

- relationship_type presence
- source != target
- uniqueness of (source, target, relationship_type)

Ordering:

- `position` is used only for `contains` relationships.

---

## Service layer

### 1) PlanningContext factory

**Create:** `apps/core/app/services/curriculum/planning_context_factory.rb`

Responsibilities:

- Create a planning context
- Attach courses (if provided)
- Validate that all courses belong to the same school/tenant

### 2) CurriculumDocument factory

**Create:** `apps/core/app/services/curriculum/document_factory.rb`

Responsibilities:

- Resolve effective pack for context
- Pick schema key
- Create document
- Create initial version

Inputs:

- planning_context
- document_type
- title
- optional schema_key
- initial content

Pack resolution:

- Use `CurriculumProfileResolver.resolve(tenant:, school:, course:)` where:
  - school = planning_context.school
  - course = planning_context.courses.first (optional)

Then pin returned `profile_key` + `resolved_profile_version`.

Schema selection:

- Validate that schema_key is allowed for document_type using pack payload
- If not provided, choose default

---

## API layer

### Routes

**Modify:** `apps/core/config/routes.rb`

Add:

```rb
resources :planning_contexts
resources :curriculum_documents do
  member do
    post :transition
  end
  resources :curriculum_document_versions, path: "versions", only: [:index, :create]
  resources :curriculum_document_links, path: "links", only: [:index, :create]
end
resources :curriculum_document_links, only: [:destroy]
```

(You may prefer to namespace them under `/api/v1/curriculum/...` later.)

### Controllers

#### 1) PlanningContextsController

**Create:** `apps/core/app/controllers/api/v1/planning_contexts_controller.rb`

Actions:

- `index` (filter by school_id, academic_year_id, kind)
- `show`
- `create` (accept courses[])
- `update` (name/settings/metadata + course list update)
- `destroy`

Permissions:

- admin/curriculum_lead can create contexts
- teacher can create contexts only if they have access to the school and courses

#### 2) CurriculumDocumentsController

**Create:** `apps/core/app/controllers/api/v1/curriculum_documents_controller.rb`

Actions:

- `index` filters:
  - planning_context_id
  - document_type
  - status

- `show` includes current_version

- `create`
  - uses `Curriculum::DocumentFactory`
  - returns document + current_version

- `update`
  - update title/settings/metadata only
  - should not update `content` directly

- `destroy`

- `transition`
  - body: `{ event: "publish", context: { approval_required: true } }`
  - calls `Curriculum::WorkflowEngine.transition!` (Step 4)

#### 3) CurriculumDocumentVersionsController

**Create:** `apps/core/app/controllers/api/v1/curriculum_document_versions_controller.rb`

Actions:

- `index` lists versions for a document
- `create` creates a new version

`create` body:

```json
{
  "title": "Unit 1",
  "content": { ... }
}
```

Must validate content using Step 2 service.

#### 4) CurriculumDocumentLinksController

**Create:** `apps/core/app/controllers/api/v1/curriculum_document_links_controller.rb`

Actions:

- `index` list outgoing links
- `create`
  - body includes target_document_id, relationship_type, position
  - validate relationship allowed by pack constraints (Step 3)

- `destroy` (global resource)

Relationship validation rules:

- documents must share tenant
- for `contains`, recommended: enforce same planning_context
- pack `document_types[source].relationships[type].allowed_target_types` must include target type

---

## Policies

Add Pundit policies:

- `PlanningContextPolicy`
- `CurriculumDocumentPolicy`
- `CurriculumDocumentVersionPolicy`
- `CurriculumDocumentLinkPolicy`

Scope rules must incorporate school scoping (Step 6).

Minimum scope logic:

- privileged users: all in tenant (or all in Current.school)
- teacher: only contexts/courses they teach + documents in those contexts

---

## Serializers

Add serializers:

- `PlanningContextSerializer`
- `CurriculumDocumentSerializer`
- `CurriculumDocumentVersionSerializer`
- `CurriculumDocumentLinkSerializer`

`CurriculumDocumentSerializer` should include:

- id, title, status, document_type
- planning_context_id
- pack_key, pack_version, schema_key
- current_version (optional include)

---

## Search and full-text

Add `search_vector` triggers later (Step 7 extends search).

For now:

- index lists can filter by title using `ILIKE` if needed.

---

## Migration strategy (legacy plans)

This step does not require migrating legacy `UnitPlan/LessonPlan/Template` immediately.

But you must plan a migration path.

### Recommended approach

- Keep legacy endpoints working.
- Add new endpoints for Curriculum Documents.
- Add a background migration job later:
  - create PlanningContext for each course
  - create CurriculumDocument for each unit
  - create CurriculumDocumentLink for unit→lesson
  - copy current versions into CurriculumDocumentVersion.content
  - store legacy ids in `metadata`:

```json
{"legacy": {"unit_plan_id": 123, "lesson_plan_id": 456}}
```

This keeps data traceable.

---

## Rollout plan

Feature flags:

- `curriculum_documents_v1` (default false)

When off:

- new endpoints return 404 or are hidden

When on:

- new endpoints are available

You can roll out per tenant by enabling flag.

---

## Acceptance criteria

- Admin/teacher can create a planning context.
- Admin/teacher can create a curriculum document in that context.
- Document creation pins pack key/version/schema key.
- Document versions store JSONB content and validate against schema.
- Document relationships (unit contains lessons, PoI contains units) are expressed via links.
