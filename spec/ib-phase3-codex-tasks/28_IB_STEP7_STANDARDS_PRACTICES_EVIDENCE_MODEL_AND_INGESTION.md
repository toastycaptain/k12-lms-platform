# Task 28 — IB STEP7 STANDARDS PRACTICES EVIDENCE MODEL AND INGESTION

## Position in sequence
- **Step:** 7 — Make Standards & Practices real
- **Run after:** Task 27
- **Run before:** Task 29 turns the current board/center into a real evidence workflow and export environment.
- **Primary mode:** Backend + Frontend

## Objective
Create a real Standards & Practices evidence model that can gather, link, categorize, and review evidence emerging from live work across documents, stories, reviews, and operational objects.

## Why this task exists now
The Standards & Practices area must become more than a pretty board. If it is not powered by real source links and reviewable packets, it becomes another dead binder builder.

## Current repo anchors
- `apps/web/src/features/ib/coordinator/StandardsAndPracticesBoard.tsx`
- `apps/web/src/features/ib/coordinator/StandardsPracticesEvidenceCenter.tsx`
- `apps/core/app/models` (new standards/practices models)
- `packages/contracts/curriculum-profiles/ib_continuum_v1.json` or successor

## Scope
- Design models for standards/practices cycles, evidence packets, packet items, source links, owners, review state, and export readiness.
- Support evidence ingestion from curriculum documents, evidence items, stories, approvals, comments, and later DP/POI/project objects.
- Make evidence packet composition queryable and auditable.

## Backend work
- Create models such as `IbStandardsPracticesCycle`, `IbEvidencePacket`, `IbEvidencePacketItem`, `IbEvidenceSourceLink`, or equivalent.
- Add ingestion services that suggest or attach source artifacts from live objects.
- Add endpoints for packet creation, source-linking, owner assignment, review state, and summary views.

## Frontend work
- Prepare types/hooks for standards/practices live data; deeper UI binding happens in Task 29.

## Data contracts, APIs, and model rules
- Packet items should store source type/id, excerpt/summary metadata, owner, review state, and why the source is relevant.
- Do not duplicate the full source payload inside packet items unless required for historical snapshots; prefer references with cached summary fields if needed.

## Risks and guardrails
- Do not make packet building a separate isolated manual workflow disconnected from live work; source linking must emerge from operational objects.

## Testing and verification
- Model tests for packet creation, source linking, and review transitions.
- Request specs for packet endpoints and summary payloads.

## Feature flags / rollout controls
- Gate with `ib_standards_practices_live_v1`.
- Do not try to auto-classify everything perfectly in this first pass; support manual curation and review.

## Acceptance criteria
- Standards & Practices now has a backend evidence system.
- Task 29 can bind the frontend center to live packet data and exports.

## Handoff to the next task
- Task 29 turns the current board/center into a real evidence workflow and export environment.
