# Task 14 — IB Field-Aware AI Assistance and Structured Apply

## Goal
Replace the current heading-based AI apply flow with a schema-aware, field-safe assistance system that supports PYP, MYP, and DP planning structures.

This task upgrades:
- `AiAssistantPanel`
- `AiApplyModal`
- `ai-output-parser.ts`
- field-aware AI integration points inside planner/editor surfaces

---

## Why this task matters
The roadmap identified that the current AI parser is brittle and tied to a tiny set of generic markdown headings.

That does not work for IB because:
- PYP, MYP, and DP need different planner structures
- teachers need selective apply into real fields
- AI should show **diffs**, not silently rewrite plans
- AI should be optional and bounded, not noisy

This task is essential if AI is going to help rather than confuse.

---

## Roadmap coverage
This task implements roadmap sections covering:
- replacing `ai-output-parser.ts`
- schema-aware structured apply
- field-by-field diffs
- pack/programme-specific output types
- AI rules: optional, bounded, visible diff, disable-able by role/school, alternative non-AI paths
- “fix AI before expanding it”

---

## Existing repo touchpoints
Current files to inspect and refactor:
- `apps/web/src/components/AiAssistantPanel.tsx`
- `apps/web/src/components/AiApplyModal.tsx`
- `apps/web/src/lib/ai-output-parser.ts`
- tests under `apps/web/src/lib/__tests__/ai-output-parser.test.ts`
- planner/editor modules built in earlier tasks

---

## Required outcome
After this task:
- AI output is mapped to structured planner fields
- different programme editors can request the correct AI output shape
- the user always sees a field-by-field diff before apply
- AI can be disabled or hidden cleanly
- non-AI alternatives remain available

---

## Core design requirements

### AI must be field-aware
AI should target real planner fields such as:
- PYP central idea
- PYP lines of inquiry
- MYP statement of inquiry
- MYP inquiry questions
- DP milestone summaries
- family-window summaries

Do not continue using freeform heading regex parsing as the primary mechanism.

### AI must show diffs before apply
Every AI-assisted change should be previewed with:
- current value
- proposed value
- changed state markers
- per-field accept/reject or bulk apply options where feasible

### AI must be optional and bounded
Users must be able to:
- ignore AI suggestions
- use prior unit/exemplar flows instead
- apply only selected fields
- understand exactly what AI is changing

---

## Detailed implementation steps

### Step 1 — Design a structured AI payload adapter
Create frontend types/adapters such as:
- `StructuredAiPlanSuggestion`
- `AiFieldSuggestion`
- `AiSuggestionDiff`

These should reflect the schema-driven planner model coming from the backend and previous frontend tasks.

### Step 2 — Replace `ai-output-parser.ts`
Refactor the parser layer into one of these patterns:
- a compatibility adapter that can read structured JSON responses first and heading-based text second, or
- a full replacement that expects structured field suggestions only

Prefer the first only if you need a migration path.

The long-term desired behavior is structured output by field.

### Step 3 — Upgrade `AiApplyModal`
It should render:
- grouped field diffs
- changed/added/removed state
- per-field apply toggles
- bulk apply and cancel actions
- context for which programme/editor this belongs to

For long text fields, use the shared `DiffViewer` from Task 02.

### Step 4 — Upgrade `AiAssistantPanel`
The assistant panel should become context-aware.

Depending on where it is opened, it should know:
- the active programme (PYP/MYP/DP)
- the active document type
- the relevant field set
- whether the user is asking for generation, revision, simplification, or family-friendly translation

### Step 5 — Add non-AI alternative paths in the same UI zone
Where AI appears, also provide useful non-AI shortcuts such as:
- use school exemplar
- use prior unit
- duplicate from template
- generate family summary from existing unit fields without AI if possible

This keeps AI from becoming the only path.

### Step 6 — Add role/school-based visibility handling
If AI is disabled for a school or role, the UI should not present dead controls.

Handle gracefully:
- hidden AI buttons
- disabled AI panel with explanation if needed

---

## Important UX requirements

### Never apply invisibly
No AI output should mutate planner content without the user seeing and confirming the changes.

### Keep suggestions bounded
Avoid giant responses that try to fill every planner field at once if that is not helpful.

### Respect context and tone
For family-window or learning-story assistance, the AI should generate audience-appropriate language.
For planning fields, it should remain aligned to the professional planning context.

---

## Files to modify or create
Likely files include:
- `apps/web/src/components/AiAssistantPanel.tsx`
- `apps/web/src/components/AiApplyModal.tsx`
- `apps/web/src/lib/ai-output-parser.ts`
- planner feature modules from earlier tasks
- new AI types/adapters under `apps/web/src/features/curriculum/schema/` or `apps/web/src/features/curriculum/runtime/`

---

## Testing requirements

### Unit/component tests
Add tests for:
- structured field diff generation
- AI apply modal rendering for text/list fields
- partial field apply behavior
- fallback compatibility parsing if retained temporarily

### E2E scenarios
At minimum:
- teacher requests AI help inside a PYP unit and sees structured field suggestions
- teacher applies only selected fields
- family-summary assistance produces a preview rather than direct publish
- AI disabled state behaves gracefully when configured off

---

## Acceptance criteria
This task is complete only when:
- the AI path is schema-aware rather than heading-regex driven
- users can preview field-level diffs before applying changes
- AI is optional and bounded
- planner/editor surfaces can support programme-specific AI flows safely

---

## Handoff to Task 15
Task 15 will finalize the frontend by enforcing performance, mobile parity, accessibility, testing depth, and release gates.
