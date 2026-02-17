# CODEX_SHARED_UI_EXTRACTION — Populate packages/ui Design System

**Priority:** P1
**Effort:** Medium (8–12 hours)
**Spec Refs:** TECH-2.2 (Monorepo structure — packages/ui)
**Depends on:** None

---

## Problem

`packages/ui` is empty (`.gitkeep` only). The TECH_SPEC §2.2 specifies a shared design system at this path. Currently, UI primitives are implemented inline across 80+ page files in `apps/web`, leading to:

1. **Duplicated patterns** — Button, Input, Modal, Card, Badge, Tabs, Select, and Dropdown are re-implemented inline on many pages
2. **Inconsistent styling** — Tailwind class combinations vary for the same visual element
3. **No component documentation** — No way to browse available UI primitives
4. **Add-on pages can't reuse** — Workspace and Classroom add-on pages duplicate UI code

---

## Solution

Extract commonly-used UI primitives from `apps/web` page code into `packages/ui` as a shared React component library, consumed by `apps/web` via workspace package reference.

---

## Tasks

### 1. Initialize Package

Set up `packages/ui` as an npm workspace package:

```
packages/ui/
  package.json
  tsconfig.json
  src/
    index.ts          # barrel export
    components/
      Button.tsx
      Input.tsx
      Select.tsx
      Textarea.tsx
      Modal.tsx
      Card.tsx
      Badge.tsx
      Tabs.tsx
      Dropdown.tsx
      Label.tsx
      Alert.tsx
      Avatar.tsx
      Spinner.tsx
  __tests__/
    Button.test.tsx
    Input.test.tsx
    Modal.test.tsx
```

**package.json:**
```json
{
  "name": "@k12-lms/ui",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### 2. Extract Button Component

Audit all 80 pages for `<button` usage patterns. Consolidate into:

```typescript
// packages/ui/src/components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
```

Common Tailwind patterns to unify:
- Primary: `bg-blue-600 text-white hover:bg-blue-700 ...`
- Secondary: `border border-gray-300 text-gray-700 hover:bg-gray-50 ...`
- Danger: `bg-red-600 text-white hover:bg-red-700 ...`
- Ghost: `text-gray-600 hover:bg-gray-100 ...`
- Loading state: disabled + spinner icon

### 3. Extract Input/Select/Textarea Components

Consolidate form field patterns:

```typescript
// packages/ui/src/components/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
```

Include:
- Label association (htmlFor/id)
- Error state styling (red border, error message below)
- Required indicator
- Disabled state

### 4. Extract Modal Component

Consolidate modal/dialog patterns:

```typescript
// packages/ui/src/components/Modal.tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}
```

Include:
- Backdrop overlay
- Focus trap (use existing FocusTrap component)
- Escape key to close
- Prevent scroll behind modal
- Accessible: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

### 5. Extract Card, Badge, Tabs, Alert, Avatar, Spinner

Each as a simple presentational component with variant props.

### 6. Create Barrel Export

```typescript
// packages/ui/src/index.ts
export { Button } from "./components/Button";
export { Input } from "./components/Input";
export { Select } from "./components/Select";
export { Textarea } from "./components/Textarea";
export { Modal } from "./components/Modal";
export { Card } from "./components/Card";
export { Badge } from "./components/Badge";
export { Tabs } from "./components/Tabs";
export { Dropdown } from "./components/Dropdown";
export { Label } from "./components/Label";
export { Alert } from "./components/Alert";
export { Avatar } from "./components/Avatar";
export { Spinner } from "./components/Spinner";
```

### 7. Wire into apps/web

Update `apps/web/package.json`:
```json
{
  "dependencies": {
    "@k12-lms/ui": "workspace:*"
  }
}
```

Update `apps/web/tsconfig.json` paths if needed.

### 8. Migrate 10 Most-Used Pages

Replace inline Tailwind button/input/modal patterns with imported components on these high-traffic pages:
- `/dashboard`
- `/plan/units`
- `/plan/units/[id]`
- `/teach/courses`
- `/teach/courses/[courseId]`
- `/teach/courses/[courseId]/assignments/[assignmentId]`
- `/admin/users`
- `/admin/school`
- `/assess/quizzes/[quizId]`
- `/login`

### 9. Add Component Tests

Write tests for Button, Input, and Modal at minimum:
- Render with default props
- Render with each variant
- Click handler fires
- Disabled state prevents interaction
- Modal opens/closes
- Modal traps focus
- Accessibility: role, aria attributes

### 10. Update Root package.json Workspaces

Ensure the root `package.json` includes `packages/ui` in workspaces (if using npm workspaces).

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/ui/package.json` | Package manifest |
| `packages/ui/tsconfig.json` | TypeScript config |
| `packages/ui/src/index.ts` | Barrel export |
| `packages/ui/src/components/Button.tsx` | Button component |
| `packages/ui/src/components/Input.tsx` | Input component |
| `packages/ui/src/components/Select.tsx` | Select component |
| `packages/ui/src/components/Textarea.tsx` | Textarea component |
| `packages/ui/src/components/Modal.tsx` | Modal/dialog component |
| `packages/ui/src/components/Card.tsx` | Card component |
| `packages/ui/src/components/Badge.tsx` | Badge component |
| `packages/ui/src/components/Tabs.tsx` | Tabs component |
| `packages/ui/src/components/Dropdown.tsx` | Dropdown component |
| `packages/ui/src/components/Label.tsx` | Label component |
| `packages/ui/src/components/Alert.tsx` | Alert/banner component |
| `packages/ui/src/components/Avatar.tsx` | Avatar component |
| `packages/ui/src/components/Spinner.tsx` | Loading spinner |
| `packages/ui/__tests__/Button.test.tsx` | Button tests |
| `packages/ui/__tests__/Input.test.tsx` | Input tests |
| `packages/ui/__tests__/Modal.test.tsx` | Modal tests |

---

## Definition of Done

- [ ] `packages/ui/package.json` exists with correct peer dependencies
- [ ] 13 UI components exported from `packages/ui/src/index.ts`
- [ ] `apps/web` imports from `@k12-lms/ui` successfully
- [ ] 10 pages migrated to use shared components
- [ ] 3+ component test files with passing tests
- [ ] No TypeScript errors across workspace
- [ ] No lint errors
- [ ] Build succeeds
- [ ] All existing tests pass
