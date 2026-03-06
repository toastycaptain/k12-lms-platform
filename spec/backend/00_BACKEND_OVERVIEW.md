# Curriculum OS (Route 3) — Backend Overview

This folder contains **implementation playbooks** (step-by-step Markdown) for evolving the current Rails backend (`apps/core`) into a modular **Curriculum OS** that can support:

- IB (PYP/MYP/DP)
- American (standards-based)
- British / UK (National Curriculum / Cambridge / etc.)

…without forking the codebase.

The key principle is:

> Keep a stable platform “spine” (identity, permissions, tenancy, school scoping, storage, versioning), and make curriculum differences a **runtime-selected pack** that defines **schemas, workflows, objects, and framework bindings**.

---

## What already exists in this repo

The current codebase already has several foundations:

- **Curriculum profile files** under `packages/contracts/curriculum-profiles/*.json`
- **Profile v2 schema** under `packages/contracts/curriculum-profiles/profile.v2.schema.json`
- **DB storage** for imported profiles: `curriculum_profile_releases.payload` + lifecycle operations
- **Resolver**: `CurriculumProfileResolver` selects profile key/version via district → tenant → school → course → academic_year
- **Workflow engine** exists but is hard-coded (`CurriculumWorkflowEngine`)

Route 3 builds on this by:

1) Treating profiles as **curriculum packs** (runtime-selectable, versioned, releasable)
2) Moving planning artifacts into a **generic Curriculum Document model**
3) Making unit/lesson structures **schema-driven** (JSON Schema + UI schema) with backend validation
4) Making workflows **pack-defined**
5) Making “standards” a generic **framework/node** system
6) Enforcing **school scoping** for district-scale correctness

---

## Cross-cutting design rules

### Rule A — Runtime pack selection must be deterministic
- Every curriculum-relevant record (documents, contexts, alignments) must know which **pack key + pack version** it belongs to.
- **Never** rely on “current default pack” at edit time.
- Store the pinned pack identity at creation time.

### Rule B — Avoid code injection through packs
Pack JSON is untrusted input.
- Validate pack payloads against a JSON schema
- Perform semantic security checks (e.g., disallow `<script>` or inline event handlers)
- Packs may reference only a **known registry** of workflow side effects / schema widgets (frontend), not arbitrary executable code

### Rule C — Prefer additive migrations + compatibility layers
This repo already has `UnitPlan/LessonPlan/Template`. Route 3 introduces `CurriculumDocument`.

Plan for:
- introducing new models/endpoints in parallel
- migrating data gradually
- removing old code only after the frontend is migrated

### Rule D — Make district scaling safe
- Add `Current.school` and enforce school scoping in policy scopes
- Ensure cross-school access is explicit and permissioned (district admin vs school staff)

---

## Deliverables in this folder

This folder contains **7 build steps**, each as its own detailed implementation doc:

1. Runtime-selectable packs (finish profile releases)
2. Schema-driven planner content stored in JSONB + backend validation
3. Pack schema upgrade to express real unit/lesson structures
4. Pack-bound workflows (replace hard-coded engine)
5. Planning contexts + fully generic Curriculum Document model
6. School scoping enforcement
7. Generic frameworks/nodes + search

Each step includes:
- goals and non-goals
- database migrations
- model/service/controller changes
- caching and security notes
- tests and acceptance criteria
- rollout and backwards-compatibility plan

---

## Recommended implementation order

Although the steps are numbered, **Step 5 (Curriculum Documents)** strongly affects Step 2.

A practical order is:

1 → 3 → 4 → 5 → 2 → 6 → 7

However, the docs are written so you *can* implement them in numeric order if desired.

---

## Naming conventions

Current code uses **CurriculumProfile***.
Route 3 prefers **CurriculumPack***.

Implementation guidance:

- Introduce new `CurriculumPack*` classes that wrap/compose existing `CurriculumProfile*` initially.
- Keep existing table names until the refactor is stable.
- Only rename tables/models once API clients have migrated.
