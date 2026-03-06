# Task 01 — IB App Shell, Navigation, and Information Architecture

## Goal
Transform the current shell from a mostly static, generic K–12 navigation wrapper into a **runtime-composed IB workspace shell** that feels native to PYP, MYP, and DP.

This task is the first visible signal that IB mode is not just “renamed generic pages”.

---

## Why this task comes first
The current shell (`apps/web/src/components/AppShell.tsx`) still centers the app around:
- Plan
- Teach
- Assess
- Report
- Communicate

That structure is serviceable for a general LMS, but it is **not how IB educators mentally organize their work**.

IB mode should foreground:
- **Continuum**
- **Planning**
- **Learning**
- **Assessment**
- **Portfolio**
- **Projects & Core**
- **Families**
- **Standards & Practices**
- **Reports**

This task establishes the foundation every later IB page will sit inside.

---

## Roadmap coverage
This task implements roadmap sections covering:
- the shell being too generic
- IB information architecture
- teacher/coordinator/student/guardian primary nav
- route mapping for `/ib/*`
- “make the frontend operate as an IB workspace system”
- refactor `AppShell.tsx`
- first part of the “Phase 1 — IB shell and foundational UX” work

---

## Existing repo touchpoints
Primary files to inspect and refactor:
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/TopRightQuickActions.tsx`
- `apps/web/src/components/SchoolSelector.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/learn/layout.tsx`
- `apps/web/src/app/guardian/layout.tsx`

Likely supporting files to add:
- `apps/web/src/features/curriculum/navigation/registry.ts`
- `apps/web/src/features/curriculum/navigation/buildNavigation.ts`
- `apps/web/src/features/curriculum/runtime/useCurriculumRuntime.ts`
- `apps/web/src/features/ib/shell/*`

---

## Required outcome
After this task:
- the shell can render a **distinct IB navigation structure** by role
- navigation ordering is no longer controlled by the static `NAV_ITEMS` array alone
- IB mode can surface **dedicated `/ib/*` workspaces**
- the header/sidebar can show **programme, workspace, and school context**
- legacy routes still work while the new IB routes are introduced

---

## Navigation model to implement

### Teacher / coordinator nav in IB mode
Render these as the primary left navigation when the active curriculum pack is IB:
- Home
- Continuum
- Planning
- Learning
- Assessment
- Portfolio
- Projects & Core
- Families
- Standards & Practices
- Reports

Suggested route mapping:
- `/dashboard` -> role-aware IB home dashboard
- `/ib/continuum`
- `/ib/planning`
- `/ib/learning`
- `/ib/assessment`
- `/ib/portfolio`
- `/ib/projects-core`
- `/ib/families`
- `/ib/standards-practices`
- `/ib/reports`

### Student nav in IB mode
- Home
- My Learning
- Calendar
- Portfolio
- Projects
- Reflection
- Progress

### Guardian nav in IB mode
- Home
- Learning Stories
- Current Units
- Portfolio
- Progress Reports
- Calendar
- Messages

---

## Detailed implementation steps

### Step 1 — Create a runtime navigation registry
Do not keep all navigation logic embedded in `AppShell.tsx`.

Create:
- `apps/web/src/features/curriculum/navigation/registry.ts`
- `apps/web/src/features/curriculum/navigation/types.ts`
- `apps/web/src/features/curriculum/navigation/buildNavigation.ts`

The registry should define stable nav IDs and route metadata.

Example categories:
- generic/global
- ib-teacher
- ib-student
- ib-guardian
- district/admin legacy

The builder should accept:
- current user roles
- selected school
- active curriculum runtime/pack
- currently active programme if exposed by the backend

The builder must output:
- primary nav items
- optional secondary nav clusters
- quick action definitions
- current home route

### Step 2 — Stop hard-coding shell semantics in `AppShell.tsx`
Refactor `AppShell.tsx` so it becomes:
- a **layout renderer**
- plus a thin adapter into the new navigation builder

`AppShell.tsx` should no longer own the authoritative nav structure.

Keep support for:
- `SchoolSelector`
- notification bell
- top-right quick actions
- current route highlighting
- role-based access filtering

But replace:
- direct dependency on the static `NAV_ITEMS` as the source of truth

### Step 3 — Introduce IB-specific workspace metadata
Create a helper such as:
- `apps/web/src/features/ib/shell/getIbWorkspaceConfig.ts`

This should define:
- labels
- icons/placeholders
- route groups
- optional subnav entries
- workspace descriptions
- role visibility

Examples:
- `continuum`
- `planning`
- `learning`
- `assessment`
- `portfolio`
- `projectsCore`
- `families`
- `standardsPractices`
- `reports`

### Step 4 — Add route shells for the new IB workspaces
Create thin route entry points:
- `apps/web/src/app/ib/continuum/page.tsx`
- `apps/web/src/app/ib/planning/page.tsx`
- `apps/web/src/app/ib/learning/page.tsx`
- `apps/web/src/app/ib/assessment/page.tsx`
- `apps/web/src/app/ib/portfolio/page.tsx`
- `apps/web/src/app/ib/projects-core/page.tsx`
- `apps/web/src/app/ib/families/page.tsx`
- `apps/web/src/app/ib/standards-practices/page.tsx`
- `apps/web/src/app/ib/reports/page.tsx`

For now, each page may render a thin workspace shell or placeholder module surface, but:
- it must be production-safe
- it must show the correct workspace title and context
- it must establish the route structure later tasks will fill in

### Step 5 — Add a role-aware workspace landing system
When IB mode is active:
- teacher/coordinator users should land on `/dashboard` but see the new IB home surface
- student users should still use the learn area, but the shell/nav must become IB-aware
- guardian users should use guardian routes with the new guardian IA

Create adapter logic so the shell knows:
- whether to render “IB teacher shell”, “IB student shell”, or “IB guardian shell”

### Step 6 — Add programme and workspace identity in the shell
The shell must show where the user is.

Add visible context in the header/sidebar:
- curriculum badge: `IB`
- programme badge if derivable (e.g. `PYP`, `MYP`, `DP`, or mixed)
- selected school or school context
- active workspace title

This should not be decorative only — it should reduce user confusion.

### Step 7 — Create a workspace switcher pattern
Add a lightweight switcher in the shell header or sidebar:
- current workspace name
- other available workspaces
- open in current tab or new tab

Do not build a giant command center here yet; just establish the switcher pattern.

### Step 8 — Update top-right quick actions to become workspace-aware
The current `TopRightQuickActions` should become runtime-aware.

In IB teacher mode, likely quick actions include:
- New unit
- New learning experience
- Add evidence
- Share family update
- Open projects/core
- Search student portfolio

In guardian mode, quick actions are much narrower.

In student mode, likely:
- Add portfolio evidence
- Open reflection
- View next deadline

Keep the component small and context-specific.

---

## Detailed UX requirements

### Sidebar and header behavior
- sidebar may collapse, but workspace identity must remain visible
- current route must always be obvious
- nested nav should support expandable groups where needed
- links must support open-in-new-tab behavior
- large flyouts are acceptable only if they reduce click count; do not bury everything in hidden menus

### Progressive disclosure
Do not expose all deep programme pages in the top-level nav immediately.

Example:
- top-level: `Projects & Core`
- deeper child pages later: Personal Project, CAS, EE, TOK, Exhibition

### Empty state requirements for unfinished workspaces
If a workspace does not yet contain its full modules, its placeholder must still be helpful:
- explain purpose of the workspace
- link to the most likely next action
- show a small “coming next” or “configure here” list if appropriate

---

## Route compatibility rules
Existing generic routes should remain viable while IB buildout proceeds.

Examples:
- `/plan/units` should still load, but may later redirect or expose a programme-aware router
- `/learn/portfolio` should continue working and later mount the new portfolio module
- `/guardian/dashboard` should remain the canonical guardian dashboard URL even if the content becomes IB-specific

Add `/ib/*` routes without breaking the generic ones.

---

## Visual design requirements
This task should begin to move the app visually away from an antiquated admin tool.

Required visual changes in this task:
- better hierarchy in nav groups
- stronger active state styling
- clear section headers
- room in the shell for later dark mode toggle, command palette, and density controls
- less “all-white, same-weight” presentation

Do not try to complete dark mode in this task; Task 02 covers the broader UX foundation.

---

## Files to modify
At minimum, expect to modify or create:
- `apps/web/src/components/AppShell.tsx`
- `apps/web/src/components/TopRightQuickActions.tsx`
- `apps/web/src/components/AppShell.test.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/guardian/layout.tsx`
- `apps/web/src/app/learn/layout.tsx`
- `apps/web/src/features/curriculum/navigation/*`
- `apps/web/src/features/ib/shell/*`
- `apps/web/src/app/ib/*`

---

## Testing requirements

### Unit tests
Add tests for:
- nav composition for IB teacher users
- nav composition for IB student users
- nav composition for IB guardian users
- fallback to generic navigation for non-IB packs
- workspace switcher visibility by role

### Component tests
Verify:
- active nav highlighting
- top-right quick actions change by role/context
- programme/curriculum badge rendering
- no duplicate nav entries appear when IB runtime is active

### E2E / interaction tests
Create at least one test that verifies:
- login as an IB teacher
- shell renders IB workspace nav
- user can navigate to `/ib/planning` and `/ib/portfolio`
- current workspace is visually clear

---

## Acceptance criteria
This task is complete only when:
- the shell has a **runtime-composed IB navigation model**
- IB mode is visibly different from the generic shell
- teacher/student/guardian role differences are implemented
- `/ib/*` workspace routes exist and are stable
- no current generic route is broken as a result
- tests verify the new navigation composition logic

---

## Handoff to Task 02
Task 02 will add the shared interaction and visual primitives this shell needs:
- dark mode
- density mode
- command palette
- sticky context bar
- split pane
- autosave indicators
- richer `packages/ui` components

Therefore, in this task, leave clean extension points in the shell for those controls instead of overbuilding custom one-off UI.
