# Coverage Matrix — IB Phase 3 Pack

## Purpose
This file proves that the high-level next-phase plan was fully expanded into executable Codex tasks and that no major detail from the first 8 steps or the PYP vertical slice was dropped.

## Mapping of high-level steps to task files

### Step 1 — Stop adding showcase pages and bind the IB UI to live document flows
- `01_IB_STEP1_ROUTE_AUDIT_AND_CANONICAL_OBJECT_MODEL.md`
- `02_IB_STEP1_REAL_ROUTE_TREE_AND_APP_ROUTER_CUTOVER.md`
- `03_IB_STEP1_WORKSPACE_LANDING_QUERIES_AND_SUMMARY_ENDPOINTS.md`
- `04_IB_STEP1_UI_DEMO_LINK_ERADICATION_AND_DEEP_LINK_BINDING.md`
- `05_IB_STEP1_DOCUMENT_DETAIL_ROUTES_AND_RECORD_LOADING.md`

**Covered details:**
- real route architecture
- canonical route/object model
- backend landing queries
- removal of `/demo` deep links
- live record loading for studios and workspaces

### Step 2 — Make the IB pack much richer
- `06_IB_STEP2_PACK_EXPANSION_FOUNDATION_AND_GOVERNANCE.md`
- `07_IB_STEP2_PYP_PACK_DOCUMENT_TYPES_AND_SCHEMAS.md`
- `08_IB_STEP2_MYP_PACK_DOCUMENT_TYPES_AND_SCHEMAS.md`
- `09_IB_STEP2_DP_PACK_DOCUMENT_TYPES_AND_SCHEMAS.md`
- `10_IB_STEP2_PACK_WORKFLOWS_FRAMEWORK_BINDINGS_AND_MIGRATIONS.md`

**Covered details:**
- document-type inventory
- PYP schemas (POI, unit, weekly flow, family window, exhibition)
- MYP schemas (unit, interdisciplinary, project, service)
- DP schemas (course map, IA, TOK, EE, CAS)
- workflow bindings, framework bindings, compatibility/migration

### Step 3 — Build the teacher operations layer
- `11_IB_STEP3_TEACHER_ACTION_CONSOLE_DATA_AND_ACTIVITY_MODEL.md`
- `12_IB_STEP3_TEACHER_ACTION_CONSOLE_FRONTEND_AND_PRIORITY_RULES.md`
- `13_IB_STEP3_UNIT_STUDIOS_LIVE_OPERATIONALIZATION.md`
- `14_IB_STEP3_COLLABORATION_COMMENTS_REVIEW_NOTES_AND_PRESENCE.md`
- `15_IB_STEP3_SPECIALIST_MODE_AND_SHARED_OWNERSHIP.md`

**Covered details:**
- teacher home as operations console
- resume cards / changed-since-last-visit / quick actions
- live studios
- comments, review notes, collaborators, presence/last-active
- specialist mode and shared ownership

### Step 4 — Build the coordinator/admin IB Operations Center
- `16_IB_STEP4_PROGRAMME_OPERATIONS_BACKEND_AGGREGATES_AND_RISK_SERVICES.md`
- `17_IB_STEP4_PROGRAMME_OPERATIONS_FRONTEND_CONSOLE_AND_DRILLDOWNS.md`
- `18_IB_STEP4_COORDINATOR_ROLE_MODEL_ADMIN_CONSOLE_AND_GOVERNANCE.md`

**Covered details:**
- aggregate services and risk scoring
- exception-first coordinator console
- governance, thresholds, roles, admin settings

### Step 5 — Turn portfolio / family publishing into a real subsystem
- `19_IB_STEP5_EVIDENCE_DOMAIN_MODEL_AND_PERSISTENCE.md`
- `20_IB_STEP5_EVIDENCE_INBOX_STORY_COMPOSER_AND_PUBLISH_QUEUE_UI.md`
- `21_IB_STEP5_FAMILY_DIGEST_SCHEDULER_VISIBILITY_AUDIT_AND_CALM_MODE.md`

**Covered details:**
- evidence domain
- reflection requests
- learning stories
- publish queue
- family digest scheduler
- guardian calm mode
- visibility and audit trails

### Step 6 — Build POI, exhibition, and interdisciplinary planning as first-class systems
- `22_IB_STEP6_PYP_POI_DOMAIN_RELATIONSHIPS_AND_GOVERNANCE.md`
- `23_IB_STEP6_PYP_POI_EXHIBITION_FRONTEND_AND_OPERATIONS.md`
- `24_IB_STEP6_MYP_INTERDISCIPLINARY_PROJECT_SERVICE_DOMAIN.md`
- `25_IB_STEP6_MYP_INTERDISCIPLINARY_PROJECT_SERVICE_FRONTEND.md`
- `26_IB_STEP6_DP_IA_EE_TOK_CAS_DOMAIN_AND_STATE_MACHINES.md`
- `27_IB_STEP6_DP_CORE_AND_RISK_WORKSPACES_ON_LIVE_DATA.md`

**Covered details:**
- POI records and governance
- exhibition hooks/workspaces
- MYP interdisciplinary + project/service domain and UI
- DP IA/EE/TOK/CAS domain and UI

### Step 7 — Make Standards & Practices real
- `28_IB_STEP7_STANDARDS_PRACTICES_EVIDENCE_MODEL_AND_INGESTION.md`
- `29_IB_STEP7_STANDARDS_PRACTICES_CENTER_EXPORTS_AND_CYCLE_HISTORY.md`

**Covered details:**
- evidence packets
- live evidence ingestion from operational work
- owner/review/export/cycle history
- board/center cutover

### Step 8 — Consolidate the planning stack
- `30_IB_STEP8_IB_DOCUMENT_SYSTEM_TARGET_ARCHITECTURE_AND_CUTOVER_PLAN.md`
- `31_IB_STEP8_LEGACY_PLAN_MIGRATION_BACKEND_AND_DATA_BACKFILL.md`
- `32_IB_STEP8_FRONTEND_IB_CUTOVER_FROM_LEGACY_PLAN_SURFACES.md`
- `33_IB_STEP8_WORKFLOW_ENGINE_UNIFICATION_TELEMETRY_AND_DEPRECATION.md`

**Covered details:**
- target-state architecture
- legacy-to-document migration
- frontend cutover
- workflow unification and telemetry

### Step 9 — Build the first full-stack vertical slice (PYP)
- `34_IB_STEP9_PYP_VERTICAL_SLICE_MASTER_PLAN.md`
- `35_IB_STEP9_PYP_VERTICAL_SLICE_PLANNING_CONTEXT_AND_UNIT_CREATION.md`
- `36_IB_STEP9_PYP_VERTICAL_SLICE_UNIT_STUDIO_WEEKLY_FLOW_AND_COLLABORATION.md`
- `37_IB_STEP9_PYP_VERTICAL_SLICE_EVIDENCE_REFLECTION_AND_FAMILY_WINDOW.md`
- `38_IB_STEP9_PYP_VERTICAL_SLICE_COORDINATOR_REVIEW_POI_LINKAGE_AND_EXHIBITION_HOOK.md`
- `39_IB_STEP9_PYP_VERTICAL_SLICE_STUDENT_GUARDIAN_SURFACES_DIGESTS_AND_RELEASE.md`

**Covered details:**
- full PYP path from creation to guardian-facing output
- teacher, specialist, coordinator, student, and guardian touchpoints
- release gating and telemetry

## Explicit next steps after this pack
These are **not** implemented in this pack. They must be created in future packs after Tasks 01–39 are complete and the PYP slice is stable.

1. **Next pack:** MYP full-stack vertical slice
   - likely sequence: MYP unit → criteria/ATL → interdisciplinary/project/service → coordinator review → student surfaces
2. **Pack after that:** DP full-stack vertical slice
   - likely sequence: DP course map → IA → EE/TOK/CAS → coordinator/advisor review → student/family support surfaces

## Stop signal
If this pack is complete, **do not immediately continue by improvising MYP or DP slice work in the same Codex run**. Create separate task packs so those slices can be scoped and reviewed with the same level of detail.
