# Codex Instructions — M5: Google Integrations Completion

## Objective

Complete Milestone 5 (Google Integrations) from ~70% to 100%. The Classroom sync infrastructure and Drive integration are done. What remains is the **Google Workspace Add-on** and **Classroom Add-on** product surfaces, plus hardening the existing addon API auth.

---

## What Already Exists (DO NOT recreate)

### Backend (apps/core)
- `app/services/google_classroom_service.rb` — Classroom API wrapper (courses, rosters, coursework, submissions, grades)
- `app/services/google_drive_service.rb` — Drive API (create docs/presentations, get metadata)
- `app/services/google_token_service.rb` — OAuth token refresh
- `app/models/integration_config.rb` — provider config storage
- `app/models/sync_mapping.rb` — local ↔ external ID tracking
- `app/models/sync_run.rb` — sync execution records
- `app/models/sync_log.rb` — detailed sync operation logs
- `app/jobs/classroom_course_sync_job.rb` — pull Classroom courses
- `app/jobs/classroom_roster_sync_job.rb` — pull Classroom rosters
- `app/jobs/classroom_coursework_push_job.rb` — push assignments to Classroom
- `app/jobs/classroom_grade_passback_job.rb` — push grades to Classroom
- `app/controllers/api/v1/integration_configs_controller.rb` — CRUD + activate/sync triggers
- `app/controllers/api/v1/sync_runs_controller.rb` — sync history
- `app/controllers/api/v1/sync_mappings_controller.rb` — mapping CRUD + roster sync
- `app/controllers/api/v1/sync_logs_controller.rb` — detailed logs
- `app/controllers/api/v1/drive_controller.rb` — create docs/presentations, picker token, file metadata
- `app/controllers/api/v1/addon_controller.rb` — basic addon endpoints (unit_plans, lessons, attach, me)
- `app/controllers/api/v1/assignments_controller.rb` — has `push_to_classroom` and `sync_grades` actions
- `app/policies/drive_policy.rb`, `app/policies/addon_policy.rb`, `app/policies/integration_config_policy.rb`
- Gemfile: `google-apis-classroom_v1`, `google-apis-drive_v3`

### Frontend (apps/web)
- `src/app/admin/integrations/page.tsx` — integration setup UI
- `src/app/admin/integrations/sync/page.tsx` — sync dashboard
- `src/components/GoogleDrivePicker.tsx` — Drive file picker
- `src/app/teach/courses/[courseId]/page.tsx` — includes Classroom sync section (link, sync roster, sync assignments)

---

## Tasks to Complete

### Task 1: Harden Addon Controller Authentication

The existing `addon_controller.rb` uses the standard session auth. Add-ons running inside Google Workspace cannot use session cookies. Add a **service token** auth mechanism for add-on requests.

**File to modify:** `apps/core/app/controllers/api/v1/addon_controller.rb`

**Requirements:**
1. Skip the standard `authenticate_user!` before_action
2. Add a new `authenticate_addon!` before_action that verifies a Bearer token from the `Authorization` header
3. The token should be validated against an `IntegrationConfig` record with `provider: "google_workspace"` and `status: "active"`
4. Set `Current.tenant` from the matched IntegrationConfig's tenant
5. Set `Current.user` from the token payload or a service account user
6. Return 401 JSON `{ error: "Unauthorized" }` if token is invalid

**Pattern to follow:** See how `apps/core/app/controllers/api/v1/sessions_controller.rb` skips auth.

### Task 2: Expand Addon API Endpoints

The add-on panel needs more data. Extend the addon controller.

**File to modify:** `apps/core/app/controllers/api/v1/addon_controller.rb`

**Add these actions:**
1. `GET /api/v1/addon/standards` — list standards (filterable by framework_id). Return id, code, description, framework name.
2. `GET /api/v1/addon/templates` — list published templates. Return id, name, subject, grade_level.
3. `POST /api/v1/addon/ai_generate` — proxy to the AI Gateway. Accept `{ task_type, prompt, context }`. Check the tenant's AI task policy for that task_type. Forward to the AI Gateway at `ENV["AI_GATEWAY_URL"]` `/v1/generate`. Return the response. Log an `AiInvocation` record (see Task 3 from M6 instructions for the model).

**Update routes in:** `apps/core/config/routes.rb` under the existing `namespace :addon` block.

### Task 3: Create Google Workspace Add-on Manifest & Frontend

Google Workspace Add-ons require an Apps Script project or a REST-based add-on hosted externally. Use the **REST add-on** approach (an iframe sidebar served from our Next.js app).

**Create:** `apps/web/src/app/addon/layout.tsx`
- Minimal layout (no AppShell, no sidebar) — just a narrow panel layout for the Google Workspace sidebar
- Import only the auth context and api client

**Create:** `apps/web/src/app/addon/page.tsx` — Main add-on sidebar panel
- Show the current user's recent unit plans (GET `/api/v1/addon/unit_plans`)
- Allow clicking a unit to see its lessons (GET `/api/v1/addon/unit_plans/:id/lessons`)
- "Attach to Lesson" button that calls POST `/api/v1/addon/attach` with the current Google Doc/Slide ID
- Standards search panel — search standards and display aligned standards for a unit
- AI Assist section — single text input + task_type dropdown (lesson_plan, unit_plan, differentiation, assessment, rewrite). Calls POST `/api/v1/addon/ai_generate`. Display result with "Copy to Doc" button.

**Create:** `apps/web/public/addon-manifest.json`
```json
{
  "oauthScopes": ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/presentations"],
  "addOnId": "k12-lms-addon",
  "homepageTrigger": {
    "runFunction": "onHomepage"
  },
  "editor": {
    "documentSidebar": {
      "url": "{NEXT_PUBLIC_BASE_URL}/addon"
    },
    "presentationSidebar": {
      "url": "{NEXT_PUBLIC_BASE_URL}/addon"
    }
  }
}
```

### Task 4: Create Google Classroom Add-on Page

A Classroom add-on allows teachers to open a panel within Google Classroom that shows LMS content linked to their course.

**Create:** `apps/web/src/app/addon/classroom/page.tsx`
- Receive `courseId` from query params (Google Classroom external course ID)
- Look up the local course via sync_mapping (GET `/api/v1/sync_mappings?external_id={courseId}&external_type=classroom_course`)
- Display: linked assignments, sync status, "Push All Assignments" button
- Show unlinked assignments that could be pushed to Classroom
- Show grade sync status per assignment

### Task 5: Add Request Specs for Addon Endpoints

**Create:** `apps/core/spec/requests/api/v1/addon_spec.rb`

Test:
1. `GET /api/v1/addon/unit_plans` — returns unit plans for authenticated addon user
2. `GET /api/v1/addon/standards` — returns standards filtered by framework
3. `GET /api/v1/addon/templates` — returns published templates only
4. `POST /api/v1/addon/ai_generate` — validates task_type, checks policy, returns AI response (mock the HTTP call to AI Gateway)
5. `POST /api/v1/addon/attach` — attaches a drive link to a lesson
6. All endpoints return 401 without valid addon token

**Pattern to follow:** See existing specs in `apps/core/spec/requests/api/v1/`.

---

## Architecture Rules

1. All models MUST include `TenantScoped` (see `apps/core/app/models/concerns/tenant_scoped.rb`)
2. All controller actions MUST call `authorize` or use `policy_scope` (Pundit)
3. All API responses are JSON under `/api/v1`
4. Use `ActiveModelSerializers` for response formatting
5. Use `apiFetch` from `apps/web/src/lib/api.ts` for frontend API calls
6. Wrap frontend pages in `<ProtectedRoute>` (except addon pages which use addon auth)
7. Follow existing error handling patterns: `try/catch` with loading/error states

---

## Testing

After completing all tasks, verify:
```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/addon_spec.rb
cd apps/web && npm run build
```

---

## Definition of Done

- [ ] Addon controller has token-based auth for Google Workspace requests
- [ ] Addon API serves standards, templates, and AI generation
- [ ] Workspace add-on sidebar page renders in narrow layout
- [ ] Classroom add-on page shows linked course data
- [ ] Add-on manifest file exists at `public/addon-manifest.json`
- [ ] Request specs pass for all addon endpoints
- [ ] No lint errors (`bundle exec rubocop`, `npm run lint`)
