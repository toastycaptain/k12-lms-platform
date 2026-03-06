# IB Phase 5 Route Inventory

## Purpose
This is the canonical inventory for IB routes in Phase 5. It is the written contract paired with:
- frontend registry: `apps/web/src/features/ib/routes/registry.ts`
- backend parity source: `apps/core/app/services/ib/support/route_builder.rb`

## Parity Rules
- Cards, queues, and drilldowns should use canonical route IDs or route helpers, not ad-hoc string concatenation.
- Backend record serializers should emit `entity_ref`, `route_id`, `href`, and `fallback_route_id` when a record is opened from queues or readiness tooling.
- `RouteBuilder` fallback to `/plan/documents/:id` is temporary and only for document types not yet normalized to a canonical IB route.

## Cross-Programme Routes
| Route ID | Pathname | Record Kind | Permissions | Page File |
| --- | --- | --- | --- | --- |
| `ib.home` | `/ib/home` | `home` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/home/page.tsx` |
| `ib.continuum` | `/ib/continuum` | `continuum` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/continuum/page.tsx` |
| `ib.planning` | `/ib/planning` | `planning` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/planning/page.tsx` |
| `ib.learning` | `/ib/learning` | `learning` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/learning/page.tsx` |
| `ib.assessment` | `/ib/assessment` | `assessment` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/assessment/page.tsx` |
| `ib.portfolio` | `/ib/portfolio` | `portfolio` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/portfolio/page.tsx` |
| `ib.evidence` | `/ib/evidence` | `evidence` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/evidence/page.tsx` |
| `ib.evidence.item` | `/ib/evidence/items/:evidenceItemId` | `ib_evidence_item` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/evidence/items/[evidenceItemId]/page.tsx` |
| `ib.families` | `/ib/families` | `families` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/families/page.tsx` |
| `ib.families.story` | `/ib/families/stories/:storyId` | `ib_learning_story` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:guardian` | `apps/web/src/app/ib/families/stories/[storyId]/page.tsx` |
| `ib.families.publishing` | `/ib/families/publishing` | `families` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/families/publishing/page.tsx` |
| `ib.families.publishing.item` | `/ib/families/publishing/:queueItemId` | `ib_publishing_queue_item` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/families/publishing/[queueItemId]/page.tsx` |
| `ib.projects-core` | `/ib/projects-core` | `projects-core` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/projects-core/page.tsx` |
| `ib.standards-practices` | `/ib/standards-practices` | `standards-practices` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/standards-practices/page.tsx` |
| `ib.standards.cycle` | `/ib/standards-practices/cycles/:cycleId` | `ib_standards_cycle` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/standards-practices/cycles/[cycleId]/page.tsx` |
| `ib.standards.packet` | `/ib/standards-practices/packets/:packetId` | `ib_standards_packet` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/standards-practices/packets/[packetId]/page.tsx` |
| `ib.operations` | `/ib/operations` | `operations` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/operations/page.tsx` |
| `ib.settings` | `/ib/settings` | `operations` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/settings/page.tsx` |
| `ib.rollout` | `/ib/rollout` | `operations` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/rollout/page.tsx` |
| `ib.readiness` | `/ib/readiness` | `operations` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/readiness/page.tsx` |
| `ib.review` | `/ib/review` | `review` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/review/page.tsx` |
| `ib.reports` | `/ib/reports` | `reports` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/reports/page.tsx` |
| `ib.reports.exceptions` | `/ib/reports/exceptions` | `reports` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/reports/exceptions/page.tsx` |

## PYP Routes
| Route ID | Pathname | Record Kind | Permissions | Page File |
| --- | --- | --- | --- | --- |
| `ib.pyp.poi` | `/ib/pyp/poi` | `pyp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/pyp/poi/page.tsx` |
| `ib.pyp.unit` | `/ib/pyp/units/:unitId` | `curriculum_document` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/pyp/units/[unitId]/page.tsx` |
| `ib.pyp.unit.weekly-flow` | `/ib/pyp/units/:unitId/weekly-flow` | `curriculum_document` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/pyp/units/[unitId]/weekly-flow/page.tsx` |
| `ib.pyp.exhibition` | `/ib/pyp/exhibition` | `pyp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/pyp/exhibition/page.tsx` |

## MYP Routes
| Route ID | Pathname | Record Kind | Permissions | Page File |
| --- | --- | --- | --- | --- |
| `ib.myp.unit` | `/ib/myp/units/:unitId` | `curriculum_document` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/myp/units/[unitId]/page.tsx` |
| `ib.myp.interdisciplinary` | `/ib/myp/interdisciplinary/:unitId` | `curriculum_document` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/myp/interdisciplinary/[unitId]/page.tsx` |
| `ib.myp.projects` | `/ib/myp/projects` | `myp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/myp/projects/page.tsx` |
| `ib.myp.project` | `/ib/myp/projects/:projectId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/myp/projects/[projectId]/page.tsx` |
| `ib.myp.service` | `/ib/myp/service` | `myp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/myp/service/page.tsx` |
| `ib.myp.service.entry` | `/ib/myp/service/:serviceEntryId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/myp/service/[serviceEntryId]/page.tsx` |
| `ib.myp.coverage` | `/ib/myp/coverage` | `myp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/myp/coverage/page.tsx` |
| `ib.myp.review` | `/ib/myp/review` | `myp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/myp/review/page.tsx` |
| `ib.myp.student.project` | `/ib/myp/students/:studentId/projects/:projectId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/myp/students/[studentId]/projects/[projectId]/page.tsx` |

## DP Routes
| Route ID | Pathname | Record Kind | Permissions | Page File |
| --- | --- | --- | --- | --- |
| `ib.dp.course` | `/ib/dp/course-maps/:courseId` | `curriculum_document` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/dp/course-maps/[courseId]/page.tsx` |
| `ib.dp.internal-assessment` | `/ib/dp/internal-assessments/:recordId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/internal-assessments/[recordId]/page.tsx` |
| `ib.dp.ia-risk` | `/ib/dp/assessment/ia-risk` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/dp/assessment/ia-risk/page.tsx` |
| `ib.dp.core` | `/ib/dp/core` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/core/page.tsx` |
| `ib.dp.core.ee` | `/ib/dp/core/ee` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/core/ee/page.tsx` |
| `ib.dp.ee` | `/ib/dp/ee/:recordId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/ee/[recordId]/page.tsx` |
| `ib.dp.core.tok` | `/ib/dp/core/tok` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/core/tok/page.tsx` |
| `ib.dp.tok` | `/ib/dp/tok/:recordId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/tok/[recordId]/page.tsx` |
| `ib.dp.core.cas` | `/ib/dp/core/cas` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/core/cas/page.tsx` |
| `ib.dp.cas` | `/ib/dp/cas` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/cas/page.tsx` |
| `ib.dp.cas.record` | `/ib/dp/cas/records/:recordId` | `ib_operational_record` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/cas/records/[recordId]/page.tsx` |
| `ib.dp.coordinator` | `/ib/dp/coordinator` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:district_admin` | `apps/web/src/app/ib/dp/coordinator/page.tsx` |
| `ib.dp.student.overview` | `/ib/dp/students/:studentId/overview` | `dp` | `role:admin`, `role:curriculum_lead`, `role:teacher`, `role:student` | `apps/web/src/app/ib/dp/students/[studentId]/overview/page.tsx` |

## Specialist, Student, and Guardian Routes
| Route ID | Pathname | Record Kind | Permissions | Page File |
| --- | --- | --- | --- | --- |
| `ib.specialist` | `/ib/specialist` | `specialist` | `role:admin`, `role:curriculum_lead`, `role:teacher` | `apps/web/src/app/ib/specialist/page.tsx` |
| `ib.student.home` | `/ib/student/home` | `student` | `role:student` | `apps/web/src/app/ib/student/home/page.tsx` |
| `ib.student.learning` | `/ib/student/learning` | `student` | `role:student` | `apps/web/src/app/ib/student/learning/page.tsx` |
| `ib.student.calendar` | `/ib/student/calendar` | `student` | `role:student` | `apps/web/src/app/ib/student/calendar/page.tsx` |
| `ib.student.portfolio` | `/ib/student/portfolio` | `student` | `role:student` | `apps/web/src/app/ib/student/portfolio/page.tsx` |
| `ib.student.projects` | `/ib/student/projects` | `student` | `role:student` | `apps/web/src/app/ib/student/projects/page.tsx` |
| `ib.student.progress` | `/ib/student/progress` | `student` | `role:student` | `apps/web/src/app/ib/student/progress/page.tsx` |
| `ib.guardian.home` | `/ib/guardian/home` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/home/page.tsx` |
| `ib.guardian.stories` | `/ib/guardian/stories` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/stories/page.tsx` |
| `ib.guardian.current-units` | `/ib/guardian/current-units` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/current-units/page.tsx` |
| `ib.guardian.portfolio` | `/ib/guardian/portfolio` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/portfolio/page.tsx` |
| `ib.guardian.progress` | `/ib/guardian/progress` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/progress/page.tsx` |
| `ib.guardian.calendar` | `/ib/guardian/calendar` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/calendar/page.tsx` |
| `ib.guardian.messages` | `/ib/guardian/messages` | `guardian` | `role:guardian` | `apps/web/src/app/ib/guardian/messages/page.tsx` |

## Backend to Frontend Parity Checklist
- `CurriculumDocument` routes: `ib.pyp.unit`, `ib.myp.unit`, `ib.myp.interdisciplinary`, `ib.myp.project`, `ib.myp.service.entry`, `ib.dp.course`, `ib.dp.internal-assessment`, `ib.dp.ee`, `ib.dp.tok`, `ib.dp.cas.record`
- `IbOperationalRecord` routes: `ib.specialist`, `ib.review`, `ib.myp.project`, `ib.myp.service.entry`, `ib.myp.interdisciplinary`, `ib.dp.internal-assessment`, `ib.dp.ee`, `ib.dp.tok`, `ib.dp.cas.record`, `ib.dp.coordinator`, `ib.pyp.exhibition`, `ib.operations`
- queue/detail serializers now expose `entity_ref`, `route_id`, `href`, and `fallback_route_id`
- standards serializers now expose route metadata for packet/cycle detail routes
- route-resolution API normalizes legacy `/plan/*`, `/demo`, and hash-anchor links to canonical route metadata

## Deprecated Compatibility Paths
These exist only for migration or redirect purposes and should not be used for new work:
- `/plan/units/:unitId` alias for `ib.pyp.unit`
- `/ib/planning/pyp/units/:unitId`
- `/ib/planning/myp/units/:unitId`
- `/ib/planning/myp/interdisciplinary/:unitId`
- `/ib/planning/dp/courses/:courseId`
- `/ib/dp/courses/:courseId`
- `/ib/evidence#<id>`
- `/ib/families/publishing#<id>`
- any `/demo` path

## Explicit TODOs
- document types that still fall through `RouteBuilder` to `/plan/documents/:id` must either gain a canonical route ID or stay on the migration checklist; they cannot remain invisible drift.
- PYP weekly flow and family-window subdocuments remain page-level subviews, not standalone route-builder outputs. If they need queue entry or direct-link parity later, they should receive their own canonical route IDs instead of ad-hoc anchors.
