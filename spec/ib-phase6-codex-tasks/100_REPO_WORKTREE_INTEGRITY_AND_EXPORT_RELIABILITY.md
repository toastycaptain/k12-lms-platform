# Task 100 — Repo worktree integrity and export reliability

## Major step context

This task belongs to **Step 1 — Lock down build integrity and release discipline**.

### Step goal
Turn the current IB implementation into a reproducible pilot baseline with clean source integrity, stable CI, frozen runtime contracts, and explicit rollback/release controls.

### Why this step exists now
The product now has broad IB coverage. The main risk is no longer missing features; it is shipping or iterating on top of an unstable build, partial export, or inconsistent pack/runtime state.

## Objective

Audit the repository state, eliminate missing-file/export drift, and make archive/export behaviour predictable so future Codex phases start from a trustworthy source tree.

## Dependency position

- Read master file first; no prior implementation task.

## Primary repo areas to inspect and modify

- `/apps/core`
- `/apps/web`
- `/packages/contracts`
- `/.github/workflows`
- `/scripts`
- `/tasks`

## Detailed execution instructions

### 1. Discovery and audit
Before changing code, inspect the current implementation in the repo areas above and identify:
- what already exists that partially solves this task
- which files/services/components/controllers/models are still placeholders, incomplete, or inconsistent
- what technical debt or transitional compatibility logic could interfere with this task
- what tests already cover the target behaviour and where gaps remain

Create or update a short working note in the branch/PR description capturing those findings before broad refactors begin.

### 2. Implementation workstreams
- Compare the extracted working tree against `git HEAD` and identify any files that disappear during archive/export, especially under `/apps/web/src/app/ib`, `/apps/web/src/features/ib`, `/apps/core/app/controllers/api/v1/ib`, and `/apps/core/app/services/ib`.
- Create an explicit repo integrity script or task that reports deleted-but-tracked files, untracked generated artifacts, stale temp storage, oversized caches, and archive omissions.
- Audit `.gitignore`, `.gitattributes`, export-ignore patterns, and any zip/export helper scripts that may strip files needed for IB routes, test fixtures, or pack contracts.
- Remove environment-specific or generated state that should never be committed (coverage artifacts, temporary storage, build outputs) while preserving legitimate seeded files.
- Add a documented archive verification step that can be run before future handoffs: create an archive, re-extract it, and compare file manifests for critical directories.
- Ensure the repo contains stable seed data, migrations, and fixture files required by the IB pilot baseline; do not rely on ephemeral local state.
- Produce a manifest of critical Phase 5 assets that must exist in every export, including IB routes, pack files, operational models, and background-job configuration.

### 3. Contracts, data, and permissions
While implementing, verify the following:
- tenant, district, school, and programme scoping remain correct
- pack/version/workflow metadata is preserved where the task touches documents or operational records
- audit logging remains intact for sensitive operator mutations
- backend/frontend terminology remains aligned with the active IB experience
- any shared-layer extraction stays pack-neutral unless this task is explicitly IB-only

### 4. Tests and verification
Add or update the right test types for the surface you changed:
- backend request/service/model/job specs in `apps/core/spec`
- frontend unit/integration tests in `apps/web`
- Playwright coverage where the task changes critical cross-page behaviour
- manual smoke notes if the task touches operator workflows that are awkward to automate immediately

Do not treat ad hoc manual clicking as sufficient if the task changes high-risk pilot behaviour.

### 5. Documentation and operator clarity
Update the relevant runbooks, QA notes, or inline product copy where the user/operator experience changes. If the task introduces a new status vocabulary, retry rule, or admin action, document it where support staff and future Codex phases will find it.

## Required deliverables

- A repeatable repo-integrity verification script or rake/task/CLI entrypoint.
- Any fixes to ignore/export configuration required to keep the archive faithful.
- A checked-in manifest or documentation file listing critical IB pilot files/directories.
- A clean working tree with generated junk removed or reclassified.

## Acceptance criteria

- Running the integrity command on a clean checkout exits successfully and reports zero missing tracked files in the critical IB paths.
- An archive/re-extract comparison confirms the critical manifest matches between source and exported artifact.
- No committed build/coverage/temp artifacts remain unless they are intentional fixtures or documentation.
- Future Codex phases can rely on the zip/export process without reconstructing deleted route trees manually.

## Evidence Codex should leave behind

- code diff implementing the task
- automated tests or clearly documented temporary gaps
- updated operational or product documentation where applicable
- clear completion summary describing what changed, what remains risky, and what follow-on tasks (if any) were uncovered

## Global guardrails inherited from this major step

- Do not introduce new IB feature scope in this step unless required to make release integrity measurable.
- Prefer small mechanical fixes over broad refactors.
- Treat git cleanliness, test determinism, and release repeatability as product requirements, not ops afterthoughts.

## Task-specific guardrails / non-goals

- Do not refactor application logic in this task unless necessary to restore missing committed files.
- Do not delete fixture or seeded data just because it looks generated—verify usage first.
- If archive drift reveals tooling outside the repo, document the assumption and add an in-repo mitigation.
