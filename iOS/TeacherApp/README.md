# TeacherApp (SwiftUI Scaffold)

Native iOS teacher companion app scaffold aligned with existing K12 iOS app patterns.

## Included Features
- Posts Timeline (`clock.arrow.circlepath`)
- Add Post (`square.and.pencil`)
- Schedule (`calendar.badge.clock`)
- To-Do List (`checklist`)
- Policies & Resources (`building.columns`)
- Announcements (`megaphone`)

## Architecture
- `AppCore/Config`: environment and runtime config
- `AppCore/API`: CSRF-aware API client for `/api/v1`
- `AppCore/Auth`: session bootstrap from `/api/v1/me`
- `AppCore/Store`: shared teacher data store for scaffold data
- `Features/*`: dashboard and feature modules

## Running in Xcode
1. Generate project if needed:
   - `cd iOS/TeacherApp`
   - `xcodegen generate`
2. Open `TeacherApp.xcodeproj`.
3. Select `TeacherApp` scheme and run on iOS Simulator.

## Environment Variables
- `K12_IOS_ENV`: `dev`, `staging`, or `prod`
- `K12_IOS_TEACHER_AUTH_BYPASS`: defaults to `true` if unset
- `K12_IOS_TEST_TEACHER_*`: optional overrides for test teacher identity
