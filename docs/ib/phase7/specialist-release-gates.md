# Phase 7 Specialist Release Gates

## Goal
Task 170 gates specialist mode on whether it is genuinely faster and clearer for contribution-heavy work than general teacher mode.

## Required flows
- contribution-only request pickup
- pending handoff review
- rapid evidence attach / sort
- reuse-library recall
- mobile quick-hit visibility

## Release gates
| Gate | Threshold | Evidence |
|---|---|---|
| Specialist route readiness | `/ib/specialist` loads within the seeded guardrail and shows contribution, handoff, and reuse sections | `apps/web/e2e/ib/specialist-mode.spec.ts` |
| Contribution visibility | requested contributions and pending handoffs render from real seeded collaborator and operational-record data | `e2e_seed.rake`, specialist API payload |
| Adoption safety | notification strategy and overload visibility are present before pilot rollout | specialist dashboard UI + `Ib::Specialist::AssignmentService` |
| Reuse quality | at least one reusable library item is visible in seeded data | specialist library seed + dashboard |
| Coordinator visibility | overload signals / assignment gaps remain visible from the specialist surface | specialist analytics panel |

## Go / no-go checklist
- specialist users can access the dashboard with school scope intact
- contribution-only work is distinct from owned work
- handoff state is explicit and audit-safe
- evidence capture does not require the full teacher workspace
- reuse artifacts are discoverable in one route
- seeded E2E flow passes without manual data repair

## Current risk notes
- The platform still models specialists through teacher-role access plus collaborator permissions rather than a dedicated global `specialist` role. That is acceptable for Phase 7 because the workflow is scoped through collaborator state, but it should be reviewed again before district-wide rollout.
- Overload signals are seeded and visible, but pilot telemetry still needs real counts before aggressive staffing recommendations are trusted.
