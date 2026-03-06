# Step 7 — Make standards/frameworks generic and searchable

## Outcome

After this step:

- “Standards” become a generic **Framework / Node** system that can represent:
  - standards (Common Core, NGSS)
  - learning objectives (Cambridge)
  - IB ATL skills
  - key concepts / related concepts
  - assessment criteria strands
- Nodes are **searchable** via fast full-text search.
- Curriculum packs can declare:
  - which frameworks are allowed
  - which ones are defaults
  - what node kinds exist
- Route 3 documents can align their versions to framework nodes.

---

## Why this is needed

A modular curriculum LMS must unify alignment across curricula.

Examples:

- American: unit aligns to standards
- IB: unit aligns to ATL skills + key/related concepts + inquiry skills
- British: scheme aligns to objectives + misconceptions

A single “Standard” model can represent these if we:

- generalize naming
- allow multiple node kinds
- make searching & browsing robust

---

## Current state in this repo

You already have:

- `StandardFramework` table: `name, jurisdiction, subject, version`
- `Standard` table with a hierarchy: `parent_id, code, description, grade_band` + `search_vector`
- caching for `standard_frameworks#index` and `standards#index`
- a `/standard_frameworks/:id/tree` endpoint

We will evolve this into a generic system while keeping backwards compatibility.

---

## Key design decisions

### Decision 1 — Extend existing tables first
To avoid rewriting all join tables immediately, extend:

- `standard_frameworks`
- `standards`

…and treat them as “frameworks” and “framework nodes”.

Later, you can rename tables/models when the system stabilizes.

### Decision 2 — Add `kind` fields
- Frameworks can have a primary kind (e.g., `standard`, `skill`)
- Nodes can have their own kind (mixed kinds inside a framework)

### Decision 3 — Provide a real search endpoint
Search must:

- be un-cached or query-key cached
- rank results
- filter by framework, grade band, kind

---

## Database changes

### 1) Extend standard_frameworks

**Migration:** `XXXXXXXXXXXXXX_extend_standard_frameworks_for_generic_frameworks.rb`

Add columns:

- `key` (string, nullable initially)
  - unique per tenant (when present)
  - used by packs to reference frameworks deterministically

- `framework_kind` (string, not null, default: `"standard"`)
  - examples: `standard`, `skill`, `concept`, `objective`

- `metadata` (jsonb, not null, default `{}`)

- `status` (string, not null, default `"active"`)

Indexes:

- unique index on `(tenant_id, key)` where key is not null
- index on `(tenant_id, framework_kind)`

### 2) Extend standards (nodes)

**Migration:** `XXXXXXXXXXXXXX_extend_standards_for_generic_nodes.rb`

Add columns:

- `kind` (string, not null, default: `"standard"`)
- `label` (string, nullable)
  - short display name
- `identifier` (string, nullable)
  - stable identifier if no code

- `metadata` (jsonb, not null, default `{}`)

Relax constraints:

- If you need nodes without `code`, either:
  1) allow `code` to be null, OR
  2) keep code required but generate synthetic codes.

Recommended long-term:

- allow `code` to be null
- require at least one of `code` or `identifier` or `label`

Add a validation in the model instead of DB constraint.

Indexes:

- `(tenant_id, standard_framework_id)`
- `(tenant_id, kind)`

### 3) Update full-text search triggers

The repo currently has `AddFullTextSearchTriggers` migration that sets:

- `standards.search_vector` from code + description + grade_band

Update the trigger function to include new fields:

- label
- identifier
- kind

Example expression:

```sql
setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
setweight(to_tsvector('english', coalesce(NEW.identifier, '')), 'A') ||
setweight(to_tsvector('english', coalesce(NEW.label, '')), 'B') ||
setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
setweight(to_tsvector('english', coalesce(NEW.grade_band, '')), 'C')
```

---

## Model changes

### StandardFramework

**Modify:** `apps/core/app/models/standard_framework.rb`

- add validations for `framework_kind`
- add optional validation for unique `key` per tenant

Later you can rename the model to `Framework`.

### Standard

**Modify:** `apps/core/app/models/standard.rb`

- add validations for `kind`
- add validation: require at least one of `code`, `identifier`, `label`

Add search scopes:

```rb
scope :search, ->(q) {
  where("search_vector @@ plainto_tsquery('english', ?)", q)
}
```

For ranked search:

```rb
select("standards.*, ts_rank(search_vector, plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(q)})) AS rank")
.order("rank DESC")
```

---

## API changes

### 1) Make frameworks index filterable

**Modify:** `apps/core/app/controllers/api/v1/standard_frameworks_controller.rb`

Add query params:

- `framework_kind`
- `status`

If `framework_kind` present:

- filter: `where(framework_kind: params[:framework_kind])`

Cache key must include filters.

Current cache key:

- `tenant:{tenant_id}:standard_frameworks`

Update to:

- `tenant:{tenant_id}:standard_frameworks:{kind || 'all'}:{status || 'all'}`

### 2) Add a real search endpoint for nodes

Option A (minimal change): add `q` to `standards#index`.

**Modify:** `apps/core/app/controllers/api/v1/standards_controller.rb`

Behavior:

- If `params[:q]` present:
  - do NOT use cached list
  - run `Standard.search(q)`
  - allow filters:
    - `standard_framework_id`
    - `kind`
    - `grade_band`
  - paginate results

Option B (cleaner): add `/standards/search`.

Routes:

```rb
resources :standards do
  collection { get :search }
end
```

Controller action `search` uses full-text rank.

### 3) Tree endpoint should support node kinds

Update `StandardsController#tree` to accept:

- `kind` filter

If `kind` present:

- only include nodes with that kind

---

## Pack integration

### 1) Resolver should return framework defaults from packs

**Modify:** `apps/core/app/services/curriculum_profile_resolver.rb`

Currently:

- `framework_defaults = Array(profile["framework_defaults"] || ...)`

Update to:

- `framework_defaults = Array(profile.dig("framework_bindings", "defaults") || profile["framework_defaults"] || ...)`

### 2) Packs reference frameworks by `StandardFramework.key`

Ensure packs include framework keys, not numeric IDs.

Backend can map keys → IDs for the tenant.

---

## Aligning Route 3 documents to framework nodes

This is optional but strongly recommended in Route 3.

### 1) Add alignments table for CurriculumDocumentVersion

**Migration:** `XXXXXXXXXXXXXX_create_curriculum_document_version_alignments.rb`

Table: `curriculum_document_version_alignments`

- `tenant_id` (FK, not null)
- `curriculum_document_version_id` (FK, not null)
- `standard_id` (FK to standards, not null)
- `alignment_type` (string, not null, default: `"aligned"`)
- `metadata` (jsonb, not null, default `{}`)
- timestamps

Indexes:

- unique `(curriculum_document_version_id, standard_id, alignment_type)`
- index `(tenant_id, standard_id)`

### 2) Controller for alignments

Add:

- `Api::V1::CurriculumDocumentVersionAlignmentsController`

Routes:

```rb
resources :curriculum_document_versions, only: [] do
  resources :alignments, controller: "curriculum_document_version_alignments", only: [:index, :create] do
    collection { delete :bulk_destroy }
  end
end
```

This mirrors existing `unit_version_standards_controller`.

---

## Tests

- creating a framework with framework_kind works
- creating nodes with kind/label/identifier works
- search endpoint returns ranked results
- resolver returns pack framework defaults
- document-version alignments can be created and listed

---

## Rollout plan

Feature flags:

- `generic_frameworks_v1` (default false)

When off:

- existing standards behavior unchanged

When on:

- controllers accept kind/key filters
- search endpoint enabled
- packs can reference frameworks by key

---

## Acceptance criteria

- Frameworks support kinds and stable keys.
- Nodes support multiple kinds and are full-text searchable.
- Packs can declare default frameworks.
- Route 3 documents can align versions to framework nodes.
