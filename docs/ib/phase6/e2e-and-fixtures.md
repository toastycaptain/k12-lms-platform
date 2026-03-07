# IB Phase 6 E2E and Fixture Notes

## Scope
This document closes Tasks 116 through 120.

## Deterministic fixture model
Playwright smoke coverage now assumes a seeded IB pilot baseline with users for:
- admin
- teacher
- guardian

The seed task also provisions the records needed to open rollout, readiness, evidence, publishing, PYP, DP, and guardian surfaces without hand-editing data.

## Current smoke coverage
- admin rollout and readiness console access
- teacher evidence inbox access
- teacher family publishing access
- teacher PYP POI access
- teacher DP coordinator access
- guardian family home access

See `apps/web/e2e/ib-smoke.spec.ts`.

## Local run sequence
1. seed the core app with the e2e seed task
2. boot core and web locally
3. run `npm run e2e -- --grep @ib-smoke`
4. inspect trace, screenshot, and console/network artifacts on failure

## Failure triage guidance
- auth failure: verify test-session helpers and seeded users first
- 404 or redirect failure: verify canonical route registry and seeded route hints
- readiness or rollout data failure: verify pilot baseline flags and setup seed data
- guardian failure: verify guardian link + published story seed

## Residual gap explicitly tracked
The checked-in Playwright coverage is a deterministic smoke suite, not the full programme journey matrix. The next expansion should deepen PYP, MYP, DP, coordinator, and failure-path assertions using the same seeded baseline rather than inventing a second fixture system.
