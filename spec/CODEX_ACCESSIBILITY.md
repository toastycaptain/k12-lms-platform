# Codex Instructions — Accessibility (WCAG 2.1 AA)

## Objective

Audit and fix accessibility across the platform per PRD-23 (non-functional requirement: Accessibility). K-12 platforms must meet WCAG 2.1 AA — schools receiving federal funding are required to comply with Section 508, which references WCAG. This task installs a11y tooling, audits key user flows, and fixes the most impactful issues.

---

## What Already Exists

### Frontend
- Next.js app at `apps/web/` with Tailwind CSS
- All pages use `"use client"`, `ProtectedRoute`, `AppShell` wrapper
- No a11y linting configured
- No ARIA attributes beyond native HTML semantics
- No skip navigation links
- No focus management for modals or dynamic content
- Existing test setup: Vitest + @testing-library/react + @testing-library/jest-dom

### Scope
- ~40+ pages across `/learn/`, `/teach/`, `/plan/`, `/admin/`, `/communicate/`
- Key components: AppShell (sidebar + top bar), GlobalSearch, NotificationBell, ProtectedRoute
- Interactive patterns: forms, modals/dialogs, dropdowns, tabs, drag-and-drop, chat messages

---

## Task 1: Install A11y Tooling

**In `apps/web/`:**

1. Install ESLint accessibility plugin:
```bash
npm install -D eslint-plugin-jsx-a11y
```

2. **Modify:** `apps/web/eslint.config.mjs` (or `.eslintrc.*`)

Add the jsx-a11y plugin with recommended rules:
```javascript
// Add to the ESLint config:
import jsxA11y from "eslint-plugin-jsx-a11y";

// In the config array/rules:
{
  plugins: { "jsx-a11y": jsxA11y },
  rules: {
    ...jsxA11y.configs.recommended.rules,
    // Override specific rules if needed:
    "jsx-a11y/anchor-is-valid": "warn",  // Next.js Link uses anchor differently
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn",
  }
}
```

3. Install axe-core for integration testing:
```bash
npm install -D @axe-core/react axe-core vitest-axe
```

4. **Modify:** `apps/web/src/test/setup.ts` — add axe matchers:
```typescript
import "@testing-library/jest-dom/vitest";
import "vitest-axe/extend-expect";
```

5. Run `npm run lint` and document the initial violation count (do NOT fix everything in this step — just install and report).

---

## Task 2: Skip Navigation & Landmarks

**Modify:** `apps/web/src/components/AppShell.tsx`

**Requirements:**
1. Add a "Skip to main content" link as the FIRST focusable element in the page:
   ```html
   <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:rounded">
     Skip to main content
   </a>
   ```
2. Add `id="main-content"` to the main content area
3. Add ARIA landmarks:
   - `<nav aria-label="Main navigation">` on the sidebar
   - `<main id="main-content" role="main">` on the content area
   - `<header role="banner">` on the top bar
   - `<aside aria-label="Notifications">` on the notification dropdown
4. Add `aria-current="page"` to the active nav item in the sidebar
5. Ensure sidebar toggle button has `aria-expanded` and `aria-controls` attributes

---

## Task 3: Focus Management

**Modify multiple files** — add focus management for dynamic UI patterns:

### 3a. Modal/Dialog Focus Trap

Many pages use inline forms that appear/disappear (e.g., "New Announcement" form, compose message). These need focus trapping.

**Create:** `apps/web/src/components/FocusTrap.tsx`

```typescript
"use client";
import { useEffect, useRef, ReactNode } from "react";

interface FocusTrapProps {
  active: boolean;
  children: ReactNode;
}

export function FocusTrap({ active, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
}
```

### 3b. Dropdown Focus Return

**Modify:** `apps/web/src/components/GlobalSearch.tsx`
- When the search dropdown closes (Escape or blur), return focus to the search input
- Add `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` to the search input
- Add `role="listbox"` to the results dropdown
- Add `role="option"` and `id` to each result item
- Update `aria-activedescendant` as arrow keys navigate results

**Modify:** `apps/web/src/components/NotificationBell.tsx`
- When the notification panel closes, return focus to the bell button
- Add `aria-haspopup="true"` and `aria-expanded` to the bell button
- Add `role="menu"` to the dropdown
- Add `role="menuitem"` to each notification
- Add `aria-label` with unread count: `aria-label="Notifications, 3 unread"`

### 3c. Tab Panel Focus

Pages using tabs (e.g., communicate page with Announcements/Messages tabs):

**Modify:** `apps/web/src/app/communicate/page.tsx`
- Add `role="tablist"` to the tab container
- Add `role="tab"`, `aria-selected`, `aria-controls`, `id` to each tab button
- Add `role="tabpanel"`, `aria-labelledby`, `id` to each tab panel
- Arrow keys should move between tabs
- Tab key should move focus INTO the active panel

Apply the same pattern to any other pages using tabs (grades page, curriculum map).

---

## Task 4: Form Accessibility

Audit and fix forms across key pages:

### 4a. Label Association

**Audit the following pages** and ensure every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` with `htmlFor` matching the input's `id`:

- `apps/web/src/app/communicate/compose/page.tsx`
- `apps/web/src/app/communicate/page.tsx` (announcement form)
- `apps/web/src/app/setup/page.tsx`
- `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx`
- `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx` (submission form)
- `apps/web/src/app/admin/standards/page.tsx` (if created by CODEX_STANDARDS_COVERAGE)

For inputs that use visual-only labels (placeholder text or nearby text), add either:
- A proper `<label>` element, or
- `aria-label` attribute on the input

### 4b. Error Messaging

Forms should announce errors to screen readers:

- Add `aria-invalid="true"` to inputs with validation errors
- Add `aria-describedby` pointing to the error message element
- Error messages should have `role="alert"` or use `aria-live="polite"`

### 4c. Required Fields

- Add `aria-required="true"` or the HTML `required` attribute to mandatory fields
- Ensure the visual required indicator (e.g., asterisk) is paired with `aria-label` or screen-reader text

---

## Task 5: Color Contrast & Visual Indicators

### 5a. Status Badges

Audit status badges across the app (submitted, graded, draft, published, locked, etc.) and ensure:
- Text color vs. background color meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- Do NOT rely solely on color to convey meaning — add text labels or icons alongside color

Common problem areas:
- Yellow/orange badges on white backgrounds
- Light green text on white backgrounds
- Gray placeholder text that doesn't meet contrast

### 5b. Focus Indicators

Ensure all interactive elements have visible focus indicators:
- Buttons, links, inputs should show a focus ring (Tailwind `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`)
- Remove any `outline-none` or `focus:outline-none` that doesn't have a replacement focus style
- Tab navigation should have a clear visual progression through the page

### 5c. Progress Bars

Progress bars (module completion, grade bars, standards coverage) need:
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label` describing what the progress represents (e.g., "Module completion: 3 of 5 items")

---

## Task 6: Keyboard Navigation

### 6a. Click-Only Handlers

Search all pages for `onClick` handlers on non-interactive elements (`<div>`, `<span>`, `<tr>`). For each:
- Add `role="button"` and `tabIndex={0}` if the element should be interactive
- Add `onKeyDown` handler that triggers on Enter and Space
- OR replace with a `<button>` or `<a>` element (preferred)

Common problem areas:
- Thread list items in messaging (clickable divs)
- Module items in course view (clickable divs)
- Notification items in dropdown (clickable divs)
- Course cards on dashboard (clickable divs)
- Grade rows in grades page (clickable divs)

### 6b. Drag-and-Drop Alternative

The module editor (CODEX_TEACHER_UX_DEPTH Task 5) uses drag-and-drop for reordering items. This is inaccessible to keyboard and screen reader users.

**Modify:** `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx`

Add keyboard-accessible reordering:
- "Move Up" and "Move Down" buttons on each item (visible on focus or via a menu)
- Buttons call the same reorder API as drag-and-drop
- Screen reader announcement: `aria-live="polite"` region that announces "Item moved to position X"

---

## Task 7: Screen Reader Announcements

**Create:** `apps/web/src/components/LiveRegion.tsx`

```typescript
"use client";
import { useEffect, useState } from "react";

// A reusable component for screen reader announcements
export function LiveRegion() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setMessage(e.detail);
      // Clear after announcement
      setTimeout(() => setMessage(""), 1000);
    };
    window.addEventListener("sr-announce", handler as EventListener);
    return () => window.removeEventListener("sr-announce", handler as EventListener);
  }, []);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

// Helper to trigger announcements from anywhere
export function announce(message: string) {
  window.dispatchEvent(new CustomEvent("sr-announce", { detail: message }));
}
```

**Integrate into AppShell:** Add `<LiveRegion />` to the AppShell layout.

**Use `announce()` in key locations:**
- After form submission success/failure
- After navigation tab changes
- After items are reordered
- After search results load
- After notification is marked as read

---

## Task 8: A11y Integration Tests

**Create:** `apps/web/src/app/__tests__/a11y.test.tsx`

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "vitest-axe";

expect.extend(toHaveNoViolations);

// Test key page components for a11y violations
// Note: These test the component rendering, not full page loads

describe("Accessibility", () => {
  it("AppShell has no violations", async () => {
    // Render AppShell with mock content and run axe
    // This is a smoke test — not exhaustive
  });

  // Add tests for other key components as they are audited
});
```

The goal is not 100% coverage but a foundation for ongoing a11y testing.

---

## Architecture Rules

1. Do NOT add a11y fixes that break existing functionality
2. Prefer semantic HTML over ARIA (e.g., use `<button>` instead of `<div role="button">`)
3. Focus management should feel natural — don't over-engineer focus trapping
4. Color is never the SOLE indicator of state — always pair with text or icons
5. All `aria-*` attributes must be valid — incorrect ARIA is worse than no ARIA
6. Test with keyboard-only navigation: Tab, Shift+Tab, Enter, Space, Escape, Arrow keys
7. Screen reader announcements should be concise — don't over-announce
8. Changes should be incremental — audit one page category at a time

---

## Testing

```bash
cd apps/web && npm run lint && npm run typecheck && npm run build && npm run test
```

Manually test:
1. Navigate all key pages using only the keyboard (Tab through, Enter to activate)
2. Verify skip navigation link works
3. Verify focus returns correctly after closing dropdowns/modals
4. Verify all forms have associated labels (inspect with browser dev tools: Accessibility tab)

---

## Definition of Done

- [ ] eslint-plugin-jsx-a11y installed and configured
- [ ] axe-core/vitest-axe installed for integration testing
- [ ] Skip navigation link in AppShell
- [ ] ARIA landmarks on sidebar, header, main content
- [ ] Focus management: FocusTrap component, dropdown focus return, tab panel navigation
- [ ] GlobalSearch has combobox ARIA pattern
- [ ] NotificationBell has menu ARIA pattern
- [ ] Tab panels have proper tablist/tab/tabpanel roles
- [ ] Form labels associated with all inputs across key pages
- [ ] Error messages use aria-invalid and aria-describedby
- [ ] Progress bars have role="progressbar" with aria-value attributes
- [ ] Click-only divs replaced with buttons or given keyboard handlers
- [ ] Drag-and-drop has keyboard alternative (Move Up/Down buttons)
- [ ] LiveRegion component for screen reader announcements
- [ ] Initial a11y integration test
- [ ] All lint and build checks pass
