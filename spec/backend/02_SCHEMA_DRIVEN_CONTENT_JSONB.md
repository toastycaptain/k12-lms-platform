# Step 2 — Schema-driven planner content in JSONB (backend curriculum-aware)

## Outcome

After this step:

- Planning artifacts (units, lessons, templates, PoI, schemes of work, etc.) store their editable content as **JSONB**.
- The backend validates that JSONB against a **pack-defined JSON Schema**.
- Every document is **pinned** to a specific pack key + pack version (deterministic curriculum context).
- The backend becomes truly curriculum-aware: it can reject invalid content for IB vs American vs British schemas.

This step focuses on:

- schema-driven storage
- validation
- pinning

It assumes Step 1 (Pack Store) exists.

> Note: In Route 3, the JSONB content lives on `CurriculumDocumentVersion` (introduced in Step 5). If you implement Step 2 before Step 5, you can temporarily apply the same patterns to `UnitVersion/LessonVersion/TemplateVersion` and later migrate.

---

## Why this matters

A curriculum-adaptive LMS cannot hard-code planner fields.

Examples:

- IB PYP unit requires `central_idea`, `lines_of_inquiry`, `learner_profile`, `atl_skills`.
- American unit may require `priority_standards`, `learning_targets`, `success_criteria`.
- British SoW may require `key_stage`, `year`, `misconceptions`, `retrieval_practice`.

All of these must be expressible and enforced at runtime by the selected curriculum pack.

---

## Design decisions

### Decision 1 — JSON Schema for validation
Use JSON Schema (Draft 2020-12) as the **backend validation** mechanism.

- Pack defines schemas
- Backend validates `content` against schema

### Decision 2 — UI schema is a frontend concern
Pack may also include UI schema, but backend only needs:

- `data_schema`
- a stable `schema_key`

### Decision 3 — Pin pack + schema on the document
When a document is created:

- Resolve effective pack (tenant/school/course context)
- Pin `pack_key`, `pack_version`
- Pick a `schema_key` allowed for that document type

All future edits must validate using the pinned pack/schema.

---

## Implementation plan

### 1) Add JSON Schema validation library

**Modify:** `apps/core/Gemfile`

Add:

```rb
gem "json_schemer", "~> 2.4"
```

Run:

```bash
cd apps/core
bundle install
```

---

### 2) Implement a reusable JSON schema validator

**Create:** `apps/core/app/services/curriculum/json_schema_validator.rb`

Responsibilities:

- compile schemas
- validate JSON objects
- return structured errors

Suggested implementation shape:

```rb
module Curriculum
  class JsonSchemaValidator
    class ValidationError < StandardError
      attr_reader :errors
      def initialize(errors)
        @errors = errors
        super("Schema validation failed")
      end
    end

    def self.validate!(schema:, data:)
      schemer = JSONSchemer.schema(schema)
      errors = schemer.validate(data).to_a
      raise ValidationError, errors if errors.any?
      true
    end
  end
end
```

Notes:

- `errors` from json_schemer include paths; keep them for frontend display.
- Ensure `schema` is a Ruby hash with string keys.

---

### 3) Define how packs expose document schemas

This step depends on Step 3 (pack schema upgrade). The pack must define document schemas.

Minimum pack fields required for this step:

```json
{
  "document_schemas": {
    "unit_plan@v1": {
      "document_type": "unit_plan",
      "data_schema": { "type": "object", "properties": { ... } }
    }
  },
  "document_types": {
    "unit_plan": {
      "allowed_schema_keys": ["unit_plan@v1"],
      "default_schema_key": "unit_plan@v1"
    }
  }
}
```

Backend must not accept arbitrary schemas from clients.

Rules:

- Client may request a schema key, but backend verifies it is included in `allowed_schema_keys` for that document type.
- If not provided, backend uses `default_schema_key`.

---

### 4) Implement schema lookup from a resolved pack

**Create:** `apps/core/app/services/curriculum/pack_schema_resolver.rb`

Responsibilities:

- Fetch pack payload via `CurriculumPackStore`
- Return the correct schema definition by `schema_key`
- Enforce that schema belongs to the correct document type

Suggested API:

```rb
module Curriculum
  class PackSchemaResolver
    def self.resolve_schema!(tenant:, pack_key:, pack_version:, document_type:, schema_key:)
      pack = CurriculumPackStore.fetch(tenant: tenant, key: pack_key, version: pack_version)
      raise ActiveRecord::RecordNotFound, "Pack not found" if pack.nil?

      schema = (pack["document_schemas"] || {}).fetch(schema_key)
      raise ActiveRecord::RecordNotFound, "Schema not found" if schema.nil?

      if schema["document_type"].to_s != document_type.to_s
        raise ArgumentError, "Schema #{schema_key} does not match document_type #{document_type}"
      end

      schema
    end
  end
end
```

Security:

- Don’t allow `$ref` to load remote schemas.
- Prefer to validate pack payloads in Step 3 to disallow unsafe schema references.

---

### 5) Implement curriculum-aware document validation

**Create:** `apps/core/app/services/curriculum/document_content_service.rb`

Responsibilities:

- validate content for a document version
- enforce payload size limits
- sanitize strings defensively

Suggested validations:

- `content` must be an object
- `content` JSON size ≤ 1–2MB (configurable)
- string length constraints (schema should enforce; still add a safety net)

Workflow:

```rb
module Curriculum
  class DocumentContentService
    MAX_JSON_BYTES = 2.megabytes

    def self.validate_content!(tenant:, pack_key:, pack_version:, document_type:, schema_key:, content:)
      raise ArgumentError, "content must be a Hash" unless content.is_a?(Hash)

      json_bytes = content.to_json.bytesize
      raise ArgumentError, "content too large" if json_bytes > MAX_JSON_BYTES

      schema_def = PackSchemaResolver.resolve_schema!(
        tenant: tenant,
        pack_key: pack_key,
        pack_version: pack_version,
        document_type: document_type,
        schema_key: schema_key
      )

      Curriculum::JsonSchemaValidator.validate!(
        schema: schema_def.fetch("data_schema"),
        data: content
      )

      true
    end
  end
end
```

---

### 6) Add pack/schema pinning fields to documents

This is implemented in Step 5 migrations for `curriculum_documents`.

Required columns on the **document**:

- `pack_key` (string, not null)
- `pack_version` (string, not null)
- `schema_key` (string, not null)

Optional but recommended:

- `pack_payload_checksum` (string) stored at creation time (helps detect drift)

Backend rule:

- `pack_key/pack_version/schema_key` are immutable after creation.

---

### 7) Enforce validation during version creation

Whenever the API creates a new version (Step 5 controllers), do:

1. Read pinned `pack_key/pack_version/schema_key` from the document
2. Validate incoming `content`
3. Persist `CurriculumDocumentVersion.content = content`

If validation fails, respond `422` with structured schema error details.

Example error payload:

```json
{
  "error": "schema_validation_failed",
  "details": [
    { "data_pointer": "/central_idea", "type": "required" }
  ]
}
```

---

## Tests

### Unit tests

- `Curriculum::JsonSchemaValidator` returns errors with correct pointers
- `Curriculum::PackSchemaResolver` rejects mismatched document_type
- `Curriculum::DocumentContentService` rejects oversized payloads

### Request specs (once Step 5 endpoints exist)

- creating a version with valid content returns 201
- creating a version with invalid content returns 422 with schema errors
- attempting to use a schema_key not allowed for the document_type returns 422/400

---

## Rollout plan

### Feature flags
Add feature flags so you can migrate gradually:

- `curriculum_document_schema_validation_v1` (default false)

When off:
- accept `content` but do not validate

When on:
- enforce JSON schema validation

### Compatibility
If you must keep old planner APIs temporarily:

- store legacy fields into `content` on write
- derive legacy fields from `content` on read
- mark legacy fields deprecated in OpenAPI

---

## Acceptance criteria

- Documents store planner content in JSONB.
- Pack-defined JSON schema controls what keys are accepted.
- Backend rejects invalid IB/American/British payloads.
- Pack key/version/schema key is pinned at creation and used consistently for validation.
