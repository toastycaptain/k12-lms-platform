# 09 — Standards & Portability: Outcomes (CASE), Content Packages (CC), Assessments (QTI) (Read‑Only)

**Mode: READ‑ONLY. Make NO code changes. Output findings in chat only.**

## Goal

Evaluate whether the LMS supports **portable standards-alignment and content/assessment interoperability**, reducing vendor lock-in and enabling district-wide reporting on standards/outcomes.

Key areas:
- standards/outcomes model (CASE-like structure with stable IDs)
- content packaging import/export (Common Cartridge-like)
- assessment item/test import/export (QTI-like)

Even if not officially named, we’re assessing the underlying capabilities.

---

## What to locate

### Standards/outcomes
Search for:
- `standard`, `outcome`, `competency`, `learning_objective`, `rubric_outcome`
- unique identifiers fields:
  - `guid`, `urn`, `external_id`, `standard_id`
- standards frameworks:
  - `framework`, `set`, `taxonomy`
- alignment links:
  - assignment → standard
  - question → standard
  - rubric criterion → standard

### Content packages
Search for:
- `cartridge`, `imscc`, `common_cartridge`, `package_import`, `package_export`
- zip processing code
- manifest parsing (IMS manifests)
- import/export endpoints and background jobs

### Assessment interoperability
Search for:
- `qti`, `item_bank`, `question_bank`, `assessment_export`, `assessment_import`
- XML parsing/serialization logic
- item metadata, scoring, feedback mapping

---

## Requirements to assess (score each 0–3)

### A. Standards/outcomes are first-class and reusable
- Standards can be defined/imported at district/system level.
- Organized into frameworks/sets/folders.
- Stable IDs exist (for syncing/updating).

### B. Standards alignment is integrated into instruction & reporting
- Teachers can align:
  - assignments
  - quiz questions / item bank (if exists)
  - rubric criteria
- Admins can report by standard across courses/schools.

### C. Standards import/export (CASE-like)
- Ability to import standards from an external source (JSON/CSV/etc.).
- Ability to export standards with stable identifiers and hierarchy.

### D. Content package import/export (Common Cartridge-like)
- Import course/module content from a package.
- Export course/module content to a package.
- Preserves structure, files, links, metadata where possible.

### E. Assessment import/export (QTI-like)
- Import question items and assessments.
- Export items/assessments in a structured portable format.
- Handles common item types and scoring.

---

## Admin-focused edge cases

- Updating a standards framework without breaking existing alignments
- Cross-district frameworks and school-specific additions
- Package import overwriting vs merging content
- Accessibility metadata or accommodations captured in assessments

---

## Red flags

- Standards exist only as free-text tags without stable IDs or hierarchy.
- No export options; data is trapped.
- Package import exists but drops key structure or links silently.
- Item bank exists but cannot be migrated/exported.

---

## Output format (in chat)

1) **Standards & portability summary**
2) **Findings table**

| Requirement | Score (0–3) | Risk | Evidence (paths + lines) | Notes |
|---|---:|---|---|---|

3) **Interoperability maturity notes** (lock-in risk)

Proceed to `10_LTI_INTEGRATIONS_AND_PRIVACY.md`.
