# 08 — Content Governance: Templates/Blueprints, Central Repository, Versioning (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Determine whether the LMS can **centralize and govern instructional materials** at district/school scale while preserving teacher autonomy where intended.

Administrators need:
- template/blueprint courses (push updates downstream)
- lock/unlock semantics (what teachers can change)
- content libraries/repositories with permissions
- versioning and audit trails for curriculum updates

---

## What to locate

### Backend
Search for:
- template/blueprint concepts:
  - `template_course`, `blueprint`, `master_course`, `course_sync`
  - associations: template → child courses
  - sync endpoints/jobs
  - lock settings at item level (pages/modules/assignments)
- content repository:
  - `library`, `commons`, `resource_bank`, `content_store`
  - sharing scopes: district-only, school-only, public, private
  - metadata: grade band, subject, tags, standards alignment
- versioning:
  - revision tables, history logs, publish versions
  - content diff/sync history

### Frontend
Find:
- template management UI
- sync actions and status
- controls for locking items
- repository search/import UI

---

## Requirements to assess (score each 0–3)

### A. Template/blueprint model exists
- A “source” course can be associated with multiple “child” courses.
- Templates can be used for consistent district curriculum distribution.

### B. Controlled sync semantics
- Sync is explicit and auditable (not silent).
- Teachers can be protected from overwrites (lock/unlock).
- Conflicts are handled predictably (e.g., locked items override local changes).

### C. Granular locking
- Ability to lock at least:
  - navigation structure/modules
  - core pages/resources
  - assessments (optional)
- Lock rules are enforced server-side.

### D. Content repository / commons exists
- District-curated content can be shared and discovered.
- Permissions allow:
  - district curators publish
  - schools or teachers optionally contribute (policy)
- Metadata supports search and governance.

### E. Versioning & audit trail for curriculum content
- Content changes are traceable:
  - who changed what
  - when
  - from where (template vs local)
- Ability to roll back or restore versions (strongly preferred).

### F. Import/export & portability
- Content can be exported/imported in a structured way (packages).
- Teachers/admins can move content between courses safely.

---

## Admin-focused edge cases to verify

- Updating a template mid-term without breaking in-progress assignments
- Handling of locked vs unlocked gradebook categories
- Template sync and SIS-driven course creation timing
- Repository access for substitute teachers or curriculum coaches

---

## Red flags

- “Templates” are just manual copy/paste with no governance.
- Sync overwrites teacher content with no locks/audit.
- Repository exists but has no permission model or metadata.
- No history/versioning; curriculum edits are irreversible.

---

## Output format (in chat)

1) **Content governance summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Governance effectiveness notes** (district push, teacher flexibility)

Proceed to `09_STANDARDS_CASE_CC_QTI.md`.
