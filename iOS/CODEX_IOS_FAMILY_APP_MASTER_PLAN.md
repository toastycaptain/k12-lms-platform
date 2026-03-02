# Family iOS App Master Plan

## Objective
Build a native iOS app for families (parents/relatives) that complements the Student iOS app and exposes family-facing views for student activity.

## Scope (Current)
- Create standalone `iOS/FamilyApp` SwiftUI project scaffold.
- Reuse the same app core patterns as StudentApp:
  - environment selection (`dev`, `staging`, `prod`)
  - session bootstrap from `/api/v1/me`
  - CSRF-aware API client for `/api/v1`
- Implement Family Dashboard with icon tiles for:
  - Attendance
  - Assignments
  - Announcements
  - Timetable
  - Reports
  - Messaging
  - Portfolio (placeholder)
  - Calendar
- Show `Classes Today` list below dashboard icons for family students.

## Feature Mapping
- Each dashboard tile routes to a feature destination view aligned with StudentApp navigation behavior.
- Portfolio remains placeholder-only for now (non-live feature state).

## Delivery Phases
1. Scaffold app shell and project config.
2. Build dashboard tile grid and classes list section.
3. Add portfolio placeholder module.
4. Hook analytics events for tile and class taps.
5. Validate build via iOS Simulator target.

## Next API Integration Steps
1. Replace dashboard/class sample data with live family endpoints.
2. Add family-specific role checks to session bootstrap behavior.
3. Implement production message, attendance, assignment, and report detail screens.
4. Add tests (snapshot/state and API integration tests).
