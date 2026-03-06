# Task 04 — IB Portfolio, Evidence, and Learning Stories Foundation

## Goal
Replace the placeholder portfolio experience with a real, cross-programme evidence system that supports:
- student ownership
- teacher validation
- learner profile and ATL tagging
- family sharing controls
- learning-story publishing

This task establishes the evidence spine used by PYP, MYP, DP, and family engagement.

---

## Why this task matters
The roadmap identified portfolio as one of the most serious frontend gaps.

The current route `apps/web/src/app/learn/portfolio/page.tsx` is still a placeholder, yet portfolios are central to:
- PYP learning visibility
- MYP projects and service as action
- DP core evidence capture
- parent engagement
- coordinator evidence and reporting

This task fixes that foundational gap early.

---

## Roadmap coverage
This task implements roadmap sections covering:
- the portfolio placeholder gap
- cross-programme portfolio centrality
- `LearningStoryComposer`
- family share controls
- tagged evidence entries
- teacher validation cues
- family-friendly publishing that avoids spam
- “replace portfolio placeholder with a real evidence timeline”

---

## Existing repo touchpoints
Current files to evolve:
- `apps/web/src/app/learn/portfolio/page.tsx`
- `apps/web/src/components/StudentProgressView.tsx` (later task will deepen usage)
- `apps/web/src/components/AppShell.tsx` (nav already updated in previous tasks)

New modules should live under:
- `apps/web/src/features/curriculum/evidence/*`
- `apps/web/src/features/ib/portfolio/*`
- `apps/web/src/features/ib/family/*`

---

## Required outcome
After this task:
- students can see and manage portfolio evidence
- teachers can validate, comment on, and share evidence
- evidence can be tagged to learner profile, ATL, unit/context, and other IB metadata
- family-sharing controls exist
- learning stories can be composed and published in a structured way
- the placeholder route is fully replaced

---

## Core concepts to implement

### Portfolio evidence item
An evidence item should support:
- title
- description or reflection
- media attachments (existing backend/file support assumed)
- tags (learner profile, ATL, concepts, unit/document context, project/core context)
- author/student metadata
- visibility state
- teacher validation state
- comments/feedback summary

### Learning story
A learning story is not just a portfolio item.

It should support:
- narrative-first publishing
- selected media
- optional links to evidence items
- friendly language for families
- unit/context association
- notification level choice

### Sharing controls
A user composing evidence or a learning story must be able to decide:
- private draft
- teacher-only
- student + teacher
- family-visible
- class-visible or cohort-visible if supported

---

## Detailed implementation steps

### Step 1 — Create the portfolio domain in the frontend
Create:
- `apps/web/src/features/curriculum/evidence/types.ts`
- `apps/web/src/features/curriculum/evidence/hooks.ts`
- `apps/web/src/features/curriculum/evidence/EvidenceFeed.tsx`
- `apps/web/src/features/curriculum/evidence/EvidenceCard.tsx`
- `apps/web/src/features/curriculum/evidence/EvidenceDetailDrawer.tsx`
- `apps/web/src/features/curriculum/evidence/ReflectionComposer.tsx`
- `apps/web/src/features/curriculum/evidence/EvidenceTagPicker.tsx`
- `apps/web/src/features/curriculum/evidence/ShareVisibilityControl.tsx`

These should be curriculum-capable but IB-friendly first.

### Step 2 — Replace `learn/portfolio/page.tsx`
The student portfolio route should become a real product page featuring:
- evidence feed/timeline
- add evidence CTA
- reflection composer
- filter/sort controls
- visibility badges
- validation status indicators

The page should support:
- empty state for first use
- compact and rich feed modes
- image/file/video representation where supported

### Step 3 — Implement teacher validation cues
Teachers need a lightweight workflow for evidence review.

Add support for:
- “needs review” or equivalent visual state
- teacher comments or validation notes
- approved/shared indicators
- quick actions from evidence cards or drawers

Do not bury this behind a separate admin-style page.

### Step 4 — Build `LearningStoryComposer`
Create a dedicated composer under a family-facing or teacher-facing module, not just a generic message form.

Required features:
- quick narrative input
- attach media and/or existing evidence
- map story to unit / learner profile / ATL / programme context
- choose audience and notification level
- preview before publish

The composer should support the roadmap target of “share a moment of learning in under 60 seconds.”

### Step 5 — Build family sharing controls and notification tiers
Notification options should avoid spam.

Suggested levels:
- publish silently to family feed
- publish and send digest inclusion
- publish and notify immediately

Do not default to the noisiest option.

### Step 6 — Add feed variants for different roles
The same underlying evidence/story data should support:
- student portfolio feed
- teacher review feed
- family learning story feed
- coordinator evidence sampling feed later

Create flexible feed rendering rather than separate bespoke components for every role.

---

## Tagging requirements
Build tagging UI that feels IB-relevant.

At minimum support:
- learner profile attributes
- ATL categories or skills
- unit/document association
- programme (PYP/MYP/DP)
- projects/core category where relevant
- optional action/service tags

Use shared UI from Task 02 (`TagInput`, `ChipGroup`, `Drawer`, `FilterBar`).

---

## Family-friendly language requirements
Learning story and family-visible evidence UI must translate IB language without drowning families in jargon.

Examples:
- show a family-friendly summary for unit links where available
- do not expose raw internal planning notes
- make learner profile/ATL tags readable and friendly
- avoid cluttered metadata piles

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/learn/portfolio/page.tsx`
- `apps/web/src/features/curriculum/evidence/*`
- `apps/web/src/features/ib/portfolio/*`
- `apps/web/src/features/ib/family/*`
- optionally student/teacher dashboard widgets from Task 03 to surface evidence and stories

---

## Testing requirements

### Unit/component tests
Add tests for:
- evidence feed rendering
- visibility state display
- tag selection and display
- learning story compose flow
- notification level selection

### E2E scenarios
At minimum:
- student adds evidence and reflection
- teacher reviews evidence and adds validation or feedback
- teacher publishes a learning story with family-safe visibility
- family-visible item appears in the correct feed without exposing private notes

---

## Acceptance criteria
This task is complete only when:
- the portfolio route is no longer a placeholder
- evidence can be created, viewed, and filtered in a real workflow
- tagging and sharing controls exist
- teacher validation cues are present
- learning stories can be composed and published
- the result feels like a foundational evidence system, not a one-off gallery

---

## Handoff to Task 05
Task 05 will build the PYP Programme of Inquiry board and PYP unit studio.

The PYP work should be able to plug directly into the evidence and learning-story foundation built here.
