# Curriculum OS (Route 3) — Frontend Overview

This folder contains **implementation playbooks** (step-by-step Markdown) for evolving the current Next.js frontend (`apps/web`) into a modular **Curriculum OS UI** that can support:

- **IB** (PYP/MYP/DP)
- **American** (standards-based)
- **British/UK** (National Curriculum / Cambridge / schemes of work)

…without forking the UI codebase.

The core principle is the same as the backend Route 3:

> Keep a stable UI “platform spine” (auth, tenancy, school scoping, navigation shell, fetch/caching, generic document editor) and let curriculum differences be expressed by **runtime-selected packs** that define **document types, schemas, workflows, framework bindings, and which modules/pages are visible**.

---

## What already exists in this repo (frontend)

The current frontend already has partial groundwork:

- A **runtime pack footprint** is returned on `/api/v1/me` as `tenant.curriculum_runtime` and surfaced on `user.curriculum_runtime`.
- `AppShell.tsx` already applies **terminology** (e.g., “Unit” label override) and filters top-level nav with `visible_navigation`.
- Admin UI exists for “Curriculum Profiles” (`/admin/curriculum-profiles`) including lifecycle operations (import/publish/freeze/rollback).
- SWR (`useAppSWR`) and `apiFetch` are established patterns.
- `SchoolSelector` persists a selected school id into localStorage and `apiFetch` forwards it via `X-School-Id`.

But the UI is still mostly **hard-coded**:

- Navigation is a static array.
- Planning pages are tied to `UnitPlan/LessonPlan/Template` models.
- Planner fields are hard-coded (US-ish plan fields) rather than schema-driven.
- Workflows are hard-coded around “draft/published”.
- Standards browsing is “standards-only” rather than “generic frameworks/nodes”.

These docs describe how to transform that into a **pack-driven modular UI**.

---

## Cross-cutting frontend design rules

### Rule A — Packs are untrusted input
Even though packs come from your system/DB, treat pack payloads as **untrusted**.

- Packs must never provide executable code.
- Packs may only reference **known registry IDs** for:
  - navigation item IDs
  - page/module IDs
  - schema widgets
  - workflow event labels

All user-visible text from packs must be rendered as **plain text** by default.

### Rule B — Server decides “what you are allowed to do”
The frontend should not compute workflow permissions or pack eligibility.

- For workflow actions, the backend should return **available events** for the current actor.
- For pack selection and overrides, the backend remains source of truth.

### Rule C — Stable routes, modular rendering
Next.js routing is compile-time.

To support pack-defined pages without shipping different builds:

- Keep a stable set of top-level workspaces (`/plan`, `/teach`, `/assess`, `/report`, `/communicate`, `/admin`, `/district`, `/learn`, `/guardian`).
- Implement **catch-all pages** inside workspaces (e.g., `/plan/[...slug]`) that render modules by ID via a registry.
- Packs can choose which module IDs appear in nav; the modules themselves are built and shipped once.

### Rule D — Cache is per school
District-scale correctness requires the UI cache to be scoped by selected school.

- Switching schools must not show stale cached data from the previous school.
- SWR keys should include school context (see Step 6).

### Rule E — Documents are the universal planning primitive
Frontend planning UI should converge on generic **Curriculum Documents** + **Planning Contexts**.

- “Unit”, “Lesson”, “Scheme of Work”, “Programme of Inquiry” are document types.
- Editor UI is schema-driven (JSON schema + UI schema).

---

## Deliverables in this folder

This folder contains **7 build steps**, each as its own detailed implementation doc, mirroring the backend steps but focusing on the Next.js frontend:

1. Runtime-selectable packs (UI can browse/select/manage pack versions; pack-driven nav)
2. Schema-driven planner content (JSONB) + curriculum-aware editing UI
3. Pack schema upgrade support (document types/schemas/UI schema consumption)
4. Pack-bound workflows (status/actions/history UI)
5. Planning contexts + fully generic Curriculum Documents (new Plan workspace & routes)
6. School scoping for district-scale correctness (school context provider + SWR scoping)
7. Generic frameworks/nodes + search (framework browser, pickers, alignment UI)

Each step includes:

- goals and non-goals
- UI/UX changes
- new modules/components/hooks
- exact file changes
- API expectations (what endpoints/payloads the backend must provide)
- tests and acceptance criteria
- rollout and backwards-compatibility notes

---

## Recommended implementation order (frontend)

A practical order that aligns with backend sequencing:

1 → 6 → 5 → 2 → 3 → 4 → 7

Rationale:

- Step 1 establishes pack-driven nav/management.
- Step 6 makes district-scale caching safe (otherwise everything becomes flaky).
- Step 5 introduces planning contexts and generic documents.
- Step 2 & 3 build the schema-driven editor atop documents.
- Step 4 adds pack workflows.
- Step 7 enhances frameworks and pickers.

You *can* implement them in numeric order; each doc notes dependencies.

---

## Naming convention note

Backend Route 3 moves from “profile” language to “pack” language.

Frontend should follow the same direction, but you can keep URLs stable during migration:

- Keep route `/admin/curriculum-profiles` initially, but update UI labels to “Curriculum Packs”.
- Keep reading `curriculum_runtime.profile_key/profile_version` until backend renames them.

In code:

- Prefer `CurriculumPack` types.
- Add compatibility adapters mapping legacy `profile_*` fields into `pack_*` fields.

---

## New recommended frontend folder structure

Create a new top-level folder under `apps/web/src`:

```
src/
  curriculum/
    runtime/
      types.ts
      useCurriculumRuntime.ts
      adapters.ts
    navigation/
      registry.ts
      buildNav.ts
    modules/
      registry.tsx
      moduleRouter.tsx
    schema/
      types.ts
      SchemaRenderer.tsx
      widgets/
        registry.tsx
        TextWidget.tsx
        TextAreaWidget.tsx
        SelectWidget.tsx
        RepeatableListWidget.tsx
        ObjectGroupWidget.tsx
      errors.ts
      paths.ts
    workflow/
      types.ts
      WorkflowBadge.tsx
      WorkflowActions.tsx
      useWorkflow.ts
    documents/
      types.ts
      hooks.ts
      DocumentList.tsx
      DocumentEditor.tsx
      DocumentRelationships.tsx
      CreateDocumentWizard.tsx
    contexts/
      types.ts
      hooks.ts
      PlanningContextSelector.tsx
    frameworks/
      types.ts
      hooks.ts
      FrameworkBrowser.tsx
      FrameworkNodePicker.tsx
```

Keep this folder **framework-agnostic**.

Curriculum-specific UX (e.g., a special PYP Programme of Inquiry board) should be implemented as optional modules under `src/curriculum/modules/ib/*` and referenced by module IDs.

---

## Testing strategy

- **Unit tests (Vitest)**
  - registry/builders: navigation building, schema widget selection, error mapping
  - DocumentEditor: renders sections/fields from schema

- **E2E tests (Playwright)**
  - one “happy path” per curriculum pack:
    - create a planning context
    - create a document
    - edit schema-driven fields
    - trigger a workflow event
    - align to a framework node

---

## What “done” looks like

When these steps are complete:

- Switching the curriculum pack changes the **UI structure** (nav/modules), not just labels.
- Planning is created and edited via **generic documents**.
- Documents render different schemas for IB vs US vs UK without branching UI code.
- Workflows differ per pack (different states/actions) and are enforced by backend.
- Framework browsing and alignment works for “standards/skills/concepts”, searchable at scale.
- District admins can operate across schools safely with correct school scoping.
