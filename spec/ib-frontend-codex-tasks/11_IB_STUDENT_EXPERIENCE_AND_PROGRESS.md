# Task 11 — IB Student Experience and Progress Model

## Goal
Rebuild student-facing learning and progress surfaces so they reflect how IB students actually experience learning, reflection, projects, and evidence.

This task upgrades:
- student navigation and surface composition in IB mode
- `StudentProgressView`
- student learning streams
- reflection and progress summaries

---

## Why this task matters
The roadmap identified that the current student progress UI is too standards/grades-centric.

In IB mode, students need to understand progress through signals like:
- evidence and reflection
- ATL growth
- learner profile reflections
- criterion performance
- action/service/project milestones
- DP core progress

Students should be able to answer quickly:
- What am I doing next?
- Why does it matter?
- How will I know I am improving?

---

## Roadmap coverage
This task implements roadmap sections covering:
- IB student nav in IB mode
- `StudentLearningStream`
- replacement of `StudentProgressView`
- student learning/progress emphasis across PYP/MYP/DP
- student portfolio and reflection integration

---

## Existing repo touchpoints
Current files to inspect and evolve:
- `apps/web/src/app/learn/layout.tsx`
- `apps/web/src/app/learn/dashboard/page.tsx`
- `apps/web/src/app/learn/progress/page.tsx`
- `apps/web/src/app/learn/courses/[courseId]/page.tsx`
- `apps/web/src/components/StudentProgressView.tsx`
- `apps/web/src/app/learn/portfolio/page.tsx`

---

## Required outcome
After this task:
- student nav in IB mode reflects the IB IA from the roadmap
- progress surfaces show IB-appropriate signals
- students can see a coherent stream of learning, feedback, reflection, and project/core milestones
- the student experience becomes less fragmented and more agency-oriented

---

## Student nav requirements in IB mode
The student shell should prominently support:
- Home
- My Learning
- Calendar
- Portfolio
- Projects
- Reflection
- Progress

This can map internally to existing `/learn/*` routes, but the visible IA should be IB-native.

---

## `StudentLearningStream` requirements

### Purpose
Unify the student’s day-to-day experience into a single coherent stream.

### Stream should combine
- lessons / learning experiences
- tasks
- criteria-linked feedback
- portfolio prompts
- service/project checkpoints
- reflection prompts
- DP core milestones where relevant

### UX requirements
- show context inline (unit/course/project)
- clearly indicate what is next
- allow quick jump to the related object
- avoid the “class flow in no logical order” problem the roadmap calls out

---

## `StudentProgressView` redesign requirements

### Replace or extend current cards with IB progress cards
Add cards such as:
- criterion performance
- ATL growth
- learner profile reflections
- project/core milestones
- evidence count by unit
- action/service status

Keep the older standards-heavy cards only as a non-IB fallback.

### Important rule
Do not rely only on numeric averages as the primary signal in IB mode.

---

## Reflection requirements
Students need a clear place to add or revisit reflections.

Support:
- reflection prompts tied to units/evidence/projects
- quick links from stream items to reflection composers
- saved draft / autosave behavior
- visibility cues (private / teacher-visible / family-visible where appropriate)

---

## Detailed implementation steps

### Step 1 — Update student shell/nav behavior
Ensure the shell and learn layout present IB-native navigation labels and structure.

### Step 2 — Build `StudentLearningStream`
Create:
- `StudentLearningStream.tsx`
- `StudentStreamItem.tsx`
- `StudentStreamFilters.tsx`
- `StudentNextActionsCard.tsx`

Use timeline/feed components from earlier tasks where appropriate.

### Step 3 — Redesign `StudentProgressView`
Refactor the component so it can:
- detect IB mode
- render IB-specific progress cards
- fall back to generic/other curriculum cards when not in IB mode

Create subcomponents such as:
- `IbCriterionPerformanceCard.tsx`
- `IbAtlGrowthCard.tsx`
- `IbLearnerProfileReflectionCard.tsx`
- `IbMilestonesCard.tsx`
- `IbEvidenceByUnitCard.tsx`

### Step 4 — Wire progress routes
Ensure `/learn/progress` renders the new IB-aware view in IB mode.

### Step 5 — Surface portfolio and project links from the student dashboard/stream
The student should be able to move fluidly from:
- progress -> evidence
- timeline -> reflection
- project milestone -> related workspace

---

## UX requirements

### Keep language clear
Student-facing labels should be understandable and not overloaded with coordinator jargon.

### Focus on actionability
Each card or stream item should lead to a useful next action where appropriate.

### Preserve context
A student should never wonder:
- which unit this belongs to
- whether it is for a project or regular class work
- whether it affects upcoming milestones

---

## Files to modify or create
Likely files include:
- `apps/web/src/app/learn/layout.tsx`
- `apps/web/src/app/learn/dashboard/page.tsx`
- `apps/web/src/app/learn/progress/page.tsx`
- `apps/web/src/components/StudentProgressView.tsx`
- `apps/web/src/features/ib/student/*`

---

## Testing requirements

### Unit/component tests
Add tests for:
- student nav composition in IB mode
- learning stream item rendering and filtering
- IB progress card rendering
- fallback to non-IB card set when not in IB mode

### E2E scenarios
At minimum:
- IB student opens dashboard and sees next actions/current learning
- student opens progress and sees IB-oriented cards
- student opens a stream item and navigates to related reflection/evidence/project object

---

## Acceptance criteria
This task is complete only when:
- student navigation reflects IB priorities
- progress is no longer primarily grades/averages centric in IB mode
- students have a coherent, contextual learning stream
- the student surface feels more like a learning journey than a generic task portal

---

## Handoff to Task 12
Task 12 will translate these IB experiences into the guardian/family perspective.
