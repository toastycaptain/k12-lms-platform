# Task 24 — Roadmap Coverage Matrix

Use this file after or alongside implementation to verify that no roadmap detail was lost when the single design plan was decomposed into many Codex tasks.

## Coverage table

| Roadmap theme | Task IDs covering it |
| --- | --- |
| Executive summary / move from prototype to operational system | 00, 01, 02, 03, 04, 22, 23 |
| Route completion and URL model pass | 01 |
| IB workspaces connected to curriculum document engine | 05, 07, 09, 10 |
| Teacher daily console / resume / change feed | 03 |
| Coordinator/admin programme operations | 04, 14, 18 |
| PYP unit cockpit | 05, 06 |
| MYP conceptual planning, criteria, ATL, interdisciplinary, service | 07, 08 |
| DP course map / IA / TOK / EE / CAS | 09, 10 |
| Specialist workflow | 11 |
| Evidence inbox and batch triage | 12 |
| Family publishing queue and calm cadence | 13, 19 |
| Programme operations center | 14 |
| POI governance | 15 |
| Standards & Practices evidence center | 16 |
| Approval / moderation / review UX | 17 |
| Exception-based reporting | 18 |
| Student/family calm mode | 19 |
| Mobile triage and poor-network support | 20 |
| AI tightly scoped and reversible | 21 |
| Performance, reliability, telemetry | 22 |
| Click budgets, role journeys, release gates | 23 |

## Cross-cutting themes intentionally repeated across many tasks
- Beat Toddle/ManageBac on daily workflow friction, not only on visual polish.
- Preserve sticky context and direct drilldown across the whole IB surface.
- Keep family communication calm and intentional.
- Support specialists and coordinators explicitly, not as edge cases.
- Keep IB expressions modular so American/British mode remains viable later.
- Require performance, accessibility, and reliability discipline alongside feature depth.

## Final audit checklist
- Every IB nav item resolves to a real route.
- No major teacher/coordinator surface is still driven by local mock seed data in production mode.
- Evidence, publishing, approvals, and standards/practices are connected rather than duplicated.
- Student/guardian views match the teacher preview path and remain permission-safe.
- High-value mobile tasks are usable without desktop parity hacks.
- AI remains optional, diff-based, and never auto-publishes.
