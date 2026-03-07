# Phase 7 Student Release Gates

## Goal
Task 190 gates student work on agency and clarity, not feature count.

## Core metrics
- reflection completion rate
- timeline engagement rate
- goal revisit rate
- milestone follow-through rate
- portfolio collection usage
- quick-action success on mobile

## Release gates
| Gate | Threshold | Evidence |
|---|---|---|
| Student route readiness | `/ib/student/home` loads within the seeded guardrail | `apps/web/e2e/ib/student-experience.spec.ts` |
| Timeline coherence | timeline, next actions, and goals are visible in the same route | `StudentExperience` |
| Reflection continuity | reflection prompt and history render together | `StudentExperience`, reflection services |
| Portfolio meaning | evidence results and collections are visible together | portfolio search + collection builder |
| Accessibility blocker rule | keyboard navigation, readable labels, and explicit release-gate rows remain non-negotiable | component tests + manual review expectation |

## Stop-shipping rules
Pause new student features and fix usability if any of the following becomes true:
- quick actions are buried behind multiple route changes
- notifications become noisier than the action tray they are supposed to simplify
- reflection prompts exist without meaningful history or follow-up context
- portfolio views show evidence without narrative or next-step meaning

## Current release-gate interpretation
The runtime student payload already exposes `release_gates` so the UI can show calm-notification, mobile-action, and timeline-readiness state directly. Expand those booleans only when the underlying metrics are trustworthy.
