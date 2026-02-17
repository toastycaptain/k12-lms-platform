# CODEX_FORM_LIBRARY_AND_ERROR_PAGES — Reusable Form Components + Global Error Pages

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** PRD-23 (Accessibility), UX-3.1 (Global UX Principles), TECH-2.1
**Depends on:** None

---

## Problem

### Forms
Every page builds forms inline with raw `<input>`, `<select>`, `<textarea>` elements and Tailwind classes. This causes:

1. **Inconsistent styling** — each page styles form elements differently
2. **No accessibility patterns** — missing labels, error messages, aria-describedby on inputs
3. **No validation feedback** — no standardized error display pattern
4. **Duplication** — same input styling repeated across 30+ pages

### Error Pages
Segment-level `error.tsx` files exist but:

1. **No global-error.tsx** — unhandled errors outside route segments crash with no UI
2. **No not-found.tsx** — invalid URLs show no custom 404 page
3. **No loading.tsx at root** — no fallback while routes load

---

## Tasks

### 1. Create Base Form Components

Create `apps/web/src/components/forms/`:

**FormField** — wrapper with label, error, and description:
```typescript
interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}
```
- Renders `<label>` with `htmlFor`
- Shows required asterisk
- Renders error with `role="alert"` and `aria-live="polite"`
- Links input to error via `aria-describedby`

**TextInput** — styled input with error state:
```typescript
interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}
```

**TextArea** — styled textarea with auto-resize option

**Select** — styled select dropdown

**Checkbox** — accessible checkbox with label

**RadioGroup** — group of radio buttons with fieldset/legend

**FormActions** — submit/cancel button row with loading state

### 2. Create Global Error Pages

**`apps/web/src/app/global-error.tsx`**:
- Full-page error with "Something went wrong" message
- "Try again" button
- Link to home page
- Does NOT use root layout (Next.js requirement)

**`apps/web/src/app/not-found.tsx`**:
- Custom 404 page
- "Page not found" message
- Link back to dashboard
- Uses root layout

**`apps/web/src/app/loading.tsx`**:
- Root loading fallback with centered spinner/skeleton

### 3. Migrate High-Impact Forms

Update these pages to use form components:
1. `/admin/users` — user creation/editing forms
2. `/plan/units/[id]` — unit plan editor
3. `/teach/courses/[courseId]/assignments/new` — assignment creation
4. `/assess/quizzes/new` — quiz creation
5. `/communicate/compose` — message composition
6. `/admin/school` — school setup form
7. `/admin/integrations/saml` — SAML configuration

### 4. Add Tests

- `apps/web/src/components/forms/__tests__/FormField.test.tsx` — label, error, aria
- `apps/web/src/components/forms/__tests__/TextInput.test.tsx`
- `apps/web/src/components/forms/__tests__/Select.test.tsx`
- `apps/web/src/app/__tests__/not-found.test.tsx`
- `apps/web/src/app/__tests__/global-error.test.tsx`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/forms/FormField.tsx` | Label + error wrapper |
| `apps/web/src/components/forms/TextInput.tsx` | Styled input |
| `apps/web/src/components/forms/TextArea.tsx` | Styled textarea |
| `apps/web/src/components/forms/Select.tsx` | Styled select |
| `apps/web/src/components/forms/Checkbox.tsx` | Accessible checkbox |
| `apps/web/src/components/forms/RadioGroup.tsx` | Radio button group |
| `apps/web/src/components/forms/FormActions.tsx` | Submit/cancel row |
| `apps/web/src/components/forms/index.ts` | Barrel export |
| `apps/web/src/app/global-error.tsx` | Global error page |
| `apps/web/src/app/not-found.tsx` | 404 page |
| `apps/web/src/app/loading.tsx` | Root loading fallback |

## Files to Modify

| File | Purpose |
|------|---------|
| 7+ page files | Adopt form components |

---

## Definition of Done

- [ ] 7 form components created with consistent styling
- [ ] FormField renders accessible labels, errors, descriptions
- [ ] Inputs have proper aria-describedby linking to errors
- [ ] global-error.tsx catches unhandled errors
- [ ] not-found.tsx renders custom 404
- [ ] loading.tsx provides root loading state
- [ ] 7 high-impact forms migrated to new components
- [ ] All component tests pass
- [ ] No accessibility violations (axe)
- [ ] No TypeScript errors
