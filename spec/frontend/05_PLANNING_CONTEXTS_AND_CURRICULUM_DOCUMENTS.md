# Step 5 — Planning contexts + generic Curriculum Documents (Frontend, Route 3)

## Outcome

After this step:

- Planning UI is no longer hard-coded to `UnitPlan`/`LessonPlan` as the primary planning spine.
- The Plan workspace is organized around **Planning Contexts**:
  - course contexts
  - grade-team contexts
  - interdisciplinary contexts
  - programme contexts (e.g., IB PYP Programme of Inquiry)
- Within a planning context, users can create and manage **Curriculum Documents** of multiple types:
  - unit plan
  - lesson plan
  - scheme of work
  - programme of inquiry
  - templates
  - etc.
- Existing routes (`/plan/units`, `/plan/templates`) continue to work during migration, but are increasingly powered by the new generic components.

This is the core frontend migration for Route 3.

---

## Dependencies

- Backend Step 5 provides:
  - Planning Context APIs
  - Curriculum Document APIs
  - Curriculum Document Links APIs

- Frontend Step 2 provides:
  - DocumentEditor (schema-driven)

- Frontend Step 3 provides:
  - pack-defined document types + schema selection

---

## UX principles for Plan workspace

### Principle 1 — Context-first planning
Teachers plan **within a context**, not globally.

- IB PYP: a Grade Team context for transdisciplinary units; programme context for PoI.
- US: course context for subject-specific units.
- UK: year group + subject context (often not a 1:1 with a course section).

The UI must make context selection explicit and persistent.

### Principle 2 — Document types are pack-defined
Do not hard-code “Unit” and “Lesson” in the new UI.

- Use pack document type labels.
- Use pack relationship rules.

### Principle 3 — Migration-friendly
Existing users/bookmarks must keep working.

- Keep `/plan/units/:id` working until data migration is complete.
- Introduce `/plan/documents/:id` as the new canonical editor.

---

## Implementation plan

### 1) Add Planning Context types + hooks

**Create:** `apps/web/src/curriculum/contexts/types.ts`

```ts
export interface PlanningContext {
  id: number;
  kind: string;
  name: string;
  status: string;
  school_id: number;
  academic_year_id?: number | null;
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  // optional runtime subset from Step 3
  curriculum_runtime?: {
    pack_key?: string;
    pack_version?: string;
    terminology?: Record<string, string>;
    document_types?: Record<string, any>;
    framework_bindings?: any;
  };
}
```

**Create:** `apps/web/src/curriculum/contexts/hooks.ts`

- `usePlanningContexts(params)` → `GET /api/v1/planning_contexts`
  - filters: `kind`, `academic_year_id`, etc.
- `usePlanningContext(id)` → `GET /api/v1/planning_contexts/:id`

Include school-scoping keying in Step 6.

---

### 2) Add PlanningContextSelector component

**Create:** `apps/web/src/curriculum/contexts/PlanningContextSelector.tsx`

Goal:

- Allow user to select a planning context (and optionally filter by kind).
- Persist selection.

Persistence strategy (choose one):

- **Option A:** Query param `?context_id=...` (shareable links)
- **Option B:** Local storage key `k12.selectedPlanningContextId` (sticky)

Recommended:

- Use query param as source-of-truth.
- If missing, fall back to localStorage.

Component behavior:

1. Load contexts list.
2. If `context_id` not in query:
   - use stored id if valid
   - else default to first context
3. On selection:
   - update query param
   - update localStorage
   - trigger SWR global revalidation (Step 6)

UX:

- Show context kind badge (Course / Grade Team / Programme)
- Search within contexts if list is large

---

### 3) Build generic Curriculum Document list component

**Create:** `apps/web/src/curriculum/documents/DocumentList.tsx`

Inputs:

- `planningContextId` (required)
- optional `documentType` filter

API:

- `GET /api/v1/curriculum_documents?planning_context_id=...&document_type=...&status=...&q=...&page=...&per_page=...`

**Important (scalability):**

Request backend to return a paginated shape instead of raw arrays.

Recommended response:

```json
{
  "items": [ {"id": 1, "title": "...", "status": "draft"} ],
  "page": 1,
  "per_page": 25,
  "total": 143
}
```

If backend returns arrays initially, keep UI working but treat `total` as unknown.

DocumentList UI:

- Search bar (title)
- Status filter (values should come from pack if possible; otherwise accept free-form)
- Document type selector (from pack runtime subset in context)
- Grid/list layout
- Each row/card shows:
  - title
  - document type label
  - status badge (WorkflowBadge)
  - updated date

Link:

- clicking opens `/plan/documents/:id`

---

### 4) Implement Curriculum Document relationships UI

**Create:** `apps/web/src/curriculum/documents/DocumentRelationships.tsx`

Goal:

- Show and manage pack-defined relationships (e.g., unit contains lessons).

API:

- `GET /api/v1/curriculum_document_links?source_document_id=:id` (or `/curriculum_documents/:id/links`)
- `POST /api/v1/curriculum_document_links`
- `DELETE /api/v1/curriculum_document_links/:id`

UI requirements:

- Show grouped by relationship_type (contains, derives_from, aligned_with)
- If relationship_type is ordered (`ordered: true` in pack doc type config):
  - allow reordering (drag-and-drop optional)
  - else allow move up/down buttons

Creation:

- “Add existing” button opens a search modal for documents in same planning_context (backend filter)
- “Create new child” button opens `CreateDocumentWizard` with:
  - preselected document_type = allowed target type
  - after create, automatically creates link

Pack constraints:

- Use the context/runtime document type relationship rules to show only allowed actions.
- Do not trust the UI; backend validates too.

---

### 5) Enhance DocumentEditor page to show context + relationships

**Modify:** `apps/web/src/curriculum/documents/DocumentEditor.tsx`

Add:

- Planning context breadcrumbs:
  - “Plan / <Context Name> / <Document Type Label> / <Title>”
- Relationships panel:
  - include `DocumentRelationships` in a side panel on desktop
  - collapse under accordion on mobile

Add “Create child document” shortcut when pack allows `contains` relationships.

---

### 6) Add Plan workspace pages

Create new stable pages that packs can point to.

#### 6.1) Plan contexts index

**Create:** `apps/web/src/app/plan/contexts/page.tsx`

- Shows list of contexts
- If user can create contexts (admin/curriculum_lead), show “New context” button

Creation UI:

- a modal or inline form:
  - name
  - kind
  - optional courses assignment

Calls:

- `POST /api/v1/planning_contexts`

#### 6.2) Plan documents index

**Create:** `apps/web/src/app/plan/documents/page.tsx`

- Uses `PlanningContextSelector`
- Shows `DocumentList` for the selected context

Optional:

- Add “New document” button that opens `CreateDocumentWizard`

#### 6.3) Context detail page

**Create:** `apps/web/src/app/plan/contexts/[id]/page.tsx`

- Shows context metadata
- Shows `DocumentList` filtered to that context

This is useful for deep links.

---

### 7) Add pack-module routing for `/plan/*`

To support pack-defined plan subpages (e.g., `/plan/poi`), implement a safe module router.

#### 7.1) Module registry

**Create:** `apps/web/src/curriculum/modules/registry.tsx`

Map module IDs to React components.

Example:

```tsx
import dynamic from "next/dynamic";

export const MODULE_REGISTRY: Record<string, React.ComponentType<any>> = {
  "plan.documents": dynamic(() => import("@/app/plan/documents/page")),
  "plan.contexts": dynamic(() => import("@/app/plan/contexts/page")),
  // future: "plan.poi": dynamic(() => import("./ib/PoiBoard"))
};
```

Prefer dynamic imports for large modules.

#### 7.2) Catch-all route

**Create:** `apps/web/src/app/plan/[...slug]/page.tsx`

Behavior:

- Convert slug segments to a module id, e.g.:
  - `/plan/documents` handled by the specific route already
  - `/plan/poi` (slug=["poi"]) → moduleId = `plan.poi`

- Resolve module from `MODULE_REGISTRY`.
- If not found, show 404-like empty state.

**Safety:**

- Only allow module IDs present in registry.

This allows packs to add plan pages without changing routes.

---

### 8) Bridge legacy UnitPlan pages to Curriculum Documents (UI-only)

Until backend data migration:

- Keep `/plan/units` and `/plan/units/:id` pages.
- Add a soft migration path:

#### 8.1) Replace `/plan/units` list with DocumentList when possible

**Modify:** `apps/web/src/app/plan/units/page.tsx`

Logic:

- If backend feature flag indicates Curriculum Documents are enabled (e.g., `/api/v1/features` or `user.preferences`), render `DocumentList` filtered to `document_type=unit_plan`.
- Else, keep legacy UnitPlan list.

This lets you switch tenants gradually.

#### 8.2) Replace “New Unit Plan” with CreateDocumentWizard

**Modify:** `/plan/units/new`

If documents mode is enabled:

- open `CreateDocumentWizard` with `documentType="unit_plan"`

Redirect to `/plan/documents/:id`.

If not enabled:

- keep legacy UnitPlan create.

---

## API expectations (backend)

To make this UX good at district scale, request backend improvements:

- `GET /planning_contexts` should be filterable and paginated.
- `GET /curriculum_documents` should be paginated and include:
  - `document_type`
  - `status`
  - `updated_at`
  - optional `version_count` (avoid N+1)
- `GET /curriculum_documents/:id` should include:
  - `current_version`
  - optional pack runtime subset

---

## Testing

### Unit tests

- `PlanningContextSelector`:
  - picks default context
  - updates query param on change

- `DocumentList`:
  - renders documents
  - applies filters

### E2E

- Create context → create document → edit → create child document

---

## Acceptance criteria

- Users can select a planning context and see its documents.
- Users can create a document of a pack-defined type.
- Users can link documents according to pack relationship rules.
- Existing `/plan/units` route still functions (legacy or bridged).

---

## Rollout notes

- Implement “documents mode” as a tenant-level feature flag.
- Migrate one tenant/school first.
- Keep legacy pages until backend data migration completes.
