# CODEX_SHARED_UI_PACKAGE — Extract Design System to packages/ui

**Priority:** P2
**Effort:** Medium (5–6 hours)
**Spec Refs:** TECH-2.2 (Repository Structure — /packages/ui shared design system), UX-3.1 (Global UX Principles)
**Depends on:** CODEX_FORM_LIBRARY_AND_ERROR_PAGES

---

## Problem

TECH-2.2 defines `/packages/ui` as a shared design system package, but it currently contains only `.gitkeep`. All UI components live in `apps/web/src/components/` with no extraction or reusability path. This matters because:

1. **No component catalog** — no Storybook or isolated component preview
2. **No design tokens** — colors, spacing, typography not centralized
3. **Addon pages duplicate styles** — Google Workspace/Classroom add-on pages can't share components
4. **Future apps blocked** — any additional frontend (e.g., guardian portal, mobile web) must copy components

---

## Tasks

### 1. Initialize packages/ui

```bash
cd packages/ui
npm init -y
```

Set up as an internal package:
- TypeScript configuration
- Tailwind CSS as peer dependency
- Barrel export from `src/index.ts`
- Build step (tsup or unbundled for monorepo)

### 2. Extract Layout Components

Move from `apps/web/src/components/` to `packages/ui/src/`:
- `Skeleton.tsx` (and skeleton variants)
- `Pagination.tsx`
- `ResponsiveTable.tsx`
- `EmptyState.tsx`
- `ErrorBoundary.tsx`
- `Toast.tsx` (and ToastProvider)
- `FocusTrap.tsx`
- `LiveRegion.tsx`

### 3. Extract Form Components

Move from `apps/web/src/components/forms/` to `packages/ui/src/forms/`:
- `FormField.tsx`
- `TextInput.tsx`
- `TextArea.tsx`
- `Select.tsx`
- `Checkbox.tsx`
- `RadioGroup.tsx`
- `FormActions.tsx`

### 4. Create Design Tokens

Create `packages/ui/src/tokens.ts`:
```typescript
export const colors = {
  primary: { 50: "...", 500: "...", 600: "...", 700: "..." },
  success: { ... },
  warning: { ... },
  danger: { ... },
  neutral: { ... },
};

export const spacing = { xs: "0.25rem", sm: "0.5rem", md: "1rem", lg: "1.5rem", xl: "2rem" };
export const radii = { sm: "0.25rem", md: "0.375rem", lg: "0.5rem", full: "9999px" };
```

### 5. Update apps/web Imports

Replace `apps/web/src/components/` imports with `@k12/ui` package imports:
```typescript
// Before
import { Pagination } from "@/components/Pagination";
// After
import { Pagination } from "@k12/ui";
```

### 6. Add Component Tests

Move existing component tests alongside the extracted components:
- `packages/ui/src/__tests__/Skeleton.test.tsx`
- `packages/ui/src/__tests__/Pagination.test.tsx`
- etc.

### 7. Add Storybook (Optional)

If time permits, add Storybook for component preview:
```bash
cd packages/ui && npx storybook@latest init
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/ui/package.json` | Package manifest |
| `packages/ui/tsconfig.json` | TypeScript config |
| `packages/ui/src/index.ts` | Barrel export |
| `packages/ui/src/tokens.ts` | Design tokens |
| `packages/ui/src/*.tsx` | Extracted components |
| `packages/ui/src/forms/*.tsx` | Extracted form components |

## Files to Modify

| File | Purpose |
|------|---------|
| `package.json` (root) | Add packages/ui to workspaces |
| `apps/web/package.json` | Add @k12/ui dependency |
| 50+ import statements in apps/web | Update to @k12/ui |

---

## Definition of Done

- [ ] packages/ui initialized with TypeScript and Tailwind peer dep
- [ ] 15+ components extracted with barrel export
- [ ] Design tokens centralized (colors, spacing, radii)
- [ ] apps/web imports updated to use @k12/ui
- [ ] No duplicate component files (originals removed from apps/web)
- [ ] All component tests pass in packages/ui
- [ ] Build produces valid TypeScript declarations
- [ ] No TypeScript errors across monorepo
