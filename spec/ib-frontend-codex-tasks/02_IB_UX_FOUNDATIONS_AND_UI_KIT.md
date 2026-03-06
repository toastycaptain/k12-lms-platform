# Task 02 — IB UX Foundations and Shared UI Kit Expansion

## Goal
Build the shared interaction and design-system primitives needed for a modern, dense, curriculum-first IB product.

This task is intentionally foundational. It prevents later PYP/MYP/DP surfaces from becoming a pile of ad hoc one-off UI.

---

## Why this task matters
The roadmap identified a major gap: the current design system is too shallow for real curriculum workflows.

Missing classes of UI include:
- sticky context bars
- advanced tabs
- split panes
- tree and outline views
- drag/drop sequence views
- anchored comments
- diff/compare viewers
- saved filters and chips
- timeline and board views
- command palette / quick actions
- docked inspectors
- dense evidence grids
- autosave visibility

Without these primitives, later programme surfaces will either:
- feel old and cluttered like legacy tools, or
- become too click-heavy like the products we are trying to outperform.

---

## Roadmap coverage
This task implements roadmap sections covering:
- design system limitations
- UX patterns that fix Toddle/ManageBac pain points
- dark mode and accessibility settings
- autosave and version transparency
- command palette and quick actions
- richer UI kit in `packages/ui`
- “Phase 1 — IB shell and foundational UX” deliverables

---

## Existing repo touchpoints
Primary current areas:
- `packages/ui/src/*`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/*`
- `apps/web/src/app/__tests__/a11y.test.tsx`
- `apps/web/src/app/__tests__/keyboard-nav.test.tsx`

The current `packages/ui` already contains basics such as:
- button
- card
- badge
- modal
- skeleton
- empty state
- responsive table
- form controls

This task expands the system substantially.

---

## Required design-system deliverables
Implement these components in `packages/ui` unless there is a strong reason to keep a feature-local variant:

### Required new shared components
- `Tabs`
- `SegmentedControl`
- `Drawer`
- `SplitPane`
- `TreeView`
- `CommandPalette`
- `FilterBar`
- `TagInput`
- `ChipGroup`
- `ActivityTimeline`
- `CommentThread`
- `DiffViewer`
- `DockedInspector`
- `MetricCard`
- `KanbanBoard`
- `CalendarTimeline`
- `VirtualDataGrid`
- `RichTextComposer`
- `PresenceStack`
- `AutosaveIndicator`
- `StickyContextBar`
- `DensityToggle`
- `ThemeToggle`

Not all of them need every advanced feature in v1, but each must be usable and production-safe.

---

## Detailed implementation steps

### Step 1 — Add theme and density infrastructure
Implement app-level support for:
- light mode
- dark mode
- comfortable density
- compact density

Where to wire:
- `apps/web/src/app/layout.tsx`
- global theme provider under `apps/web/src/features/curriculum/runtime/` or `apps/web/src/lib/`
- CSS variables / Tailwind-compatible class strategy in `apps/web/src/app/globals.css`
- shared design tokens in `packages/ui/src/tokens.ts`

Requirements:
- theme/density preferences persist by user/browser
- controls are reachable from the shell
- defaults are sane and accessible
- dark mode is not just inverted colors; verify contrast and surfaces

### Step 2 — Implement `StickyContextBar`
This component is essential for dense planning workflows.

It should display:
- programme
- year/group
- course/section or planning context
- unit/document title
- draft/published status
- save/autosave state
- collaborators/presence (placeholder okay initially)

Behavior:
- remains visible on scroll
- adapts to mobile with compressed layout
- supports inline actions such as “Open split view” or “Publish” if passed in

Later tasks should reuse this component across PYP/MYP/DP editors.

### Step 3 — Implement `CommandPalette`
Needed because the roadmap emphasizes low click count.

Initial command groups:
- navigation commands
- create commands
- recent documents
- quick search commands
- role-specific actions

Keyboard shortcut suggestions:
- `Cmd/Ctrl + K` to open
- `Esc` to close

Must support:
- keyboard navigation
- typeahead filtering
- action grouping
- command disable states

In IB mode, later commands will include:
- new unit of inquiry
- add evidence
- share learning story
- open CAS workspace
- open Personal Project hub

### Step 4 — Implement `SplitPane`
Many IB tasks require side-by-side comparison:
- unit and lesson
- rubric and student evidence
- current year and last year plan
- EE draft and previous version

Requirements:
- resizable panes
- persisted width state where feasible
- keyboard accessibility
- collapse/restore support

### Step 5 — Implement `DiffViewer`
Used later for:
- AI field diffs
- version history comparisons
- draft revisions

Requirements:
- text diff display
- structured row/key diff support for field-based objects
- inline add/remove/changed styling
- no dependence on giant third-party libraries unless justified

### Step 6 — Implement `ActivityTimeline` and `CalendarTimeline`
Needed for:
- home dashboard
- unified learning timeline
- project milestones
- family learning stories
- IA/CAS/EE milestone flows

Requirements:
- grouped by date
- compact and rich variants
- visual tags/chips for type
- efficient rendering

### Step 7 — Implement `FilterBar` and saved view patterns
All lists must be filterable and saveable.

Create a flexible filter bar that can support:
- chips
- dropdown filters
- search field
- saved views
- clear/reset
- result count

This will later power:
- POI board filters
- portfolio evidence filtering
- project hub filters
- coordinator evidence views

### Step 8 — Implement `TagInput` and `ChipGroup`
IB surfaces will repeatedly need compact tagging for:
- learner profile
- ATL
- concepts
- criteria
- programmes/years
- notification levels

Build robust shared components rather than repeating pill UIs everywhere.

### Step 9 — Implement `Drawer`, `DockedInspector`, and `TreeView`
These support the low-friction workflow patterns the roadmap calls for.

Use cases:
- open unit summary from POI grid
- inspect evidence without leaving the current screen
- show document outline or curriculum tree
- show right-side details in split workflows

### Step 10 — Implement `AutosaveIndicator`
Every planner/editor should later display:
- saving
- saved
- unsaved changes
- last autosave time
- offline/queued state if applicable

This component must be reliable and reusable.

### Step 11 — Upgrade `packages/ui` exports and tests
For every new shared component:
- add exports in `packages/ui/src/index.ts`
- add tests under `packages/ui/src/__tests__/`
- ensure types are generated cleanly

---

## Application-level integrations to make in this task

### Add shell controls
Wire into the shell area from Task 01:
- theme toggle
- density toggle
- command palette trigger

### Add keyboard accessibility coverage
Extend existing accessibility/keyboard tests to cover:
- command palette open/close
- tab navigation inside new primitives
- focus trapping in drawers and modals
- split pane keyboard interaction where implemented

### Establish a visual hierarchy baseline
Use this task to improve layout rhythm:
- page titles
- section spacing
- surface elevation levels
- active state contrast
- compact mode spacing tokens

Do not wait until the end to fix hierarchy.

---

## UX rules to enforce directly in components
Build components so later screens naturally follow the roadmap’s rules.

### Progressive disclosure
- tabs and drawers should make secondary controls easy to hide
- inspectors should carry secondary metadata instead of bloating the main canvas

### Low click count
- command palette should jump to common actions
- filter bar should preserve recent filters
- drawers should allow inline completion instead of page hopping when appropriate

### Clear save state
- autosave indicator must make status obvious without becoming noisy

### Open in new tab / split view
- shared action slots should allow link-style actions and split-pane actions consistently

---

## Files to modify or create
Likely files include:
- `packages/ui/src/index.ts`
- `packages/ui/src/tokens.ts`
- `packages/ui/src/__tests__/*`
- new shared UI component files under `packages/ui/src/`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/app/__tests__/a11y.test.tsx`
- `apps/web/src/app/__tests__/keyboard-nav.test.tsx`

---

## Performance guardrails for this task
Do not let the new UI primitives bloat the app.

Requirements:
- avoid pulling in huge UI libraries unless they significantly reduce implementation risk
- prefer composable internal primitives
- lazy-load command palette contents if necessary
- ensure dark mode and density toggles do not force excessive re-rendering

---

## Testing requirements

### Unit/component tests
Add or expand tests for:
- theme toggle persistence
- density toggle persistence
- command palette keyboard behavior
- split pane resize behavior
- autosave indicator states
- filter bar saved view behavior

### Accessibility tests
Validate:
- dark mode contrast is acceptable
- drawers and palettes are keyboard navigable
- tabs are announced correctly
- focus management works in modal/drawer contexts

### Visual sanity checks
At minimum, verify in both themes:
- AppShell
- a generic card/list surface
- a detail/editor-like surface

---

## Acceptance criteria
This task is complete only when:
- the app has working dark mode and density toggles
- the shell exposes a working command palette trigger
- `packages/ui` includes the key shared workflow components listed above
- `StickyContextBar` and `AutosaveIndicator` exist and are reusable
- new UI primitives are tested and exported cleanly
- the codebase has a credible foundation for the richer IB views that follow

---

## Handoff to Task 03
Task 03 will use these shared primitives to build the role-aware IB home and unified timeline.

Specifically, it should be able to reuse:
- `MetricCard`
- `ActivityTimeline`
- `CalendarTimeline`
- `FilterBar`
- `StickyContextBar`
- theme/density infrastructure
