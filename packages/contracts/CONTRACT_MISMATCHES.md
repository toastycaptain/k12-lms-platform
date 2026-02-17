# API Contract Mismatches

## Summary
- Active mismatches: 0
- Last reconciled: 2026-02-17

## Resolved History
| Area | Issue | Resolution |
|------|-------|------------|
| Shared API Client / Polling | Polling used `/ai_invocations/:id` without `/api/v1` prefix. | Updated polling path to `/api/v1/ai_invocations/:id`. |
| OpenAPI Security | Spec cookie name was `_session_id` while Rails uses `_k12_lms_session`. | Updated `cookieAuth` scheme in `core-v1.openapi.yaml` to `_k12_lms_session`. |

## Ongoing Enforcement
- `apps/core/spec/contracts/openapi_validation_spec.rb` enforces that every routed `/api/v1/*` operation is documented in `packages/contracts/core-v1.openapi.yaml`.
- CI runs explicit OpenAPI validation (`openapi_spec.rb` + `openapi_validation_spec.rb`) before the full Rails test suite.
