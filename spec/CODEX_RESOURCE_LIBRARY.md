# CODEX_RESOURCE_LIBRARY — Central File and Resource Management

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.4 (resource_links), TECH-2.9 (Active Storage + S3), PRD-9 (Drive attachments), PRD-20 (Google-Native)
**Depends on:** None

---

## Problem

The TECH_SPEC §2.4 defines a `resource_links` table but the platform has no central resource management. Currently:

1. **Drive attachments are inline only** — teachers can attach Drive files to unit plans and lessons via GoogleDrivePicker, but there's no central library view of all resources
2. **No file upload beyond Drive** — teachers with local PDFs, images, or documents have no upload path; only Google Drive links are supported
3. **No resource reuse** — a teacher who attaches a worksheet to one unit cannot easily find and attach it to another unit; each attachment is independent
4. **No resource tagging/categorization** — no metadata on resources (subject, grade level, type, standards alignment)
5. **No sharing across teachers** — no way for one teacher to share a resource with colleagues at the same school
6. **No resource search** — no way to find previously attached resources
7. **No folder organization** — resources are flat, attached to individual entities; no folder hierarchy
8. **Active Storage exists but underutilized** — S3 storage is configured but only used for QTI imports and PDF exports

---

## Tasks

### 1. Create Resource Model and Migration

Create migration:

```ruby
class CreateResources < ActiveRecord::Migration[8.0]
  def change
    create_table :resources do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :folder, foreign_key: { to_table: :resource_folders }
      t.string :title, null: false
      t.text :description
      t.string :resource_type, null: false  # "file", "drive_link", "external_link"
      t.string :mime_type
      t.bigint :file_size_bytes
      t.string :drive_file_id                # For Google Drive links
      t.string :drive_url                    # Direct link to Drive file
      t.string :external_url                 # For non-Drive external links
      t.string :visibility, null: false, default: "private"  # "private", "school", "public"
      t.string :status, null: false, default: "active"       # "active", "archived"
      t.jsonb :tags, null: false, default: []
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :resources, [:tenant_id, :created_by_id]
    add_index :resources, :tags, using: :gin
    add_index :resources, :status
  end
end
```

Create folder migration:

```ruby
class CreateResourceFolders < ActiveRecord::Migration[8.0]
  def change
    create_table :resource_folders do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :parent, foreign_key: { to_table: :resource_folders }
      t.string :name, null: false
      t.string :color, default: "#6366f1"
      t.timestamps
    end

    add_index :resource_folders, [:tenant_id, :parent_id]
  end
end
```

Create resource attachment join table:

```ruby
class CreateResourceAttachments < ActiveRecord::Migration[8.0]
  def change
    create_table :resource_attachments do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :resource, null: false, foreign_key: true
      t.references :attachable, polymorphic: true, null: false
      t.timestamps
    end

    add_index :resource_attachments, [:attachable_type, :attachable_id], name: "idx_res_attach_target"
  end
end
```

### 2. Create Resource Models

Model `apps/core/app/models/resource.rb`:
- `include TenantScoped`
- `belongs_to :created_by, class_name: "User"`
- `belongs_to :folder, class_name: "ResourceFolder", optional: true`
- `has_many :resource_attachments, dependent: :destroy`
- `has_one_attached :file` (Active Storage)
- Validates title presence
- Validates resource_type in `%w[file drive_link external_link]`
- Validates visibility in `%w[private school public]`
- Scope `visible_to(user)` — private resources by user + school-visible resources
- Scope `tagged_with(tag)` — `where("tags @> ?", [tag].to_json)`
- Full-text search on title + description (add tsvector column like existing FTS tables)

Model `apps/core/app/models/resource_folder.rb`:
- `include TenantScoped`
- `belongs_to :parent, class_name: "ResourceFolder", optional: true`
- `has_many :children, class_name: "ResourceFolder", foreign_key: :parent_id`
- `has_many :resources`
- Validates name presence

Model `apps/core/app/models/resource_attachment.rb`:
- `include TenantScoped`
- `belongs_to :resource`
- `belongs_to :attachable, polymorphic: true`

### 3. Add Attachable Concern

Create `apps/core/app/models/concerns/has_resources.rb`:

```ruby
module HasResources
  extend ActiveSupport::Concern

  included do
    has_many :resource_attachments, as: :attachable, dependent: :destroy
    has_many :resources, through: :resource_attachments
  end

  def attach_resource(resource)
    resource_attachments.find_or_create_by!(resource: resource, tenant: Current.tenant)
  end

  def detach_resource(resource)
    resource_attachments.where(resource: resource).destroy_all
  end
end
```

Include in: UnitVersion, LessonVersion, Assignment, Course, Template.

### 4. Create Resource API Endpoints

Create `apps/core/app/controllers/api/v1/resources_controller.rb`:

```ruby
class Api::V1::ResourcesController < ApplicationController
  # GET /api/v1/resources
  def index
    authorize Resource
    resources = policy_scope(Resource)
    resources = resources.tagged_with(params[:tag]) if params[:tag]
    resources = resources.where(folder_id: params[:folder_id]) if params[:folder_id]
    resources = resources.where(resource_type: params[:type]) if params[:type]
    resources = resources.search(params[:q]) if params[:q].present?
    resources = resources.order(created_at: :desc).page(params[:page])
    render json: resources
  end

  # POST /api/v1/resources
  def create
    authorize Resource
    resource = Resource.new(resource_params)
    resource.created_by = Current.user
    resource.tenant = Current.tenant

    if params[:file].present?
      resource.resource_type = "file"
      resource.file.attach(params[:file])
      resource.mime_type = params[:file].content_type
      resource.file_size_bytes = params[:file].size
    end

    resource.save!
    render json: resource, status: :created
  end

  # POST /api/v1/resources/:id/attach
  def attach
    resource = Resource.find(params[:id])
    authorize resource
    attachable = find_attachable
    attachable.attach_resource(resource)
    render json: { status: "attached" }
  end

  # DELETE /api/v1/resources/:id/detach
  def detach
    resource = Resource.find(params[:id])
    authorize resource
    attachable = find_attachable
    attachable.detach_resource(resource)
    render json: { status: "detached" }
  end

  # POST /api/v1/resources/:id/share
  def share
    resource = Resource.find(params[:id])
    authorize resource, :share?
    resource.update!(visibility: params[:visibility])
    render json: resource
  end

  private

  def resource_params
    params.require(:resource).permit(:title, :description, :resource_type, :drive_file_id, :drive_url, :external_url, :folder_id, :visibility, tags: [])
  end

  def find_attachable
    type = params[:attachable_type]  # "UnitVersion", "Assignment", etc.
    id = params[:attachable_id]
    type.constantize.find(id)
  end
end
```

Create `apps/core/app/controllers/api/v1/resource_folders_controller.rb`:
- CRUD for folders
- Nested folder listing (tree structure)
- Move resources between folders

### 5. Build Resource Library Page

Create `apps/web/src/app/plan/resources/page.tsx`:

**Layout:**
- **Left sidebar** — Folder tree with expandable/collapsible folders + "All Resources" root
- **Main area** — Grid/list toggle view of resources in selected folder
- **Top bar** — Search, filter by type (File, Drive, Link), filter by tag, sort (name, date, type)

**Resource Cards:**
- File icon based on MIME type (PDF, image, doc, spreadsheet, presentation, etc.)
- Title, description preview, type badge, tags
- Created by, created date
- Visibility indicator (private lock, school building, globe)
- Actions: Open, Attach to..., Share, Move, Delete

**Upload:**
- Drag-and-drop zone at top of main area
- "Upload File" button opens file picker
- "Link Drive File" button opens GoogleDrivePicker
- "Add External Link" button opens URL input modal
- Upload progress indicator

**Attach Flow:**
- "Attach to..." opens a modal with searchable list of units, lessons, assignments, courses
- Select target → confirm → resource_attachment created

### 6. Add Resource Picker Component

Create `apps/web/src/components/ResourcePicker.tsx`:

```typescript
interface ResourcePickerProps {
  attachableType: string;
  attachableId: string;
  onAttach: (resource: Resource) => void;
}
```

- Modal that shows the resource library in a compact view
- Search and filter within the modal
- Select one or multiple resources to attach
- Shows currently attached resources with "Detach" option

Integrate into:
- Unit planner (`/plan/units/[id]`) — sidebar resource section
- Lesson editor (`/plan/units/[id]/lessons/[lessonId]`) — resource section
- Assignment editor (`/teach/courses/[courseId]/assignments/[assignmentId]`) — resource section

### 7. Add Tests

**Backend:**
- `apps/core/spec/models/resource_spec.rb`
  - Validates required fields
  - Tag filtering via GIN index
  - Visibility scoping
  - Full-text search
  - Active Storage attachment

- `apps/core/spec/models/resource_folder_spec.rb`
  - Nested folder relationships
  - Tenant scoping

- `apps/core/spec/requests/api/v1/resources_controller_spec.rb`
  - CRUD operations
  - File upload via Active Storage
  - Drive link creation
  - Attach/detach to polymorphic targets
  - Share/visibility changes
  - Search and tag filtering
  - Authorization (own resources vs. shared)
  - Tenant scoping

- `apps/core/spec/requests/api/v1/resource_folders_controller_spec.rb`
  - CRUD, nesting, moving

**Frontend:**
- `apps/web/src/app/plan/resources/page.test.tsx`
  - Renders resource grid
  - Folder tree navigation
  - Upload triggers file attachment
  - Search filters results

- `apps/web/src/components/__tests__/ResourcePicker.test.tsx`
  - Opens modal on trigger
  - Search within picker
  - Attach action calls onAttach

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_create_resource_folders.rb` | Folder table |
| `apps/core/db/migrate/YYYYMMDD_create_resources.rb` | Resource table |
| `apps/core/db/migrate/YYYYMMDD_create_resource_attachments.rb` | Polymorphic join table |
| `apps/core/app/models/resource.rb` | Resource model |
| `apps/core/app/models/resource_folder.rb` | Folder model |
| `apps/core/app/models/resource_attachment.rb` | Attachment join model |
| `apps/core/app/models/concerns/has_resources.rb` | Attachable concern |
| `apps/core/app/controllers/api/v1/resources_controller.rb` | Resource CRUD + attach/share |
| `apps/core/app/controllers/api/v1/resource_folders_controller.rb` | Folder CRUD |
| `apps/core/app/policies/resource_policy.rb` | Resource access policy |
| `apps/core/app/policies/resource_folder_policy.rb` | Folder access policy |
| `apps/core/app/serializers/resource_serializer.rb` | Resource serializer |
| `apps/core/app/serializers/resource_folder_serializer.rb` | Folder serializer |
| `apps/web/src/app/plan/resources/page.tsx` | Resource library page |
| `apps/web/src/components/ResourcePicker.tsx` | Embeddable resource picker |
| `apps/core/spec/models/resource_spec.rb` | Model tests |
| `apps/core/spec/models/resource_folder_spec.rb` | Folder model tests |
| `apps/core/spec/requests/api/v1/resources_controller_spec.rb` | API tests |
| `apps/core/spec/requests/api/v1/resource_folders_controller_spec.rb` | Folder API tests |
| `apps/web/src/app/plan/resources/page.test.tsx` | Library page tests |
| `apps/web/src/components/__tests__/ResourcePicker.test.tsx` | Picker tests |
| `apps/core/spec/factories/resources.rb` | Factory |
| `apps/core/spec/factories/resource_folders.rb` | Factory |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/config/routes.rb` | Add resource and folder routes |
| `apps/core/app/models/unit_version.rb` | Include HasResources |
| `apps/core/app/models/lesson_version.rb` | Include HasResources |
| `apps/core/app/models/assignment.rb` | Include HasResources |
| `apps/core/app/models/course.rb` | Include HasResources |
| `apps/core/app/models/template.rb` | Include HasResources |
| `apps/web/src/components/AppShell.tsx` | Add "Resources" link under Plan nav |
| `apps/web/src/app/plan/units/[id]/page.tsx` | Add ResourcePicker |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` | Add ResourcePicker |

---

## Definition of Done

- [ ] Resources table supports file uploads (Active Storage), Drive links, and external URLs
- [ ] ResourceFolders provide nested folder organization
- [ ] ResourceAttachments provide polymorphic attachment to units, lessons, assignments, courses
- [ ] HasResources concern enables attach/detach on any model
- [ ] Resource library page shows grid/list view with folder tree, search, and tag filtering
- [ ] File upload via drag-and-drop and file picker
- [ ] Drive file linking via GoogleDrivePicker integration
- [ ] ResourcePicker modal embedded in unit, lesson, and assignment editors
- [ ] Visibility controls (private, school-wide, public) with proper authorization
- [ ] Full-text search on resource title and description
- [ ] All backend specs pass
- [ ] All frontend tests pass
- [ ] No TypeScript errors, no Rubocop violations
