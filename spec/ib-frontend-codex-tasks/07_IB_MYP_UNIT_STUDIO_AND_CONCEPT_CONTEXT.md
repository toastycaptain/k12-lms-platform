# Task 07 — MYP Unit Studio, Concept/Context Builder, and Inquiry Questions

## Goal
Create an MYP-native unit planning experience centered on conceptual understanding and inquiry, not generic assignment-style planning.

This task builds:
- `MypUnitStudio`
- `ContextConceptBuilder`
- inquiry question authoring flows

---

## Why this task matters
The roadmap noted that MYP is where many products become cluttered because they bolt MYP criteria and concepts onto generic pages.

The MYP experience must feel intentionally built around:
- global context
- key concept
- related concepts
- statement of inquiry
- factual / conceptual / debatable questions
- ATL
- service connections

If these appear as random fields on a generic unit page, the result will still feel wrong.

---

## Roadmap coverage
This task implements roadmap sections covering:
- `MypUnitStudio`
- `ContextConceptBuilder`
- inquiry questions
- MYP must feel conceptual and criterion-based
- Phase 3 deliverables for the core MYP unit editor

---

## Existing dependencies
Assumes the planner router from Task 05 exists or is easy to extend.

The MYP unit studio should plug into:
- schema-driven document infrastructure
- sticky context bar
- autosave indicators
- shared tabs/inspectors from earlier tasks

---

## Required outcome
After this task:
- MYP units open in a dedicated MYP studio
- concept/context and statement of inquiry creation are supported by guided UI, not just blank fields
- inquiry questions are visible and structured
- the studio feels coherent and less intimidating than current generic planning pages

---

## `MypUnitStudio` requirements

### Suggested tabs
- Overview
- Concepts & Context
- Inquiry Questions
- Learning Sequence
- Assessment & Criteria
- ATL & Service
- Reflection

### Core fields to support clearly
- subject group
- year
- global context
- key concept
- related concepts
- statement of inquiry
- factual questions
- conceptual questions
- debatable questions
- ATL focus and progression notes
- service as action links
- differentiation notes
- interdisciplinary linkage

### Important note
Some of these are implemented in later MYP tasks with more depth. In this task, focus on the unit studio core, the concept/context builder, and inquiry question authoring.

---

## `ContextConceptBuilder` requirements

### Purpose
Help teachers generate a coherent pairing of:
- concept
- context
- statement of inquiry

### Why it matters
This is a high-friction part of MYP planning.
A UI that just presents empty text fields increases cognitive load and makes the product feel training-heavy.

### Required features
- choose or review global context
- choose key concept
- choose related concepts
- show the chosen pairings side-by-side
- suggest a statement-of-inquiry structure or pattern
- provide examples and guardrails
- optional bounded AI help, but do not depend on AI

### Constraints
The builder should feel supportive, not prescriptive.
It must allow manual editing and school-specific language.

---

## Inquiry question builder requirements

### Purpose
Make factual, conceptual, and debatable questions easier to compose and review.

### Required features
- clear grouping by question type
- helper text for what each type means
- repeatable question inputs
- warnings if one type is missing or overloaded
- compact summary view when complete

---

## Detailed implementation steps

### Step 1 — Extend the planner router to support MYP
Update the planner router to render `MypUnitStudio` when the active document/programme is MYP.

### Step 2 — Build the MYP studio shell
Create:
- `MypUnitStudio.tsx`
- tab subcomponents for each section
- shared unit shell wrappers if needed

The shell should include:
- sticky context bar
- current status/version
- autosave indicator
- quick actions where relevant

### Step 3 — Build `ContextConceptBuilder`
Create:
- `ContextConceptBuilder.tsx`
- `GlobalContextPicker.tsx`
- `ConceptPairingPanel.tsx`
- `StatementOfInquiryComposer.tsx`

The builder should support both:
- a guided “builder” mode
- a compact read-only summary once completed

### Step 4 — Build the inquiry question authoring panel
Create:
- `InquiryQuestionBuilder.tsx`
- `InquiryQuestionSection.tsx`

Use separate sections for:
- factual
- conceptual
- debatable

### Step 5 — Update the “new unit” flow for MYP
Ensure the new unit/object creation flow supports:
- `MYP unit`
- correct planning context selection
- programme/year/subject-group metadata

### Step 6 — Add contextual help and examples
One reason educators dislike complex curriculum tools is that even the configured forms still feel dense.

For MYP concept/context/question areas, add:
- helper text
- examples
- inline tips
- collapsible guidance to avoid clutter

---

## Key UX requirements

### Do not overwhelm the page
MYP planning can become visually exhausting.

Use:
- sectional cards
- summary chips
- collapsible help
- right-side inspectors for details when appropriate

### Make the conceptual model visible
Users should be able to see at a glance:
- global context
- concept choices
- statement of inquiry
- inquiry question spread

Do not force them to drill into several nested forms to understand the unit.

### Avoid blank-box syndrome
If a teacher opens the page and just sees many empty fields, the product will feel antiquated and training-heavy.

Use builders, previews, and examples.

---

## Files to modify or create
Likely files include:
- planner router files from Task 05
- `apps/web/src/features/ib/myp/*`
- `apps/web/src/app/plan/units/new/page.tsx`
- possible new MYP planning route(s) under `/ib/planning`

---

## Testing requirements

### Unit/component tests
Add tests for:
- planner router chooses `MypUnitStudio`
- concept/context builder state transitions
- statement of inquiry helper flow
- inquiry question grouping and summaries

### E2E scenarios
At minimum:
- MYP teacher creates a unit
- teacher completes global context, key concept, related concepts
- teacher adds statement of inquiry and inquiry questions
- resulting page remains coherent and not form-heavy

---

## Acceptance criteria
This task is complete only when:
- MYP units have a dedicated studio
- concept/context planning is meaningfully guided
- inquiry questions are structured by type
- the experience feels concept-centered rather than generic

---

## Handoff to Task 08
Task 08 will deepen MYP with:
- criteria planning
- ATL progression
- interdisciplinary planning
- projects hub (personal/community/service)
