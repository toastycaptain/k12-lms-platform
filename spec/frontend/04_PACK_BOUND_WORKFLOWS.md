# Step 4 — Pack-bound workflows (Frontend)

## Outcome

After this step:

- The UI displays workflow state for curriculum documents using pack-defined states.
- The UI renders **only the workflow actions the backend says are available** for the current user.
- Transitions are triggered through a generic API call and reflected immediately in UI.
- The approval queue and status badges become **document-type agnostic** (not hard-coded to UnitPlan).

This step completes the “replace hard-coded workflows with pack workflows” change on the UI side.

---

## Dependencies

- Backend Step 4: pack-defined workflow engine exists.
- Backend Step 5: Curriculum Documents exist.
- Frontend Step 2: DocumentEditor exists.
- Frontend Step 3: document types/labels are available.

---

## Design decisions

### Decision 1 — Backend is the source of truth for action availability
The UI must not attempt to compute:

- which events are available based on roles
- guards (approval-required, validation, etc.)

Instead, backend should return `available_events` for the actor.

### Decision 2 — UI uses workflow “event descriptors”
A workflow event descriptor must include enough info to render a button/menu item:

- `event` (string)
- `label` (string)
- optional `confirmation` text
- optional `requires_comment` or `comment_label`

Labels ideally come from the pack, but backend should send them to reduce client coupling.

---

## API expectations (backend)

### Recommended: embed workflow meta in CurriculumDocument show response

`GET /api/v1/curriculum_documents/:id` should include:

```json
{
  "id": 1,
  "status": "draft",
  "workflow": {
    "state": "draft",
    "available_events": [
      {
        "event": "submit_for_approval",
        "label": "Submit for approval",
        "requires_comment": false,
        "confirm": "Submit this document for approval?"
      },
      {
        "event": "archive",
        "label": "Archive",
        "requires_comment": true,
        "comment_label": "Reason for archiving"
      }
    ]
  }
}
```

### Transition endpoint

`POST /api/v1/curriculum_documents/:id/transition`

Body:

```json
{ "event": "publish", "comment": "optional", "context": { } }
```

Return updated document (preferred) or 204.

---

## Implementation plan

### 1) Add workflow types

**Create:** `apps/web/src/curriculum/workflow/types.ts`

```ts
export interface WorkflowEvent {
  event: string;
  label: string;
  confirm?: string | null;
  requires_comment?: boolean;
  comment_label?: string | null;
}

export interface WorkflowMeta {
  state: string;
  available_events: WorkflowEvent[];
}
```

Update `CurriculumDocument` type (from Step 2) to include:

```ts
workflow?: WorkflowMeta;
```

---

### 2) Implement a `WorkflowBadge` component

**Create:** `apps/web/src/curriculum/workflow/WorkflowBadge.tsx`

- Displays current state (`document.status` or `document.workflow.state`).
- Uses neutral styling by default; optionally map common names (`draft`, `published`) to color accents.
- Do **not** assume the list of states.

---

### 3) Implement `WorkflowActions` component

**Create:** `apps/web/src/curriculum/workflow/WorkflowActions.tsx`

Inputs:

- `documentId`
- `events: WorkflowEvent[]`
- `onTransitionComplete()` callback

Behavior:

- Render as a button group or “Actions” dropdown.
- For an event with `confirm`, show a confirmation modal.
- For `requires_comment`, request a comment (modal textarea) before submitting.

On submit:

- call `apiFetch`:

```ts
await apiFetch(`/api/v1/curriculum_documents/${documentId}/transition`, {
  method: "POST",
  body: JSON.stringify({ event: eventName, comment }),
});
```

- call `onTransitionComplete()` (should trigger SWR revalidation in parent)

Error handling:

- show toast on failure
- display inline error for modal

Accessibility:

- modal traps focus
- buttons have aria-labels

---

### 4) Wire workflow UI into `DocumentEditor`

**Modify:** `apps/web/src/curriculum/documents/DocumentEditor.tsx`

Add to header:

- `<WorkflowBadge state={document.workflow?.state ?? document.status} />`
- `<WorkflowActions events={document.workflow?.available_events ?? []} ... />`

After transition:

- revalidate document SWR (`mutate`)

Note:

- If backend doesn’t embed `workflow`, temporarily hide actions.

---

### 5) Update any list views to show workflow badge

If you have created `DocumentList` (Step 5), add:

- a column for status
- use `WorkflowBadge`

If not yet, update existing list pages where status appears:

- `/plan/units` list page
- `/admin/approvals` page

---

### 6) Make Approval Queue document-agnostic

**Modify:** `apps/web/src/app/admin/approvals/page.tsx`

Current issues:

- It assumes `approval.approvable_type === "UnitPlan"` and links to `/plan/units/:id/preview`.

Route 3 requirement:

- approvals may be created for `CurriculumDocument` (or other types) by pack-defined workflow side-effects.

Update strategy:

1. Add a link resolver function:

```ts
function approvalLink(approval: Approval): string | null {
  if (approval.approvable_type === "CurriculumDocument") {
    return `/plan/documents/${approval.approvable_id}/preview`;
  }
  if (approval.approvable_type === "UnitPlan") {
    return `/plan/units/${approval.approvable_id}/preview`;
  }
  return null;
}
```

2. When a link is available, render `View Preview`.

3. Update label string to be more generic:

- from `UnitPlan #id` to `${approval.approvable_type} #id`

4. (Optional but recommended) If backend includes approvable summary data (title/document_type), display it.

---

### 7) Update legacy workflow buttons on UnitPlan pages (bridge)

Until Step 5 fully migrates UnitPlan to CurriculumDocuments:

- keep UnitPlan publish button, but consider replacing it with `WorkflowActions` once backend supports workflow meta for UnitPlans.

This is optional.

---

## Testing

### Unit tests

- `WorkflowActions`:
  - renders provided events
  - opens confirm modal
  - requires comment when specified
  - calls transition endpoint

Mock `apiFetch` and verify payload.

### E2E

- Open a curriculum document editor
- Trigger an available event
- Confirm document status changes

---

## Acceptance criteria

- Workflow actions shown are exactly those returned by backend.
- Pack-defined, non-standard state names display correctly.
- Transition errors do not crash the editor and are surfaced to the user.
- Approval queue no longer hard-codes UnitPlan.

---

## Rollout notes

- If backend does not yet embed workflow meta, ship UI components and keep them hidden until it does.
- Preserve legacy publish flows until Curriculum Documents replace UnitPlans in production.
