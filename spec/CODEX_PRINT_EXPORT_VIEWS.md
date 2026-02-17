# CODEX_PRINT_EXPORT_VIEWS — Print-Friendly Views for Lesson Plans, Gradebooks, and Reports

**Priority:** P2
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-9 (PDF export), PRD-5 (Teacher Problems — reduce friction), UX-3.4 (Teacher Screens)
**Depends on:** None

---

## Problem

Teachers frequently need to print or share physical copies of lesson plans, gradebooks, and student reports. Currently:

1. **No print stylesheets** — printing any page includes navigation, sidebars, and interactive elements
2. **PDF export exists for unit plans only** — PdfExportJob handles unit plan export, but no print-friendly views exist for other content
3. **Gradebook not printable** — the scrollable grid with sticky headers doesn't translate to paper; columns overflow or get cut off
4. **Progress reports not printable** — no print layout for student progress data (needed for parent conferences)
5. **Lesson plans not printable** — lesson content is embedded in an editor interface, not a clean document view
6. **No "Print Preview" mode** — users can't see how content will appear before printing
7. **Report cards not exportable** — no summary view of student grades across courses suitable for print or PDF

---

## Tasks

### 1. Create Global Print Stylesheet

Create `apps/web/src/styles/print.css`:

```css
@media print {
  /* Hide non-content elements */
  nav, .app-sidebar, .app-topbar, .connection-banner,
  .notification-bell, .ai-panel, .batch-action-bar,
  button:not(.print-include), .search-bar, .filter-bar,
  .bottom-tab-bar, .scroll-indicator { display: none !important; }

  /* Reset layout */
  .app-main { margin: 0; padding: 0; max-width: 100%; }
  body { background: white; color: black; font-size: 12pt; }

  /* Prevent page breaks inside key elements */
  .no-break { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  table { break-inside: auto; }
  tr { break-inside: avoid; }

  /* Clean links */
  a { color: black; text-decoration: none; }
  a[href]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #666; }
  a[href^="#"]::after, a[href^="javascript"]::after { content: ""; }
}
```

Import in `apps/web/src/app/layout.tsx`.

### 2. Create Print Layout Component

Create `apps/web/src/components/PrintLayout.tsx`:

```typescript
interface PrintLayoutProps {
  title: string;
  subtitle?: string;
  schoolName?: string;
  date?: string;
  children: React.ReactNode;
}

export function PrintLayout({ title, subtitle, schoolName, date, children }: PrintLayoutProps) {
  return (
    <div className="print-layout hidden print:block">
      <header className="mb-6 border-b pb-4">
        {schoolName && <p className="text-sm text-gray-500">{schoolName}</p>}
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        {date && <p className="text-sm text-gray-400">{date}</p>}
      </header>
      <main>{children}</main>
      <footer className="mt-8 border-t pt-2 text-xs text-gray-400">
        Printed from K-12 Planning + LMS — {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}
```

### 3. Create Print Button Component

Create `apps/web/src/components/PrintButton.tsx`:

```typescript
interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "Print" }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
    >
      <PrinterIcon className="h-4 w-4" />
      {label}
    </button>
  );
}
```

### 4. Create Printable Lesson Plan View

Create `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/print/page.tsx`:

**Layout:**
- School name, teacher name, date
- Lesson title and unit context
- **Standards** — aligned standards as a bulleted list
- **Objectives** — learning objectives
- **Duration** — total time and activity breakdown
- **Activities** — each activity with description, duration, and materials
- **Resources** — list of attached resources with titles
- **Assessment** — formative/summative assessment descriptions
- **Differentiation** — modifications and accommodations
- Clean typography, no interactive elements

### 5. Create Printable Gradebook View

Create `apps/web/src/app/teach/courses/[courseId]/gradebook/print/page.tsx`:

**Layout:**
- Course name, teacher name, term, date
- Compact table: Student Name | Assignment columns | Average
- Rotated column headers to fit more assignments
- Grade cells with just the numeric value
- Missing work marked with "M", late with "L"
- Summary row at bottom with class averages
- Optimized for landscape orientation

Add print CSS:
```css
@media print {
  .gradebook-print { page: landscape; }
  @page gradebook-print { size: landscape; margin: 0.5in; }
}
```

### 6. Create Printable Student Report Card

Create `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/print/page.tsx`:

**Layout:**
- Student name, course, teacher, term
- **Grade Summary** — Overall average, letter grade, credits
- **Assignment Breakdown** — Table with assignment name, due date, grade, status
- **Standards Mastery** — List of standards with mastery status (Met/Approaching/Not Met)
- **Teacher Comments** — Editable text area for teacher to add comments before printing
- **Attendance** — Days present/absent (if data available)
- Signature lines: Teacher, Parent/Guardian, Student

### 7. Create Printable Unit Plan View

Update existing PDF export to also have a browser print view:

Create `apps/web/src/app/plan/units/[id]/print/page.tsx`:
- Full unit plan with all lessons listed
- Standards alignment table
- Resource list
- Timeline/schedule overview

### 8. Add Print Buttons to Source Pages

Add `<PrintButton />` and link to print views on:
- `/plan/units/[id]` — "Print Unit Plan" button
- `/plan/units/[id]/lessons/[lessonId]` — "Print Lesson Plan" button
- `/teach/courses/[courseId]/gradebook` — "Print Gradebook" button
- `/teach/courses/[courseId]/progress/[studentId]` — "Print Report Card" button

### 9. Add Tests

**Frontend:**
- `apps/web/src/components/__tests__/PrintLayout.test.tsx`
  - Renders title, subtitle, school name
  - Footer shows current date

- `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/print/page.test.tsx`
  - Renders lesson content in print format
  - Hides interactive elements
  - Shows standards and objectives

- `apps/web/src/app/teach/courses/[courseId]/gradebook/print/page.test.tsx`
  - Renders compact grade table
  - Shows missing/late indicators
  - Includes summary row

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/styles/print.css` | Global print stylesheet |
| `apps/web/src/components/PrintLayout.tsx` | Print header/footer wrapper |
| `apps/web/src/components/PrintButton.tsx` | Print trigger button |
| `apps/web/src/app/plan/units/[id]/print/page.tsx` | Unit plan print view |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/print/page.tsx` | Lesson plan print view |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/print/page.tsx` | Gradebook print view |
| `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/print/page.tsx` | Report card print view |
| `apps/web/src/components/__tests__/PrintLayout.test.tsx` | Layout tests |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/print/page.test.tsx` | Lesson print tests |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/print/page.test.tsx` | Gradebook print tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/app/layout.tsx` | Import print.css |
| `apps/web/src/app/plan/units/[id]/page.tsx` | Add print button |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` | Add print button |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx` | Add print button |
| `apps/web/src/app/teach/courses/[courseId]/progress/[studentId]/page.tsx` | Add print button |

---

## Definition of Done

- [ ] Global print stylesheet hides navigation, sidebars, and interactive elements
- [ ] PrintLayout component provides consistent header/footer for printed documents
- [ ] Lesson plan print view renders clean, formatted document with standards and activities
- [ ] Gradebook print view renders compact table optimized for landscape printing
- [ ] Student report card includes grade summary, assignment breakdown, and signature lines
- [ ] Unit plan print view shows all lessons and standards
- [ ] Print buttons added to source pages
- [ ] All print views use semantic HTML for clean rendering
- [ ] All frontend tests pass
- [ ] No TypeScript errors
