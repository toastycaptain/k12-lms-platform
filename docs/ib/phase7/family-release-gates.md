# Phase 7 Family Release Gates

## Goal
Task 198 gates family work on calmness, trust, and support value.

## Key metrics
- digest open rate
- story read rate
- current-unit support panel usage
- acknowledgement / response moderation rate
- opt-down rate for routine notifications
- support-ticket proxy rate tied to family-visible workflows

## Release gates
| Gate | Threshold | Evidence |
|---|---|---|
| Family route readiness | `/ib/guardian/home` loads within the seeded guardrail | `apps/web/e2e/ib/family-experience.spec.ts` |
| Noise budget | routine digest policy remains visible and limited | guardian payload visibility policy + digest strategy |
| Current-learning clarity | current unit windows and support-at-home prompts are visible on first load | guardian payload + `CurrentUnitWindow` |
| Safe interaction model | acknowledgements and moderated responses render without exposing internal staff detail | guardian interaction summary |
| Translation awareness | family stories surface translation state and available locales | guardian story serializer + UI |
| Accessibility and mobile parity | layout stays readable and usable in narrow widths; preferences remain adjustable | guardian UI + future pilot manual passes |

## Pilot feedback loop
1. Review digest opt-downs weekly.
2. Map support tickets to current-unit, story, digest, and interaction surfaces.
3. If support-at-home usage drops while digest volume rises, treat that as a product failure, not a communication success.
4. Keep family telemetry privacy-safe by logging interaction state, not message body text.
