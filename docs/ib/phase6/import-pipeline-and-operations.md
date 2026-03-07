# IB Phase 6 Import Pipeline and Operations

## Scope
This document covers Tasks 110 through 115.

## Import lifecycle
Imports now run as staged, reviewable operations rather than direct scripts:
1. upload/parse
2. stage batch + rows
3. persist mapping decisions
4. dry-run validation
5. execute synchronously or asynchronously
6. rollback eligible draft imports
7. audit and telemetry review

## Core domain objects
- `IbPilotSetup`: governed setup state for a school/programme
- `IbImportBatch`: source file, scope, mapping, validation, dry-run, execution, and rollback summary
- `IbImportRow`: row-level normalized payload, conflicts, errors, execution payload, and target entity reference

## Supported import domains
- `curriculum_document`
- `pyp_poi`
- `operational_record`
- `staff_role`

## Parsing and normalization
- CSV and XLSX are supported through `Ib::Migration::Parser`
- headers are normalized before mapping so source files can vary without exposing internal IDs
- parser warnings are stored on the batch and shown back to operators
- duplicate or blank headers are surfaced explicitly instead of silently discarded

## Mapping and entity resolution
The rollout console import surface lets operators map rows by:
- programme
- planning context name
- document type
- schema key
- route hint

Rules:
- mappings persist on the batch
- execution is blocked until critical mapping is resolved
- target records are previewed through dry-run summaries and per-row `targetEntityRef`
- operators can resume mapping work later without losing state

## Dry-run, execute, and rollback
### Dry-run
- computes create/update/skip outcomes without mutating live records
- records conflict payloads on each row
- emits telemetry and audit events

### Execute
- uses domain-specific execution logic for POI entries, curriculum documents, and operational records
- updates existing records when a target reference already exists instead of blindly duplicating data
- can enqueue asynchronous execution for larger batches

### Rollback
- only reverts imported draft-safe records tracked by execution payloads
- rollback summaries remain attached to the batch for support review
- rollback is not a substitute for arbitrary destructive production edits

## Observability and support controls
Operators now have:
- batch status, summaries, warnings, and errors in `Import operations`
- audit events for create, mapping save, dry-run, execute, and rollback
- telemetry for batch creation, dry-run, execute, rollback, and replay
- replay support in `Job operations`

## Safe operating rules
- keep scope pinned to the active tenant, school, academic year, and programme
- do not use imports to bypass publishing or workflow gates
- prefer dry-run on every new source shape, even when a mapping preset exists
- import into live pilots only after baseline and readiness are current

## Known intentional limits
- mappings are operator-friendly and name-based; they are not a generic ETL workbench
- rollback support is limited to tracked draft-safe entities
- the current supported spreadsheet shapes cover the highest-value pilot domains, not every historical source system
