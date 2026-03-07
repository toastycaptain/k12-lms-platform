# IB Phase 9 Reporting Command Center and Delivery

Covers task range `283` to `294`.

## What shipped
- Report-cycle and report-template domain models with API endpoints and school scoping.
- Reporting command-center panel embedded in the live IB reports workspace.
- Delivery summary aggregation that keeps released, delivered, and acknowledged counts visible next to cycle setup.

## Reporting contract
- Cycles own programme, dates, approval summary, localization settings, and derived report metrics.
- Templates own audience, family, schema version, section definitions, and translation rules.
- `IbReport` now optionally belongs to both `IbReportCycle` and `IbReportTemplate`, allowing the reporting layer to move from one-off rendering to cycle-aware operations.

## Why this matters
- Reporting is now managed as an operational system, not just a generated artifact.
- Coordinators can see cycle state, template inventory, and delivery health in the same workspace where reports are drafted and released.

## Remaining explicit gaps
- The command center does not yet expose hold, remind, resend, or archive-summary actions as first-class buttons.
- Template authoring remains metadata-first rather than a full visual editor.
