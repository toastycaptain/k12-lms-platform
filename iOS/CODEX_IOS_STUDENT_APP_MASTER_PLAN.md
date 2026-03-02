# CODEX_IOS_STUDENT_APP_MASTER_PLAN

## Objective

Build a native iOS student app (SwiftUI) that integrates with the current K-12 LMS platform and provides a tile-based dashboard for:

- Communication with teachers (chat)
- To-dos
- Goals
- Personal calendar
- Announcements
- Classes for the day
- Portfolio (placeholder only for now)

All APIs must remain compatible with the current Rails API under `/api/v1`.

---

## Hard Constraints (from current platform rules)

1. Keep API usage under `/api/v1` only.
2. Respect tenant context (`Current.tenant`) on every request.
3. Respect role and authorization behavior enforced by Pundit policies.
4. Do not introduce out-of-scope platform features (real-time collaborative editing, video conferencing, full SIS, proctoring, marketplace).
5. Portfolio implementation is placeholder-only at this stage.

---

## Current API Readiness Matrix

| Feature | Status | Existing Endpoints | Notes |
|---|---|---|---|
| Chat | Ready | `GET/POST /api/v1/message_threads`, `GET/POST /api/v1/message_threads/:id/messages` | Good fit for student-teacher communication |
| Announcements | Ready | `GET /api/v1/announcements`, `GET /api/v1/courses/:course_id/announcements` | Student scope already policy-controlled |
| Calendar | Ready | `GET /api/v1/calendar`, `GET /api/v1/calendar.ics` | Returns unit plans, assignments, quizzes |
| Classes list | Partial | `GET /api/v1/courses`, `GET /api/v1/sections`, `GET /api/v1/enrollments` | No true "classes today" schedule endpoint yet |
| To-dos | Partial | `GET /api/v1/assignments`, `GET /api/v1/submissions`, `GET /api/v1/notifications` | Can derive task list; no first-class todo resource |
| Goals | Missing | N/A | Requires backend/web parity work |
| Portfolio | Missing for native use | N/A (portfolio spec exists but not implemented) | Placeholder only in this phase |

---

## iOS Technical Approach

## 1) App Architecture

- Language/UI: Swift 6 + SwiftUI
- Pattern: Feature modules + MVVM
- Suggested module structure:
  - `AppCore` (config, auth/session, API client, models)
  - `Features/Dashboard`
  - `Features/Chat`
  - `Features/Todos`
  - `Features/Goals`
  - `Features/Calendar`
  - `Features/Announcements`
  - `Features/Classes`
  - `Features/PortfolioPlaceholder`

## 2) API Client Contract

- Base URL from environment config.
- Always send `Accept: application/json`.
- For write requests, support CSRF flow (`GET /api/v1/csrf`, then `X-CSRF-Token`).
- Include `X-Tenant-Slug` when tenant is not already bound by session cookie.
- Maintain cookie/session state for current backend behavior.

## 3) Authentication Strategy

Current backend is session-cookie based (`/auth/google_oauth2` + `/api/v1/me`).

- Phase 1 (compatibility-first): use web-based sign-in (`ASWebAuthenticationSession`) and shared cookie storage for API calls.
- Phase 2 (recommended): implement mobile token auth on backend (see parity plan) and migrate iOS client to bearer tokens.

## 4) Tile Dashboard UX

Use a two-column tile grid (phone portrait) with tappable cards:

- To-do
- Goals
- Calendar
- Announcements
- Chat
- Portfolio (Placeholder)
- Classes for Today

Each tile navigates to a dedicated feature screen. Tiles should display summary metadata (counts, next due item, unread count).

---

## Delivery Plan (Codex Execution Order)

## Phase A: Foundation

1. Create Xcode project in `iOS/StudentApp`.
2. Add environment-based API config (`Dev/Staging/Prod`).
3. Implement auth/session bootstrap:
   - Sign-in entry
   - `GET /api/v1/me` session check
   - Tenant-aware request plumbing
4. Build shared API client, error model, and retry policy.

## Phase B: Dashboard + Core Read Screens

1. Build tile dashboard shell.
2. Wire data summaries:
   - To-do summary from assignments/submissions
   - Calendar summary from `/api/v1/calendar`
   - Announcements summary from `/api/v1/announcements`
   - Classes summary from `/api/v1/courses`
   - Chat unread summary from `/api/v1/message_threads`
3. Add loading/empty/error states per tile.

## Phase C: Feature Screens

1. Chat list + thread detail + send message.
2. To-do list screen (derived tasks only).
3. Calendar screen (agenda/month list based on API event types).
4. Announcements screen.
5. Classes screen (enrolled courses; "today" behavior pending parity endpoint).
6. Goals screen with placeholder data (until goals API exists).
7. Portfolio placeholder screen (see dedicated portfolio doc).

## Phase D: Quality + Release Readiness

1. Unit tests for API decoding and view models.
2. UI tests for tile navigation and chat send flow.
3. Observability:
   - Request/error logging hooks
   - Non-PII analytics events for tile taps and screen views
4. TestFlight packaging and rollout checklist.

---

## Initial Endpoint Mapping for iOS

- Session bootstrap:
  - `GET /api/v1/me`
  - `GET /api/v1/csrf` (for mutations)
- Dashboard feed:
  - `GET /api/v1/assignments`
  - `GET /api/v1/submissions`
  - `GET /api/v1/calendar`
  - `GET /api/v1/announcements`
  - `GET /api/v1/courses`
  - `GET /api/v1/message_threads`
  - `GET /api/v1/notifications/unread_count`
- Chat:
  - `GET /api/v1/message_threads/:id/messages`
  - `POST /api/v1/message_threads/:id/messages`
  - `POST /api/v1/message_threads` (new thread)

---

## Dependencies on Web/API Parity Work

Before full feature completion, execute:

1. `spec/CODEX_WEB_API_PARITY_FOR_IOS_STUDENT_APP.md`

This is required for:

- First-class goals
- First-class to-do endpoint
- True classes-for-today scheduling
- Mobile-native auth hardening

---

## Definition of Done (for iOS phase)

- Student can authenticate and load their personalized dashboard.
- Every tile opens a working screen.
- Chat supports thread list, message list, and message send.
- Announcements, calendar, classes, and derived to-dos display real API data.
- Goals and portfolio are clearly marked placeholder where API is not yet ready.
- App handles unauthorized/forbidden/validation errors cleanly.
- iOS test suite and smoke tests pass.
