# StudentApp (SwiftUI Scaffold)

This folder contains a native iOS student app scaffold aligned to:

- `iOS/CODEX_IOS_STUDENT_APP_MASTER_PLAN.md`
- `iOS/CODEX_IOS_PORTFOLIO_PLACEHOLDER_PLAN.md`

Current scope implemented:

- App core environment config (`Dev/Staging/Prod`)
- Session bootstrap (`GET /api/v1/me`) and CSRF-aware API client
- Tile dashboard with routes for requested student features
- Portfolio placeholder module with feature flag and analytics hooks

Notes:

- API calls remain under `/api/v1`.
- Portfolio live mode is disabled by default (`portfolioLiveEnabled = false`).
- Mobile token endpoints (`/api/v1/mobile/*`) are available in backend parity work and can be integrated next.
