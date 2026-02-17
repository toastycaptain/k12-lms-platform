# CODEX_AI_APPLY_TO_PLAN — Wire AI Output into Plan Persistence

**Priority:** P1
**Effort:** Small (3–4 hours)
**Spec Refs:** PRD-21 (AI-Assisted Planning — save draft), UX-3.7 (AI Panel — Apply-to-plan)
**Depends on:** None

---

## Problem

The AI Assistant Panel has an "Apply" button that calls an `onApply(responseText)` callback, but:

1. **No structured parsing** — AI output is raw text, not parsed into plan fields (objectives, activities, materials)
2. **Parent pages don't implement onApply** — most pages pass no `onApply` callback, making the button a no-op
3. **No field-level apply** — can't apply AI output to a specific field (e.g., just objectives)
4. **No diff/preview** — no way to see what will change before applying
5. **AI invocation not linked to plan** — invocation context stores IDs but doesn't track which plan was modified

---

## Tasks

### 1. Define AI Output Schemas per Task Type

Create `apps/web/src/lib/ai-output-parser.ts`:

```typescript
interface LessonPlanOutput {
  objectives?: string;
  activities?: string;
  materials?: string;
  assessment_notes?: string;
  duration_minutes?: number;
}

interface UnitPlanOutput {
  description?: string;
  essential_questions?: string;
  enduring_understandings?: string;
}

export function parseLessonOutput(text: string): LessonPlanOutput { ... }
export function parseUnitOutput(text: string): UnitPlanOutput { ... }
```

Parse AI responses that use markdown headers or structured sections into field-level data.

### 2. Wire onApply into Unit Planner

Update `apps/web/src/app/plan/units/[id]/page.tsx`:
- Pass `onApply` callback to AiAssistantPanel
- When apply is called, parse output into unit fields
- Show diff modal: "The following fields will be updated: [list]"
- On confirm, PATCH `/api/v1/unit_plans/:id` with parsed fields
- Revalidate data after successful apply

### 3. Wire onApply into Lesson Editor

Update `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx`:
- Pass `onApply` callback to AiAssistantPanel
- Parse output into lesson version fields
- Show diff modal with field-level changes
- On confirm, create new lesson version or PATCH current version
- Revalidate data

### 4. Add Field-Level Apply

Add dropdown to the Apply button:
- "Apply All" — applies all parsed fields
- "Apply Objectives Only"
- "Apply Activities Only"
- etc.

This gives teachers fine-grained control over what AI output they accept.

### 5. Track Apply in Invocation

Update AI invocation metadata to record when output was applied:
- PATCH `/api/v1/ai_invocations/:id` with `{ applied_at: timestamp, applied_to: { type: "lesson_plan", id: 123 } }`
- This creates an audit trail of AI-to-plan edits

### 6. Add Tests

- `apps/web/src/lib/__tests__/ai-output-parser.test.ts`
- Update unit planner and lesson editor tests to verify apply flow

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/lib/ai-output-parser.ts` | Parse AI text into structured fields |
| `apps/web/src/components/AiApplyModal.tsx` | Diff preview + confirm modal |
| `apps/web/src/lib/__tests__/ai-output-parser.test.ts` | Parser tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/web/src/app/plan/units/[id]/page.tsx` | Wire onApply for units |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` | Wire onApply for lessons |
| `apps/web/src/components/AiAssistantPanel.tsx` | Add field-level apply dropdown |

---

## Definition of Done

- [ ] AI output parsed into structured plan fields per task type
- [ ] Unit planner onApply writes parsed fields to unit plan via PATCH
- [ ] Lesson editor onApply writes to lesson version via PATCH
- [ ] Diff modal shows what fields will change before applying
- [ ] Field-level apply lets teachers choose which fields to accept
- [ ] AI invocation updated with applied_at metadata for audit trail
- [ ] Parser tests cover common AI output formats
- [ ] No TypeScript errors
