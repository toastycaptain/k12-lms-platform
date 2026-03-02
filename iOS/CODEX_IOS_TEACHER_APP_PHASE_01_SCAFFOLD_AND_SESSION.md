# Phase 01 — Scaffold and Session Foundation

## Goal
Create the TeacherApp shell and app-core infrastructure aligned with existing iOS app patterns.

## Scope
- Create `iOS/TeacherApp` folder structure.
- Add app entry point and session bootstrap flow.
- Add environment config (`dev`, `staging`, `prod`).
- Add CSRF-aware API client scaffold for `/api/v1`.
- Add lightweight analytics and local data store.

## Tasks
1. Create `TeacherApp.swift` app shell.
2. Add `AppCore/Config/AppEnvironment.swift`.
3. Add `AppCore/API/APIClient.swift`.
4. Add `AppCore/Auth/SessionBootstrapper.swift`.
5. Add shared `TeacherDataStore` for posts, todos, schedule, resources, and announcements.

## Acceptance
- App launches into authenticated dashboard state (with test bypass support).
- App core compiles and is reusable for future API integration.
