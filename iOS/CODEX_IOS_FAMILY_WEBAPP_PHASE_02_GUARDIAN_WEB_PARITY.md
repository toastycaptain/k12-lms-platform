# Phase 02 — Guardian Web Parity

## Goal
Add web guardian pages/hooks/navigation so family capabilities available to iOS are also exposed in web UX.

## Scope
- Extend `useGuardian` hooks for attendance/calendar/classes.
- Add guardian student sub-pages:
  - Attendance
  - Calendar
  - Classes Today (Timetable)
- Add quick links in guardian student overview.
- Update guardian nav to include family feature entry points.

## Tasks
1. Update hook contracts and typed payloads.
2. Add pages under `apps/web/src/app/guardian/students/[studentId]/...`.
3. Update guardian overview page links.
4. Update nav/AppShell behavior for guardian-only users.
5. Add/adjust web tests for guardian feature pages.

## Acceptance
- Guardian web users can access Attendance/Calendar/Timetable from student detail.
- Pages consume guardian API endpoints and render empty/error states safely.
