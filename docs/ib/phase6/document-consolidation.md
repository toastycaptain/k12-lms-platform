# IB Phase 6 Document Consolidation Notes

## Scope
This document covers Tasks 140 through 144.

## Current consolidation state
IB now treats the document system as the authoritative architecture for curriculum planning. Phase 6 tightened the final convergence points by:
- routing legacy document opens through canonical IB route helpers
- redirecting document creation and list actions into IB-native routes
- keeping route hints and schema keys visible in rollout/import tooling
- documenting remaining fallback and alias behaviour instead of hiding it

## Remaining intentional compatibility seams
- unmapped document types may still fall back to shared `/plan/documents/:id` behaviour
- deprecated aliases remain visible for migration safety until removal gates are met
- documents-only mode remains school-gated and is not a global default

## Removal gates
Do not delete the remaining compatibility seams until:
- rollout console legacy counts stay at zero for pilot schools
- seeded and live routes open only canonical IB surfaces
- import execution writes route hints compatible with canonical builders
- support no longer needs legacy route triage for active pilots
