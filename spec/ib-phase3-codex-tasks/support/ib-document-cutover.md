# IB Document Cutover

## Target state

IB mode uses `CurriculumDocument` as the system of record for planning routes.

### System of record by route/object

- PYP/MYP/DP planning routes: `CurriculumDocument`
- Family publishing routes: `IbLearningStory` + `IbPublishingQueueItem`
- Evidence routes: `IbEvidenceItem`
- POI routes: `PypProgrammeOfInquiry`
- MYP/DP project/core risk routes: `IbOperationalRecord`
- Standards & Practices routes: `IbStandardsCycle` + `IbStandardsPacket`

## Legacy coexistence

- Non-IB curricula may continue using the legacy plan stack during this phase.
- IB routes should progressively redirect away from `/plan/**` when the runtime pack is IB and `ib_documents_only_v1` is enabled.
- Legacy plan objects are migration inputs, not the future IB source of truth.

## Transitional adapters

- Compatibility schema aliases keep older unit-plan documents editable while the pack upgrades.
- Backfill metadata is stored in `CurriculumDocument.metadata.migrated_from`.
- Old bookmarks should redirect to the corresponding `/ib/**` route when the source record can be mapped.

## Cutover checkpoints

1. Route tree is canonical and free of demo IDs.
2. IB create/open actions land in `/ib/**`.
3. Legacy IB plan records can be backfilled into `CurriculumDocument` safely.
4. Workflow actions for IB planning use the curriculum-document workflow engine.
