# CODEX_IOS_PORTFOLIO_PLACEHOLDER_PLAN

## Objective

Provide a production-quality placeholder portfolio feature in the iOS app without implementing full portfolio backend/domain logic yet.

This keeps UI navigation complete and leaves a clean handoff point for later full portfolio implementation.

---

## Scope for This Phase

## In scope

- Portfolio tile on dashboard
- Portfolio placeholder screen
- Placeholder view model and local mock state
- Analytics hooks for future adoption tracking
- Feature flag support to switch to live implementation later

## Out of scope

- Creating portfolio tables/models/controllers
- Uploading or persisting portfolio entries
- Teacher/guardian portfolio review workflows
- Standards alignment, comments, and export

---

## UX Requirements

1. Dashboard tile:
   - Label: `Portfolio`
   - Subtitle: `Coming soon`
   - Tap navigates to portfolio placeholder screen
2. Portfolio placeholder screen:
   - Title: `My Portfolio`
   - Empty-state illustration/icon
   - Body text: short explanation that portfolio publishing will arrive in a later update
   - Disabled primary action button: `Add Portfolio Entry` (disabled)
   - Optional secondary action: `Notify me when available` (local action/analytics only)

---

## Technical Implementation

## 1) Feature module

Create `Features/PortfolioPlaceholder` with:

- `PortfolioPlaceholderView`
- `PortfolioPlaceholderViewModel`
- `PortfolioPlaceholderState`

State fields:

- `isFeatureEnabled` (bool)
- `statusMessage` (string)
- `showNotifyConfirmation` (bool)

## 2) Routing

- Add route from tile tap to `PortfolioPlaceholderView`.
- Keep route stable so live portfolio implementation can replace internals without changing navigation contracts.

## 3) Feature flag

Use local config flag:

- `portfolio_live_enabled = false` (default)

When true, route may switch to future live module.

## 4) Analytics events

Track:

- `portfolio_tile_tapped`
- `portfolio_placeholder_viewed`
- `portfolio_notify_clicked`

No student content payloads; only non-PII metadata.

---

## Future Migration Path (Do Not Build Yet)

When portfolio backend exists, replace placeholder internals with live APIs:

- `GET /api/v1/portfolios`
- `POST /api/v1/portfolios`
- `POST /api/v1/portfolios/:id/entries`

Keep:

- Same route path
- Same tile id/key
- Same analytics base event names (add `_live` suffix if needed)

---

## Testing

1. Unit tests:
   - view model initializes placeholder state correctly
   - feature flag false -> placeholder UI
2. UI tests:
   - tapping Portfolio tile opens placeholder screen
   - disabled `Add Portfolio Entry` button cannot trigger submission flow
   - notify action shows confirmation

---

## Definition of Done

- Portfolio tile is visible and tappable in dashboard.
- Placeholder screen is complete, stable, and clearly communicates "coming soon".
- No portfolio API calls are attempted in this phase.
- Tests for placeholder routing and behavior pass.
