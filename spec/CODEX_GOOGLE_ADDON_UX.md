# Codex Instructions — Google Workspace & Classroom Add-On UX

## Objective

Build the frontend host pages for the Google Workspace sidebar add-on and Classroom add-on, completing the product surface for PRD Phase 5. The backend APIs exist; this task creates the user-facing experiences.

**Spec references:** PRD-13 (Google Integrations), UX-3.8 (Google & Classroom Add-Ons)

---

## What Already Exists (DO NOT recreate)

### Backend
- `apps/core/app/controllers/api/v1/addon_controller.rb` — unit_plans, lessons, unit_plan_standards, standards, templates, ai_generate, attach, me
- `apps/core/app/jobs/classroom_course_sync_job.rb` — syncs courses from Google Classroom
- `apps/core/app/jobs/classroom_roster_sync_job.rb` — syncs rosters
- `apps/core/app/jobs/classroom_grade_passback_job.rb` — pushes grades to Classroom
- `apps/core/app/jobs/classroom_coursework_push_job.rb` — pushes assignments to Classroom
- `apps/core/app/controllers/api/v1/drive_controller.rb` — create_document, create_presentation, show_file, picker_token

### Frontend
- `apps/web/src/components/GoogleDrivePicker.tsx` — Google Drive file picker
- `apps/web/src/components/AiAssistPanel.tsx` — AI assistant sidebar
- `apps/web/src/lib/api.ts` — API client with credentials

---

## Task 1: Google Workspace Sidebar Host Page

Google Workspace Add-ons (Docs/Slides) load an iframe pointing to a URL the add-on host provides. This page is the host for that iframe.

**Create:** `apps/web/src/app/addon/workspace/page.tsx`

**Requirements:**
1. `"use client"` — runs inside Google Workspace iframe
2. Minimal chrome — no AppShell sidebar, no top bar (this is embedded in a Google Apps sidebar)
3. On mount:
   - Check authentication via `GET /api/v1/addon/me`
   - If not authenticated → show "Sign in to connect" with link that opens auth in a popup
4. Main UI:
   - **Unit Plans tab:** fetch `GET /api/v1/addon/unit_plans` → list units with "Insert" buttons
   - **Standards tab:** fetch `GET /api/v1/addon/standards` → browse standards tree
   - **AI Assist tab:** mini AI generation panel (same as AiAssistPanel but compact)
5. "Insert" action:
   - When user clicks "Insert" on a unit/standard, call `POST /api/v1/addon/attach` to create a resource link between the active Google Doc/Slide and the selected item
   - Show success toast
6. "Create" action:
   - "Create from Template" button → fetch `GET /api/v1/addon/templates` → select template → creates unit plan linked to the current doc
7. Responsive layout: max-width 350px (Google sidebar width)
8. Use existing app styles (Tailwind) but adapt spacing for narrow layout

**Google Apps Script / manifest considerations:**
- Create `apps/web/public/addon-manifest.json` with the sidebar URL and required scopes
- Or document the Google Cloud Console setup needed to register the add-on

---

## Task 2: Classroom Add-On Host Page

Google Classroom Add-ons use a similar iframe model for the assignment creation flow.

**Create:** `apps/web/src/app/addon/classroom/page.tsx`

**Requirements:**
1. `"use client"` — runs inside Google Classroom iframe
2. Minimal chrome — no AppShell
3. On mount:
   - Authenticate via `GET /api/v1/addon/me`
   - Fetch courses from `GET /api/v1/courses` to map Classroom course to LMS course
4. Main UI — Assignment attachment flow:
   - List assignments from the mapped course: `GET /api/v1/courses/{courseId}/assignments`
   - "Attach" button on each assignment — creates a Classroom resource link
   - "Create Assignment" button → inline form → `POST /api/v1/assignments` + auto-push to Classroom
5. Grade sync panel:
   - Show sync status for the mapped course
   - "Sync Grades" button → triggers `POST /api/v1/assignments/{id}/sync_grades`
   - Show last sync timestamp and success/failure status

---

## Task 3: Classroom Sync Status on Course Home

**Modify:** `apps/web/src/app/teach/courses/[courseId]/page.tsx`

**Required additions:**
1. If the course has a Google Classroom integration (check via `integration_configs` or a `classroom_id` field on the course):
   - Show "Google Classroom" badge in the course header
   - Show last sync date
   - "Sync Now" button that triggers course sync
   - "Push Grades" button for grade passback
2. If not linked, show "Connect to Google Classroom" option

**Check:** Does the course model/serializer include a `classroom_id` or `external_id` field? If so, use it. If not, check `sync_mappings` for the course.

---

## Task 4: Drive Integration Polish

**Verify** the Google Drive picker works end-to-end:
1. `GET /api/v1/drive/picker_token` returns a valid picker token
2. GoogleDrivePicker component opens the picker and returns file metadata
3. Creating a resource_link with a Drive file ID persists correctly
4. Drive files display with correct titles and links in lesson/assignment views

**If any step is broken, fix it.** If the Drive API requires OAuth tokens from the user:
1. Check if `users.google_access_token` and `users.google_refresh_token` columns exist (they do per schema)
2. Verify token refresh logic in `GoogleTokenService`
3. Ensure expired tokens are refreshed transparently

---

## Architecture Rules

1. Add-on pages must work inside an iframe (no `X-Frame-Options: DENY`)
2. Add-on pages should NOT use AppShell (they're embedded in Google)
3. Authentication in the add-on iframe may need special handling (third-party cookies)
4. All API calls still use `apiFetch` with credentials
5. The add-on pages are thin UI shells — all business logic stays in the backend
6. Do NOT implement the Google Apps Script manifest from scratch — just create the host pages that the manifest will point to

---

## Testing

```bash
cd apps/web && npm run typecheck && npm run build
cd apps/core && bundle exec rspec spec/requests/api/v1/addon_spec.rb spec/requests/api/v1/drive_spec.rb
```

---

## Definition of Done

- [ ] Workspace sidebar page at `/addon/workspace` with unit plans, standards, AI tabs
- [ ] Classroom add-on page at `/addon/classroom` with assignment attach and grade sync
- [ ] "Insert" action creates resource links from the Google Doc/Slide context
- [ ] Course Home shows Classroom sync status when linked
- [ ] Drive picker verified end-to-end (picker_token → pick file → create resource_link)
- [ ] All pages work in iframe context (no frame-blocking headers)
- [ ] All lint and build checks pass
