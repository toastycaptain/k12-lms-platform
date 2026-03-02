# Family iOS + Webapp Parity Execution Master Plan

## Objective
Implement backend and web changes required for `iOS/FamilyApp` features to run against real platform capabilities.

## Sequential Execution Files
1. `iOS/CODEX_IOS_FAMILY_WEBAPP_PHASE_01_GUARDIAN_API.md`
2. `iOS/CODEX_IOS_FAMILY_WEBAPP_PHASE_02_GUARDIAN_WEB_PARITY.md`
3. `iOS/CODEX_IOS_FAMILY_WEBAPP_PHASE_03_MESSAGING_GUARDRAILS.md`
4. `iOS/CODEX_IOS_FAMILY_WEBAPP_PHASE_04_CONTRACTS_AND_TESTS.md`

## Execution Rules
- Execute phases strictly in numeric order.
- Do not skip tenant scoping or policy authorization.
- Keep portfolio as placeholder-only.
- Validate each phase before proceeding to the next.

## Family Feature Mapping
- Attendance -> Phase 01 + Phase 02
- Assignments -> Existing + Phase 02 hook/page wiring
- Announcements -> Existing + Phase 01 hardening + Phase 02 wiring
- Timetable -> Phase 01 guardian classes endpoint + Phase 02 page
- Reports -> Existing progress endpoints + Phase 02 page wiring
- Messaging -> Phase 03
- Portfolio -> Placeholder only
- Calendar -> Phase 01 guardian calendar endpoint + Phase 02 page

## Final Validation
- API request specs pass for guardian family additions.
- Web tests pass for guardian page updates.
- OpenAPI reflects new guardian family endpoints.
