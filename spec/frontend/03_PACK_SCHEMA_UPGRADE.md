# Step 3 — Support pack schema v3 (document types/schemas/relationships) in the frontend

## Outcome

After this step:

- The frontend can consume the **canonical pack shape** introduced in backend Step 3 (`pack.v1`):
  - `document_types`
  - `document_schemas`
  - schema variants per type
  - relationship constraints
  - workflow bindings (names)
  - framework bindings
- The UI can:
  - display correct **document type labels** (Unit vs Scheme of Work vs Programme of Inquiry)
  - offer creation options based on pack-defined document types and schemas
  - render richer `ui_schema` (not only a flat list of fields)

This step upgrades the UI from “UnitPlan/LessonPlan fields” to truly **curriculum-structured planning**.

---

## Dependencies

- Backend Step 3: pack schema upgrade (`document_types`, `document_schemas`)
- Backend Step 5: Curriculum Documents and Planning Contexts exist
- Frontend Step 2: baseline schema renderer exists

---

## Design decisions

### Decision 1 — Frontend uses a *pack runtime subset* for teachers
Teachers should not need the entire pack payload. They need:

- available document types + labels
- allowed schema keys + default schema key
- `ui_schema` + `data_schema` for the schema key pinned to a document
- relationship rules to enable “Create child document” UI

Therefore:

- Admin screens may fetch full pack payload.
- Teacher planning screens should fetch a **pack runtime subset** from context/document endpoints.

### Decision 2 — UI schema spec is explicit and versioned
Backend treats `ui_schema` as opaque; frontend needs a stable format.

Introduce a **UI schema spec v1** (frontend contract) that packs can embed.

This spec must remain simple and safe.

### Decision 3 — Compatibility adapters remain
The app may still receive:

- legacy `planner_object_schemas.fields[]`

So the UI must:

- prefer v3 `document_schemas` when present
- fall back to v2 field lists

---

## Implementation plan

### 1) Define TypeScript types for Pack v1 (canonical shape)

**Create:** `apps/web/src/curriculum/runtime/types.ts`

```ts
export interface CurriculumPackIdentity {
  key: string;
  version: string;
  label?: string;
}

export interface PackDocumentType {
  label: string;
  allowed_schema_keys: string[];
  default_schema_key: string;
  allowed_statuses?: string[];
  default_status?: string;
  relationships?: Record<
    string,
    {
      allowed_target_types: string[];
      max?: number;
      ordered?: boolean;
    }
  >;
}

export interface PackDocumentSchema {
  document_type: string;
  label?: string;
  data_schema: Record<string, any>;
  ui_schema: Record<string, any>;
}

export interface CurriculumPackV1 {
  identity: {
    key: string;
    label: string;
    description?: string;
    jurisdiction?: string;
  };
  versioning: {
    version: string;
    schema_version: string;
    compatibility?: string;
  };
  status?: "active" | "deprecated";
  terminology?: Record<string, string>;
  navigation?: Record<string, string[]>;
  visible_navigation?: string[];

  document_types: Record<string, PackDocumentType>;
  document_schemas: Record<string, PackDocumentSchema>;

  workflow_bindings?: Record<string, string>;
  workflow_definitions?: Record<string, any>;

  framework_bindings?: {
    defaults?: string[];
    allowed?: string[];
    node_kinds?: string[];
  };
}
```

---

### 2) Define “Pack Runtime Subset” payload shape

This is a backend/contract decision, but the frontend needs to code against it.

**Recommended backend response embedding**

Add a `curriculum_runtime` block to:

- `PlanningContext` show response
- `CurriculumDocument` show response
- potentially `Course` show response

Example:

```json
{
  "curriculum_runtime": {
    "pack_key": "ib_continuum",
    "pack_version": "2026.1",
    "terminology": { "unit_label": "Unit" },
    "document_types": {
      "unit_plan": { "label": "Unit", "default_schema_key": "ib.myp.unit@v1" }
    },
    "framework_bindings": { "defaults": ["myp_atl"], "allowed": ["myp_atl","ngss"] }
  }
}
```

**Create:** `apps/web/src/curriculum/runtime/normalizePackSubset.ts`

Normalize and provide stable defaults.

---

### 3) Upgrade UI schema types to support richer field specs

**Modify:** `apps/web/src/curriculum/schema/types.ts`

Add field object spec support:

```ts
export interface UiFieldSpec {
  path: string;
  label?: string;
  widget?: string; // must exist in widget registry
  description?: string;
  placeholder?: string;
  // conditional visibility (Step 3 baseline)
  visible_if?: {
    path: string;
    equals?: any;
    not_equals?: any;
    exists?: boolean;
  };
}

export interface UiSchemaSection {
  id?: string;
  title?: string;
  description?: string;
  fields: Array<string | UiFieldSpec>;
}

export interface UiSchema {
  layout?: "sections" | "tabs";
  sections?: UiSchemaSection[];
}
```

Maintain backward compatibility:

- If a field is a string, treat it as `{ path: string }`.

---

### 4) Add a simple visibility evaluator

**Create:** `apps/web/src/curriculum/schema/visibility.ts`

Implement:

```ts
import { getAtPath } from "./paths";

export function isFieldVisible(spec: UiFieldSpec, value: any): boolean {
  if (!spec.visible_if) return true;
  const rule = spec.visible_if;
  const current = getAtPath(value, rule.path);

  if (rule.exists !== undefined) {
    return rule.exists ? current !== undefined && current !== null && current !== "" : !current;
  }
  if (rule.equals !== undefined) return current === rule.equals;
  if (rule.not_equals !== undefined) return current !== rule.not_equals;
  return true;
}
```

This covers 80% of real planners.

---

### 5) Upgrade `SchemaRenderer` to support field specs + tab layout

**Modify:** `apps/web/src/curriculum/schema/SchemaRenderer.tsx`

Changes:

- Accept `sections.fields` entries as string OR object.
- Determine label:
  - use `fieldSpec.label` if provided
  - else fall back to schema property title or a title-cased path
- Determine widget:
  - use `fieldSpec.widget` if provided and exists in registry
  - else infer via `inferWidget`
- Apply visibility:
  - skip fields when `isFieldVisible(...)` is false

Add `layout: "tabs"` support:

- Render a tab bar and allow switching between sections.
- Default is `sections` (vertical stacked cards).

Keep accessibility:

- tabs should be keyboard navigable

---

### 6) Upgrade navigation label mapping to prefer document type labels

**Modify:** `apps/web/src/curriculum/navigation/buildNav.ts`

Currently terminology overrides only affect “Units”. In v3, the pack can define:

- document type labels (e.g., `document_types.unit_plan.label = "Scheme of Work"`)

Implement a label override pipeline:

1. Start from nav registry base label.
2. Apply terminology override (legacy).
3. Apply document type label override:
   - If nav child id is `plan.units`, label should be plural of `document_types.unit_plan.label`.

To do this, `buildNav` must accept an optional `documentTypes` map from runtime.

If not available, fall back to legacy terminology.

---

### 7) Implement a Create Document Wizard

**Create:** `apps/web/src/curriculum/documents/CreateDocumentWizard.tsx`

Goal:

- Create a new Curriculum Document using pack-defined document types and schemas.

Inputs:

- `planningContextId` (required)
- optional preselected `documentType` (e.g., unit_plan)

UI steps:

1. Select document type (from pack runtime subset)
2. Select schema variant (allowed schema keys)
3. Enter title
4. Confirm and create

API call:

- `POST /api/v1/curriculum_documents`:

```json
{
  "planning_context_id": 123,
  "document_type": "unit_plan",
  "title": "Unit 1",
  "schema_key": "ib.myp.unit@v1"  // optional if backend picks default
}
```

After create:

- redirect to `/plan/documents/:id` (editor)

Backwards compatibility:

- If pack runtime subset is missing `document_types`, fall back to old behavior:
  - only offer `unit_plan` and `lesson_plan`
  - no schema selection

---

### 8) Add a minimal Pack fetch hook for admin tooling

Admins may need to inspect pack definitions.

**Create:** `apps/web/src/curriculum/runtime/useCurriculumPack.ts`

Assuming backend provides:

- `GET /api/v1/curriculum_packs/:key/:version`

Return a `CurriculumPackV1`.

If the endpoint does not exist yet, keep this hook stubbed and implement once backend provides it.

---

## Testing

### Unit tests

- `SchemaRenderer`:
  - renders `tabs` layout
  - respects `visible_if`
  - uses explicit widget override

- `buildNav`:
  - when document type label is “Scheme of Work”, nav child shows “Schemes of Work” (implement plural rules)

### E2E

- Create document wizard:
  - create `unit_plan` document
  - ensure schema_key used is the pack default if not explicitly chosen

---

## Acceptance criteria

- Packs can define new document types and the UI can display them without new hard-coded forms.
- `ui_schema` can declare field labels, widgets, and visibility.
- Navigation labels reflect document type labels when provided.
- Document creation is constrained by pack-defined allowed schema keys.

---

## Rollout notes

- Keep the UI schema spec stable and documented.
- Prefer additive changes: accept both string and object field specs.
- Keep old UnitPlan pages until Step 5 migration; do not remove them yet.
