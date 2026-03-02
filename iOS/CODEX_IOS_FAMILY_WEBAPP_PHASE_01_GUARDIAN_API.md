# Phase 01 — Guardian API Extensions

## Goal
Add guardian/family backend APIs needed for Attendance, Calendar, and Timetable while preserving tenant + RBAC constraints.

## Scope
- Add `attendances` data model (tenant-scoped).
- Add guardian endpoints:
  - `GET /api/v1/guardian/students/:id/attendance`
  - `GET /api/v1/guardian/students/:id/classes_today`
  - `GET /api/v1/guardian/students/:id/calendar`
- Harden guardian assignment/announcement responses to published-only where applicable.

## Tasks
1. Create migration + model for attendance.
2. Add serializer(s) for guardian attendance payload.
3. Extend guardian routes.
4. Extend `Api::V1::GuardianController` with new actions.
5. Add request specs for new guardian endpoints and access rules.

## Acceptance
- Linked guardians can retrieve attendance/classes/calendar for linked students.
- Unlinked guardians receive 403.
- Response payloads are stable and structured for iOS consumption.
