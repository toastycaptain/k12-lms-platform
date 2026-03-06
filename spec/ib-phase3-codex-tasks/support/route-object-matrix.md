# IB Route Object Matrix

| Route family | Primary route | Source of truth | Notes |
| --- | --- | --- | --- |
| Home | `/ib/home` | IB summary services (`/api/v1/ib/home`) | Teacher/coordinator action console and exception cards |
| Operations | `/ib/operations` | IB operations aggregates (`/api/v1/ib/operations`) | Exception-first coordinator console |
| Review | `/ib/review` | Approvals + document comments + operational risks | No demo rows; every item carries `href` + `entity_ref` |
| Evidence | `/ib/evidence` | `IbEvidenceItem` | Triage, validation, reflection request, visibility, story linking |
| Families | `/ib/families/publishing` | `IbLearningStory` + `IbPublishingQueueItem` | Draft, schedule, hold, publish |
| PYP unit | `/ib/pyp/units/[documentId]` | `CurriculumDocument` (`ib_pyp_unit` or compatibility unit plan) | Live document studio wrapper |
| PYP weekly flow | `/ib/pyp/units/[documentId]/weekly-flow` | `CurriculumDocument`/operational weekly-flow records | Direct route exists in App Router |
| PYP POI | `/ib/pyp/poi` | `PypProgrammeOfInquiry` + entries | Coherence, gaps, overlaps, specialist expectations |
| PYP exhibition | `/ib/pyp/exhibition` | `IbOperationalRecord(record_family=pyp_exhibition)` | Lightweight exhibition hook for phase 3 |
| MYP unit | `/ib/myp/units/[documentId]` | `CurriculumDocument` (`ib_myp_unit` or compatibility unit plan) | Live document studio wrapper |
| MYP interdisciplinary | `/ib/myp/interdisciplinary/[documentId]` | `CurriculumDocument` (`ib_myp_interdisciplinary_unit`) | Shared spine uses live document route |
| MYP projects | `/ib/myp/projects` | `IbOperationalRecord(record_family=myp_project|myp_interdisciplinary)` | Operational hub, not a static board |
| DP course map | `/ib/dp/courses/[documentId]` | `CurriculumDocument` (`ib_dp_course_map`) | Live document-backed course map |
| DP risk/core | `/ib/dp/**` | `IbOperationalRecord` families (`dp_ia`, `dp_tok`, `dp_ee`, `dp_cas`) | Risk and next-action driven |
| Standards & Practices | `/ib/standards-practices` | `IbStandardsCycle` + packets/items | Cycle history and export readiness |
| Guardian | `/ib/guardian/**` | Published stories + guardian-safe evidence summaries | No unpublished/internal content |
| Student | `/ib/student/**` | Student-safe evidence + operational milestones | Reflection and next-step oriented |
| Legacy plan aliases | `/plan/**` for IB users | Redirect/cutover layer | IB traffic should resolve into IB routes when `ib_documents_only_v1` is enabled |

## Canonical object model

- `CurriculumDocument` is the canonical planning record for IB planning routes.
- `IbEvidenceItem` is the canonical evidence record.
- `IbLearningStory` and `IbPublishingQueueItem` are the canonical family-publishing records.
- `PypProgrammeOfInquiry` is the canonical POI governance record.
- `IbOperationalRecord` is the canonical operational/risk record for MYP projects, DP core, IA, and exhibition hooks.
- `IbStandardsCycle`/`IbStandardsPacket` are the canonical Standards & Practices evidence-cycle records.

## Route audit rules

- No user-facing IB route should deep-link to `/demo` or a fake ID.
- Every card/list/queue row must carry a real `href` and `entity_ref`.
- IB planning create/open actions should land on `/ib/**`, not generic legacy plan screens.
