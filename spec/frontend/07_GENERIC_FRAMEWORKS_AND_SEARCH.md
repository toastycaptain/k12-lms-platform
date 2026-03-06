# Step 7 — Generic frameworks/nodes + search + document alignments (Frontend)

## Outcome

After this step:

- The UI treats “standards” as a generic **Framework / Node** system.
- Users can:
  - browse frameworks
  - search nodes quickly (server-side)
  - align curriculum document versions to nodes (standards/skills/concepts/objectives)
- Packs can control which frameworks appear by default (framework bindings).
- The alignment UI works for IB (ATL skills, concepts), US (standards), UK (objectives) using the same components.

---

## Dependencies

- Backend Step 7 provides:
  - frameworks/nodes kinds
  - search endpoint (q)
  - curriculum_document_version alignments endpoint

- Frontend Step 2 provides:
  - DocumentEditor + versions

- Frontend Step 3 provides:
  - pack framework bindings (defaults/allowed)

---

## Design decisions

### Decision 1 — Keep backwards compatibility with existing endpoints
The repo currently has:

- `/api/v1/standard_frameworks`
- `/api/v1/standards`
- `/api/v1/standard_frameworks/:id/tree`

Backend Step 7 keeps these but evolves them.

Frontend should:

- introduce new “Framework” naming in UI
- keep endpoint paths until backend renames

### Decision 2 — Search is server-side and paginated
Do not fetch all nodes into the browser.

- Node picker uses `q` parameter and pagination.

### Decision 3 — Alignment is attached to *document versions*
Route 3 aligns `CurriculumDocumentVersion` to nodes.

- A document can change over versions; alignment should be versioned too.

---

## API expectations (backend)

### Frameworks index

`GET /api/v1/standard_frameworks?framework_kind=skill&status=active`

### Nodes search

Option A (minimal):

`GET /api/v1/standards?q=photosynthesis&standard_framework_id=12&kind=objective&page=1&per_page=20`

Option B:

`GET /api/v1/standards/search?q=...`

Frontend should implement Option A first.

### Document version alignments

- `GET /api/v1/curriculum_document_versions/:id/alignments`
- `POST /api/v1/curriculum_document_versions/:id/alignments` with `{ standard_ids: [1,2] }` (or one id)
- `DELETE /api/v1/curriculum_document_versions/:id/alignments/bulk_destroy` with `{ standard_ids: [..] }`

(Backend Step 7 suggests a `bulk_destroy` route.)

---

## Implementation plan

### 1) Rename the UI concept: Standards → Frameworks

Leave existing route `/plan/standards` for now, but update display strings:

- Page title: “Framework Browser”
- Labels: “Framework”, “Nodes”, “Kinds”

This helps multi-curriculum clarity.

---

### 2) Add framework/node types and hooks

**Create:** `apps/web/src/curriculum/frameworks/types.ts`

```ts
export interface Framework {
  id: number;
  key?: string | null;
  name: string;
  framework_kind: string; // standard | skill | concept | objective
  subject?: string | null;
  jurisdiction?: string | null;
  version?: string | null;
  status?: string;
}

export interface FrameworkNode {
  id: number;
  standard_framework_id: number;
  kind: string;
  code?: string | null;
  identifier?: string | null;
  label?: string | null;
  description?: string;
  grade_band?: string | null;
}

export interface FrameworkNodeTree extends FrameworkNode {
  children: FrameworkNodeTree[];
}
```

**Create:** `apps/web/src/curriculum/frameworks/hooks.ts`

Hooks:

- `useFrameworks(params)` → `/api/v1/standard_frameworks`
- `useFrameworkTree(frameworkId, params)` → `/api/v1/standard_frameworks/:id/tree`
- `useFrameworkNodeSearch(params)` → `/api/v1/standards?q=...`

Use SWR tuple keys with school id (Step 6).

---

### 3) Upgrade `/plan/standards` into a scalable Framework Browser

**Modify:** `apps/web/src/app/plan/standards/page.tsx`

Current limitations:

- renders full tree and performs client-only search; ok for small frameworks but not scalable.

Upgrade UI:

- Left: framework selector + optional framework kind filter
- Right: two tabs:
  - “Browse” (tree)
  - “Search” (server-side results)

Search tab behavior:

- when user types ≥ 2 chars, call `useFrameworkNodeSearch` with `q`.
- show paginated results list.
- highlight matched text (optional)

Keep Browse tab for navigating hierarchy.

---

### 4) Implement a FrameworkNodePicker widget

This widget will be used in schema-driven planners to align content to frameworks.

**Create:** `apps/web/src/curriculum/frameworks/FrameworkNodePicker.tsx`

Props:

```ts
interface FrameworkNodePickerProps {
  frameworkId: number;
  selected: FrameworkNode[];
  onAdd: (node: FrameworkNode) => void;
  onRemove: (nodeId: number) => void;
  nodeKindFilter?: string | null;
}
```

Behavior:

- input box for searching nodes (server-side)
- suggestions dropdown
- selecting a suggestion calls `onAdd`
- selected nodes render as chips with remove buttons

Scalability:

- debounce input (simple `setTimeout` inside `useEffect`)
- paginate results

Accessibility:

- dropdown should be keyboard navigable

---

### 5) Implement CurriculumDocumentVersion alignment panel

**Create:** `apps/web/src/curriculum/documents/DocumentAlignments.tsx`

Inputs:

- `documentVersionId`
- `packFrameworkBindings` (defaults/allowed)

Behavior:

1. Determine which frameworks to show:
   - allowed frameworks from pack (by key) if provided
   - else show all frameworks

2. Allow selecting a framework from dropdown.

3. Render `FrameworkNodePicker` for that framework.

4. Persist selections:

- On add:
  - POST `/api/v1/curriculum_document_versions/:id/alignments` (or similar)
- On remove:
  - DELETE bulk destroy

5. Revalidate alignment list after changes.

API calls should be resilient:

- if backend returns conflict because alignment already exists, ignore.

---

### 6) Wire alignments into DocumentEditor

**Modify:** `apps/web/src/curriculum/documents/DocumentEditor.tsx`

Where to place:

- A right side panel (desktop)
- Accordion section (mobile)

When to show:

- only when there is a `current_version` with an ID.

Inputs:

- pass `document.current_version.id`
- pass `document`’s pack runtime subset `framework_bindings` if provided.

---

### 7) Bridge legacy UnitPlan alignment UI (optional)

The legacy UnitPlan page currently fetches all standards and filters client-side.

If you are keeping legacy UnitPlan for a while:

- Replace that alignment section with `FrameworkNodePicker` and server-side search.
- Keep calls to the legacy endpoints:
  - POST `/api/v1/unit_versions/:id/standards`
  - DELETE `/api/v1/unit_versions/:id/standards/bulk_destroy`

This reduces load immediately even before full documents migration.

---

## Testing

### Unit tests

- `useFrameworkNodeSearch` builds correct query strings
- `FrameworkNodePicker`:
  - renders suggestions from mock results
  - adds/removes nodes

### E2E

- Open a curriculum document
- Search a node and align it
- Reload page, confirm alignment persists

---

## Acceptance criteria

- Node search does not require fetching all nodes.
- Framework browser supports both browse and search.
- Document versions can be aligned to nodes using generic UI.
- Pack framework bindings can restrict/guide framework selection.

---

## Rollout notes

- Ship behind `generic_frameworks_v1` feature flag until backend is stable.
- Keep old Standards terminology in URLs, but use “Frameworks” in UI.
