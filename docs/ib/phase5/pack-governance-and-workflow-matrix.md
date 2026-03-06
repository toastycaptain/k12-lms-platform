# IB Phase 5 Pack Governance and Workflow Matrix

## Active Pack Contract
- canonical IB pack: `ib_continuum_v1@2026.2`
- backend creation source: `Curriculum::DocumentFactory`
- runtime source of truth: `CurriculumProfileResolver.resolve(...)`
- drift indicators: `RolloutConsoleService#migration_drift`, `CurriculumDocumentSerializer#migration_status`

## Required Feature Flags for Phase 5 Operations
These are the rollout-console baseline flags from `FeatureFlag::IB_PHASE5_REQUIRED_FLAGS`:
- `curriculum_documents_v1`
- `school_scoping_v1`
- `ib_pack_v2`
- `ib_pack_v2_workflows`
- `ib_teacher_console_v1`
- `ib_operations_center_v1`
- `ib_programme_settings_v1`
- `ib_evidence_subsystem_v1`
- `ib_family_publishing_v1`
- `ib_guardian_calm_mode_v1`
- `ib_standards_practices_live_v1`

Additional cutover flag used by this phase:
- `ib_documents_only_v1`

## Serializer Surface Added for Phase 5
These fields are intentionally visible to IB pages and governance tooling:
- `CurriculumDocumentSerializer`: `pack_key`, `pack_version`, `schema_key`, `workflow_key`, `migration_status`, `route_id`, `href`, `fallback_route_id`
- `CurriculumDocumentVersionSerializer`: `pack_key`, `pack_version`, `schema_key`, `workflow_key`, `migration_status`
- queue/detail serializers: `entity_ref`, `route_id`, `href`, `fallback_route_id`, `changed_since_last_seen`
- standards serializers: packet/cycle route metadata, score summary, export history, provenance hrefs

## Document Type Matrix
| Document Type | Default Schema | Workflow | Canonical Route | Primary Create Surface |
| --- | --- | --- | --- | --- |
| `ib_pyp_unit` | `ib.pyp.unit@v2` | `ib_review_cycle` | `/ib/pyp/units/[unitId]` | `/ib/pyp/units/new` |
| `ib_pyp_exhibition` | `ib.pyp.exhibition@v2` | `ib_project_cycle` | `/ib/pyp/exhibition` | PYP projects/core launchers |
| `ib_myp_unit` | `ib.myp.unit@v2` | `ib_review_cycle` | `/ib/myp/units/[unitId]` | `/ib/myp/units/new` |
| `ib_myp_interdisciplinary_unit` | `ib.myp.interdisciplinary@v2` | `ib_project_cycle` | `/ib/myp/interdisciplinary/[unitId]` | `/ib/myp/interdisciplinary/new` |
| `ib_myp_project` | `ib.myp.project@v2` | `ib_project_cycle` | `/ib/myp/projects/[projectId]` | MYP unit studio / projects launchers |
| `ib_myp_service_reflection` | `ib.myp.service_reflection@v2` | `ib_project_cycle` | `/ib/myp/service/[serviceEntryId]` | MYP service launchers |
| `ib_dp_course_map` | `ib.dp.course_map@v2` | `ib_review_cycle` | `/ib/dp/course-maps/[courseId]` | `/ib/dp/course-maps/new` |
| `ib_dp_internal_assessment` | `ib.dp.internal_assessment@v2` | `ib_dp_advisory_cycle` | `/ib/dp/internal-assessments/[recordId]` | DP assessment/advisor flows |
| `ib_dp_tok` | `ib.dp.tok@v2` | `ib_dp_advisory_cycle` | `/ib/dp/tok/[recordId]` | DP TOK launchers |
| `ib_dp_extended_essay` | `ib.dp.extended_essay@v2` | `ib_dp_advisory_cycle` | `/ib/dp/ee/[recordId]` | DP EE launchers |
| `ib_dp_cas_experience` | `ib.dp.cas_experience@v2` | `ib_dp_advisory_cycle` | `/ib/dp/cas/records/[recordId]` | CAS launchers |
| `ib_dp_cas_project` | `ib.dp.cas_project@v2` | `ib_dp_advisory_cycle` | `/ib/dp/cas/records/[recordId]` | CAS launchers |
| `ib_dp_cas_reflection` | `ib.dp.cas_reflection@v2` | `ib_dp_advisory_cycle` | `/ib/dp/cas/records/[recordId]` | CAS launchers |
| `ib_learning_story` | `ib.learning_story@v2` | `ib_family_publish_cycle` | `/ib/families/stories/[storyId]` | evidence/story compose flow |
| `ib_standards_practices_evidence_packet` | `ib.standards_practices.evidence_packet@v2` | `ib_standards_evidence_cycle` | `/ib/standards-practices/packets/[packetId]` | standards & practices center |

## Drift Audit and Backfill Workflow
1. Use rollout console to inspect pack version, missing schema keys, missing route hints, and legacy route counts.
2. Run the existing backfill for legacy IB unit plans when needed:
   - `bundle exec rails ib:backfill_legacy_plans TENANT_ID=<tenant> ACTOR_ID=<user>`
3. Re-run rollout/readiness and verify:
   - deprecated pack count is trending toward zero
   - missing schema keys are zero or manually ticketed
   - legacy route counts are zero before documents-only is enabled broadly

## Manual Review Buckets
The following should not be mutated automatically without review:
- documents with blank or ambiguous schema keys
- operational records with no safe document or route-hint match
- legacy records that have multiple plausible IB document targets
- standards/export records whose provenance source cannot be resolved canonically
