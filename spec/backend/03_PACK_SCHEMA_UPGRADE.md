# Step 3 — Upgrade the pack schema to express real unit/lesson structures

## Outcome

After this step:

- Curriculum packs (formerly “profiles”) can describe **real planning structures**:
  - document types (unit, lesson, template, programme of inquiry, scheme of work, etc.)
  - schema variants per document type
  - allowed parent/child relationships
  - workflow bindings (by document type)
  - framework bindings (standards / skills / concepts)
- Packs are validated via a **formal JSON Schema** (Draft 2020-12).
- The backend can normalize older packs (v1/v2) into the new canonical shape.

This step lays the foundation for Step 4 (pack-defined workflows) and Step 5 (generic Curriculum Documents).

---

## Why the current v2 pack schema is insufficient

Current `profile.v2.schema.json` is mostly:

- terminology
- navigation
- `planner_object_schemas.fields` (a light “form builder”)
- workflow_bindings (string keys only)

It cannot express:

- multi-level structures beyond unit/lesson/template
- relationships (PoI contains units, units contain lessons, etc.)
- schema variants (PYP vs MYP vs DP)
- workflow definitions themselves
- framework bindings beyond a simple tag list

---

## Design decisions

### Decision 1 — Introduce a Pack Schema v3 (called “CurriculumPack v1”)
We’ll add a new canonical pack schema file and support legacy packs via normalization.

### Decision 2 — Separate “document schema” from “document type”
- `document_type` is a stable identifier (`unit_plan`, `lesson_plan`, `scheme_of_work`, etc.)
- `schema_key` selects a particular JSON schema variant for a type (`ib.pyp.unit@v1`, `us.unit@v1`)

### Decision 3 — Express relationships as constraints, not code
Pack should declare what relationships are allowed; backend enforces.

---

## Canonical pack shape (v3 / CurriculumPack v1)

Create a new schema file:

- `packages/contracts/curriculum-profiles/pack.v1.schema.json`

### Top-level sections (minimum)

```json
{
  "identity": { "key": "ib_continuum", "label": "IB Continuum", "description": "...", "jurisdiction": "IB" },
  "versioning": { "version": "2026.1", "schema_version": "3.0", "compatibility": "v3" },
  "status": "active",

  "terminology": { "subject_label": "Subject", "grade_label": "Grade", "unit_label": "Unit" },
  "navigation": { "teacher": ["dashboard", "plan"], "student": ["learn"] },
  "capability_modules": { "portfolio": true, "pastoral": true },

  "document_types": { ... },
  "document_schemas": { ... },

  "workflow_definitions": { ... },
  "workflow_bindings": { ... },

  "framework_bindings": { ... },
  "report_bindings": { ... },
  "integration_hints": { ... }
}
```

### `document_types`

Defines what document types exist and their constraints.

```json
{
  "document_types": {
    "unit_plan": {
      "label": "Unit",
      "allowed_schema_keys": ["ib.pyp.unit@v1", "ib.myp.unit@v1", "ib.dp.unit@v1"],
      "default_schema_key": "ib.myp.unit@v1",
      "allowed_statuses": ["draft", "pending_approval", "published", "archived"],
      "default_status": "draft",
      "relationships": {
        "contains": {
          "allowed_target_types": ["lesson_plan"],
          "max": 999,
          "ordered": true
        }
      }
    },
    "lesson_plan": {
      "label": "Lesson",
      "allowed_schema_keys": ["ib.myp.lesson@v1"],
      "default_schema_key": "ib.myp.lesson@v1",
      "allowed_statuses": ["draft", "published"],
      "default_status": "draft"
    },
    "programme_of_inquiry": {
      "label": "Programme of Inquiry",
      "allowed_schema_keys": ["ib.pyp.poi@v1"],
      "default_schema_key": "ib.pyp.poi@v1",
      "relationships": {
        "contains": {
          "allowed_target_types": ["unit_plan"],
          "max": 6,
          "ordered": true
        }
      }
    }
  }
}
```

### `document_schemas`

Each schema is a JSON Schema (Draft 2020-12).

```json
{
  "document_schemas": {
    "ib.pyp.unit@v1": {
      "document_type": "unit_plan",
      "label": "PYP Unit Planner",
      "data_schema": {
        "type": "object",
        "required": ["central_idea"],
        "properties": {
          "central_idea": { "type": "string", "minLength": 1 },
          "lines_of_inquiry": { "type": "array", "items": { "type": "string" } }
        },
        "additionalProperties": false
      },
      "ui_schema": {
        "sections": [
          { "title": "Central Idea", "fields": ["central_idea"] }
        ]
      }
    }
  }
}
```

Backend must treat `ui_schema` as opaque JSON (store/return; do not execute).

### `workflow_definitions`

Define workflows in JSON (Step 4 consumes this).

```json
{
  "workflow_definitions": {
    "unit_default": {
      "states": ["draft", "pending_approval", "published", "archived"],
      "events": {
        "submit_for_approval": {
          "from": ["draft"],
          "to": "pending_approval",
          "roles": ["teacher", "curriculum_lead", "admin"],
          "side_effects": [ { "type": "create_approval" } ]
        },
        "publish": {
          "from": ["draft", "pending_approval"],
          "to": "published",
          "roles": ["teacher", "curriculum_lead", "admin"],
          "guards": [ { "type": "approval_not_required_or_approved" } ]
        }
      }
    }
  },
  "workflow_bindings": {
    "unit_plan": "unit_default",
    "lesson_plan": "lesson_default"
  }
}
```

### `framework_bindings`

Declares which curriculum frameworks are relevant for the pack.

```json
{
  "framework_bindings": {
    "defaults": ["ccss_ela", "ngss"],
    "allowed": ["ccss_ela", "ngss", "pyp_atl", "myp_objectives"],
    "node_kinds": ["standard", "skill", "concept"]
  }
}
```

Step 7 implements the generic framework storage.

---

## Implementation plan

### 1) Add the new JSON Schema contract

**Create:** `packages/contracts/curriculum-profiles/pack.v1.schema.json`

Minimum requirements:

- enforce presence of key sections
- enforce that `document_schemas.*.data_schema` is a JSON object
- enforce that `document_schemas.*.document_type` matches a key in `document_types`
- enforce that `document_types.*.allowed_schema_keys` refers to keys in `document_schemas`

Keep the schema strict enough to prevent malformed packs, but not so strict that it blocks iteration.

---

### 2) Update system pack JSON examples

**Modify:**

- `packages/contracts/curriculum-profiles/ib_continuum_v1.json`
- `packages/contracts/curriculum-profiles/american_common_core_v1.json`
- `packages/contracts/curriculum-profiles/british_cambridge_v1.json`

Update them to the new v3 shape.

Tip: Keep them minimal initially:

- define `unit_plan`, `lesson_plan`, `template`
- define one schema per type
- define one workflow per type

---

### 3) Upgrade backend pack validation

**Modify:** `apps/core/app/services/curriculum_profile_registry.rb`

#### 3.1) Load and validate against the JSON Schema

- Load `pack.v1.schema.json` file
- Validate pack payloads using `json_schemer`

Add:

- `validate_against_schema(payload)`

Return structured errors.

#### 3.2) Backwards compatibility adapters

Continue supporting:

- v1 packs (legacy keys: `planner_taxonomy`, `subject_options`, etc.)
- v2 packs (`planner_object_schemas.fields`)

Approach:

- Detect payload shape:
  - v3: has `document_types` and `document_schemas`
  - v2: has `planner_object_schemas`
  - v1: has `planner_taxonomy` and `subject_options`

Then normalize into canonical v3 internal representation.

For legacy packs:

- Convert `planner_object_schemas.unit_plan.fields` into a synthetic JSON schema:
  - `fields[].required` becomes `required` array
  - `component` determines JSON type (`text` → string, `date` → string format date)

This allows Step 2/5 to treat *all* packs as having `document_schemas`.

#### 3.3) Security checks (must-have)

Extend semantic validation:

- reject strings containing `<script`, `javascript:` etc. (already present)
- reject `ui_schema` fields that look like they include executable HTML
- reject JSON schemas that contain `$ref` with `http://` or `https://`

The pack schema itself should also prohibit remote `$ref`.

---

### 4) Update resolver output to include new pack sections

**Modify:** `apps/core/app/services/curriculum_profile_resolver.rb`

Add resolved keys:

- `document_types`
- `document_schemas` (optional; can be large—consider returning only schema keys in runtime payload)
- `workflow_definitions`
- `framework_bindings`

Do not break existing keys (`planner_object_schemas`, etc.).

Suggested compromise:

- Keep `planner_object_schemas` for legacy frontend.
- Add `document_types` + `document_schema_index` for new frontend.

Example:

```json
{
  "document_schema_index": {
    "unit_plan": {
      "default_schema_key": "ib.myp.unit@v1",
      "allowed_schema_keys": ["ib.myp.unit@v1"]
    }
  }
}
```

---

### 5) Update OpenAPI contracts

**Modify:** `packages/contracts/core-v1.openapi.yaml`

- Extend `CurriculumProfile` schema or introduce `CurriculumPack` schema.
- Document new fields.

Keep backwards-compatible fields present.

---

## Tests

- Pack registry loads system packs and validates them against `pack.v1.schema.json`
- Legacy pack JSON is normalized into v3 shape
- Remote `$ref` is rejected
- A malformed `document_types` reference produces a useful validation error

---

## Rollout plan

Introduce feature flag:

- `curriculum_pack_schema_v3` (default false)

When off:
- accept v1/v2 packs only

When on:
- accept v3 packs
- still accept v1/v2 via normalization

---

## Acceptance criteria

- System packs validate against the new schema.
- Resolver runtime payload includes document type metadata.
- Packs can express structures needed for IB PYP/MYP/DP and non-IB curricula.
