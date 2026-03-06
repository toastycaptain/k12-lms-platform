# Step 2 — Schema-driven planner content (JSONB) + curriculum-aware editor UI (Frontend)

## Outcome

After this step:

- The planning editor UI is **schema-driven**:
  - the backend provides a pinned `(pack_key, pack_version, schema_key)` for each document
  - the backend provides `(data_schema, ui_schema)` for that schema
  - the frontend renders the document editor from those schemas
- Document content is stored as **JSON** (`content`) and submitted to the backend as JSON.
- When the backend rejects invalid content (422 schema validation), the UI shows:
  - a clear top-level error
  - field-level errors mapped to the correct inputs

This step is the foundation that allows IB vs American vs British documents to have different native structures without forking UI code.

---

## Dependencies

This step assumes backend Route 3 provides:

- Generic Curriculum Document APIs (created in backend Step 5):
  - `GET /api/v1/curriculum_documents/:id`
  - `GET /api/v1/curriculum_documents/:id/versions`
  - `POST /api/v1/curriculum_documents/:id/versions`

And pack/schema availability from backend Step 2/3:

One of the following must exist (choose one and stick to it):

### Option A (recommended): Document schema endpoint
- `GET /api/v1/curriculum_documents/:id/schema` returns:

```json
{
  "schema_key": "ib.pyp.unit@v1",
  "data_schema": { ...JSON Schema... },
  "ui_schema": { ...UI schema... }
}
```

### Option B: Embed schema in document show response
- `GET /api/v1/curriculum_documents/:id` includes:

```json
{
  "schema": {
    "schema_key": "...",
    "data_schema": { ... },
    "ui_schema": { ... }
  }
}
```

The frontend playbook below assumes **Option A** but notes where to adjust for Option B.

---

## Design decisions

### Decision 1 — Widget registry + safe defaults
The UI schema can *hint* at widgets, but the frontend must be able to render a reasonable editor even when `ui_schema` is minimal.

- Default widget is inferred from `data_schema` type.
- Only widgets from a **known registry** are allowed.

### Decision 2 — Minimal JSON Schema feature support first
Implement a reliable baseline that covers most curriculum planners:

- `string`, `number`, `integer`, `boolean`
- `enum` (select)
- arrays of primitives (repeatable lists)
- objects with properties

Advanced features (oneOf, conditional logic, etc.) are added in Step 3.

### Decision 3 — Immutable updates with path utilities
Document content is nested JSON.

- Use dot-path or JSON pointer conversion utilities.
- Always update content immutably (no in-place mutation).

---

## Implementation plan

### 1) Add schema + UI schema types

**Create:** `apps/web/src/curriculum/schema/types.ts`

Define minimal types so TS remains manageable.

```ts
export type JsonSchema = Record<string, any>;

export interface UiSchemaSection {
  id?: string;
  title?: string;
  description?: string;
  fields: string[]; // dot paths
}

export interface UiSchema {
  sections?: UiSchemaSection[];
  // Step 3 will expand this.
}

export interface DocumentSchemaDefinition {
  schema_key: string;
  data_schema: JsonSchema;
  ui_schema: UiSchema;
}
```

---

### 2) Add path helpers

**Create:** `apps/web/src/curriculum/schema/paths.ts`

Functions required:

- `getAtPath(obj, path)`
- `setAtPath(obj, path, value)`
- `deleteAtPath(obj, path)`
- `pointerToDotPath("/a/b/0") -> "a.b.0"`

Example:

```ts
export function getAtPath(obj: any, path: string): any {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function setAtPath(obj: any, path: string, value: any): any {
  const parts = path.split(".");
  const clone = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  let cursor: any = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cursor[key];
    cursor[key] = Array.isArray(next) ? [...next] : { ...(next ?? {}) };
    cursor = cursor[key];
  }

  cursor[parts[parts.length - 1]] = value;
  return clone;
}

export function pointerToDotPath(pointer: string): string {
  return pointer
    .replace(/^#?\//, "")
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");
}
```

---

### 3) Add schema resolver utilities (subschema lookup)

**Create:** `apps/web/src/curriculum/schema/resolveSubschema.ts`

Given a JSON schema and a dot path, return the schema node for that field.

Minimum supported cases:

- `type: object` with `properties`
- `type: array` with `items`

Pseudo:

```ts
export function resolveSubschema(root: any, path: string): any {
  const parts = path.split(".");
  let schema = root;

  for (const part of parts) {
    if (!schema) return null;

    if (schema.type === "object" && schema.properties) {
      schema = schema.properties[part];
      continue;
    }

    if (schema.type === "array" && schema.items) {
      // numeric part indexes into array items
      schema = schema.items;
      continue;
    }

    // unsupported
    return null;
  }

  return schema;
}
```

---

### 4) Build widget components + registry

Create a widget registry so pack UI schema can request widgets by name.

**Create folder:** `apps/web/src/curriculum/schema/widgets/`

#### 4.1) Base widget props

**Create:** `widgets/types.ts`

```ts
export interface WidgetProps {
  path: string;
  label: string;
  description?: string;
  required?: boolean;
  schema: any;
  value: any;
  error?: string | null;
  onChange: (next: any) => void;
}
```

#### 4.2) Implement baseline widgets

Create:

- `TextWidget.tsx` (string)
- `TextAreaWidget.tsx` (string multiline)
- `SelectWidget.tsx` (enum)
- `CheckboxWidget.tsx` (boolean)
- `RepeatableListWidget.tsx` (array of strings)

Use existing `@k12/ui/forms` components when possible.

Example `TextWidget.tsx`:

```tsx
import { FormField, TextInput } from "@k12/ui/forms";
import type { WidgetProps } from "./types";

export default function TextWidget({ label, value, onChange, error, required }: WidgetProps) {
  return (
    <FormField label={label} error={error ?? undefined} required={required}>
      <TextInput value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}
```

#### 4.3) Registry

**Create:** `widgets/registry.tsx`

```ts
import TextWidget from "./TextWidget";
import TextAreaWidget from "./TextAreaWidget";
import SelectWidget from "./SelectWidget";
import CheckboxWidget from "./CheckboxWidget";
import RepeatableListWidget from "./RepeatableListWidget";

export const WIDGET_REGISTRY: Record<string, any> = {
  text: TextWidget,
  textarea: TextAreaWidget,
  select: SelectWidget,
  checkbox: CheckboxWidget,
  repeatable_list: RepeatableListWidget,
};
```

---

### 5) Implement schema → widget inference

**Create:** `apps/web/src/curriculum/schema/inferWidget.ts`

Rules (baseline):

- if `schema.enum` exists → `select`
- if `schema.type === "boolean"` → `checkbox`
- if `schema.type === "array"` and items are strings → `repeatable_list`
- if `schema.type === "string"` and `schema.maxLength` is large or `ui:widget === "textarea"` → `textarea`
- else string → `text`

Return widget key.

---

### 6) Implement schema error mapping

**Create:** `apps/web/src/curriculum/schema/errors.ts`

Goal: map backend schema validation failures to field errors.

Backend may respond with different shapes; be tolerant.

Expected (recommended) shape:

```json
{
  "error": "schema_validation_failed",
  "details": {
    "errors": [
      { "pointer": "/central_idea", "message": "is required" },
      { "pointer": "/lines_of_inquiry/0", "message": "must be a string" }
    ]
  }
}
```

Implement:

- `extractSchemaErrors(body): Record<dotPath, string>`

If you can’t parse, return `{}` and show generic error.

---

### 7) Build the `SchemaRenderer` component

**Create:** `apps/web/src/curriculum/schema/SchemaRenderer.tsx`

Props:

```ts
interface SchemaRendererProps {
  schema: DocumentSchemaDefinition;
  value: Record<string, any>;
  errors?: Record<string, string>;
  onChange: (next: Record<string, any>) => void;
}
```

Behavior:

1. Determine sections:
   - `schema.ui_schema.sections` if provided
   - else generate a single section listing top-level `data_schema.properties` keys

2. For each field path:
   - resolve subschema using `resolveSubschema`
   - infer widget key using `inferWidget`
   - render widget from `WIDGET_REGISTRY`

3. When widget changes a value:
   - call `setAtPath(value, path, next)` and pass up.

UI:

- render sections as cards with titles
- show field-level errors next to fields

---

### 8) Add Curriculum Document client types and hooks

**Create:** `apps/web/src/curriculum/documents/types.ts`

```ts
export interface CurriculumDocument {
  id: number;
  title: string;
  status: string;
  document_type: string;
  planning_context_id: number;
  pack_key: string;
  pack_version: string;
  schema_key: string;
  current_version?: CurriculumDocumentVersion | null;
}

export interface CurriculumDocumentVersion {
  id: number;
  version_number: number;
  title: string;
  content: Record<string, any>;
  created_at: string;
}
```

**Create:** `apps/web/src/curriculum/documents/hooks.ts`

Use SWR + `useAppSWR`.

- `useCurriculumDocument(id)`
- `useCurriculumDocumentVersions(id)`
- `createCurriculumDocumentVersion(id, payload)` (uses `apiFetch`)

**Important:** incorporate school scoping in SWR keys in Step 6.

---

### 9) Implement a generic `DocumentEditor` component

**Create:** `apps/web/src/curriculum/documents/DocumentEditor.tsx`

Inputs:

- `documentId: number`

Responsibilities:

1. Load document + versions.
2. Load schema definition for pinned schema:
   - call `/api/v1/curriculum_documents/:id/schema` (Option A)
3. Render:
   - title + status
   - version selector (read-only for old versions)
   - schema-driven editor for the latest version
   - Save as New Version

Save behavior:

- On save, call `POST /api/v1/curriculum_documents/:id/versions` with:

```json
{ "title": "<doc title>", "content": { ... } }
```

- If backend returns 422 schema errors:
  - use `extractSchemaErrors` to map errors
  - show errors inline

UI notes:

- Keep edits in local React state; do not mutate SWR cache directly.
- After successful save:
  - revalidate document + versions
  - clear error state

---

### 10) Wire a temporary route for testing the editor

Until Step 5 restructures plan routes, add a minimal route for editing a curriculum document.

**Create:** `apps/web/src/app/plan/documents/[id]/page.tsx`

- `use client`
- wrap in `ProtectedRoute` + `AppShell`
- parse `id` from `useParams()`
- render `<DocumentEditor documentId={Number(id)} />`

This gives a stable place to develop/verify the schema editor.

---

## Testing

### Unit tests (Vitest)

Create tests for:

1. `pointerToDotPath` conversion
2. `setAtPath` immutability
3. `resolveSubschema` for nested objects and arrays
4. `SchemaRenderer` rendering:
   - given schema with `central_idea` (string), renders TextInput
   - given schema with `lines_of_inquiry` (array of string), renders RepeatableList

Suggested location:

- `apps/web/src/curriculum/schema/SchemaRenderer.test.tsx`

Mock UI components if needed.

### E2E (Playwright)

Add one smoke test:

- open `/plan/documents/:id`
- edit a required field
- save
- see version number increment

(Full curriculum scenarios come later.)

---

## Acceptance criteria

- The editor renders from schema with no hard-coded IB/US/UK assumptions.
- Saving invalid content produces visible, field-level errors.
- Saving valid content creates a new version and refreshes the view.
- No XSS paths are introduced (pack-provided strings rendered as plain text).

---

## Rollout notes

- Initially keep schema renderer limited; expand in Step 3.
- Keep old `/plan/units/:id` editor intact until Step 5 migration.
- Gate the new `/plan/documents/:id` route behind pack nav; only show it when a pack enables it.
