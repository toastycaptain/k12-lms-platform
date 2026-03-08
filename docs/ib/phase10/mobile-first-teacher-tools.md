# Phase 10 Step 3 — Mobile-First Teacher Tools

## Scope
Tasks 373-384 harden the IB school-day mobile loops that need to work on phones and tablets without forcing a desktop escape hatch.

## Mobile-first actions by role
### Teacher
- capture evidence with quick note or attachment upload
- review or approve pending reflection responses
- preview, hold, or schedule the next family-facing story

### Specialist
- respond to the next handoff request
- attach evidence to the current unit or operational record
- reopen the lightweight specialist contribution workspace

### Coordinator
- triage the highest-signal operations exception
- handle review-lane approvals and moderation work
- open the shareable snapshot without loading the full desktop console

### Guardian
- read the latest story and support prompt
- read or acknowledge the newest released report
- reopen the current unit window from the same mobile context

### Desktop-first actions
- full multi-section planning edits
- large-batch library curation
- whole-school reporting analysis and intelligence review
- archive-heavy browsing and export downloads

## Contracts introduced
- `GET /api/v1/ib/mobile_hub`
  - current actor role
  - role inventory for mobile-first vs desktop-first actions
  - deep-link restore targets
  - offline policy and retry posture
  - mobile trust diagnostic counts
- `PATCH /api/v1/ib/reflection_requests/:id`
  - `respond`, `approve`, and `cancel` actions now back the mobile review sheet
- `POST /api/v1/ib/evidence_items`
  - accepts attachment uploads and `ib_operational_record_id` for direct attach to project/core flows

## Frontend implementation
- `IbWorkspaceScaffold` now renders:
  - a compact mobile shell
  - low-bandwidth toggle state
  - a bottom action dock with touch-safe targets
- `EvidenceInbox` now exposes:
  - mobile evidence capture sheet
  - mobile reflection review sheet
  - draft/conflict recovery hooks
- teacher, specialist, coordinator, guardian, publishing, and review surfaces now expose mobile summaries and dock actions.

## Offline and retry posture
- JSON-only mutations still use the existing offline mutation queue.
- attachment-based evidence capture falls back to a mobile draft record with explicit retry messaging when a network failure blocks upload.
- 4xx conflicts are stored as explicit mobile conflict records so the operator sees a recovery state instead of silent failure.
- low-bandwidth mode trims the heavy secondary rail and metric density.

## Failure modes
- network failure during quick-note capture: queue the JSON mutation for replay
- network failure during attachment upload: save a mobile draft with attachment retry state and emit degraded sync diagnostics
- validation/approval conflict: create an explicit conflict record and surface the conflict dialog
- deep-link mismatch: `mobile_hub` exposes the restore keys used by the mobile shell so notifications link back to canonical IB routes only

## Rollout notes
- no new feature flag was introduced; this extends existing IB surfaces in place
- use `ib.mobile.evidence.pending`, `ib.mobile.story.pending`, `ib.mobile.specialist.awaiting_response`, and `ib.mobile.review.pending` notification payloads when wiring push later
- monitor `ib_mobile_sync_diagnostics` for queue depth, degraded uploads, and conflict spikes

## Manual QA
1. Open `/ib/home` on a phone-sized viewport and confirm the compact mobile shell plus action dock render.
2. Open `/ib/evidence`, launch `Capture evidence`, save a quick note, and verify it appears in the inbox.
3. Simulate offline mode, save a quick note, reconnect, and verify the queued mutation flushes.
4. Simulate attachment upload failure and verify the draft retry message is shown.
5. Open `Review reflection` from `/ib/evidence`, respond, then approve the request.
6. Open `/ib/families/publishing`, `/ib/review`, `/ib/operations`, `/ib/specialist`, and `/ib/guardian` on a narrow viewport and verify the dock stays usable.

## Remaining risk
- attachment retry is best-effort inside the current browser session; a future pass should move binary draft storage into IndexedDB/background sync for across-session recovery.
