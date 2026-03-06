# IB Phase 2 Release Gates

## Click-budget targets

- Teacher opens the current unit from home in 1 click.
- Teacher validates evidence in 2 clicks or fewer from the evidence inbox.
- Teacher previews and schedules a family story in 3 clicks or fewer.
- Coordinator reaches the next review blocker in 1 click from home or operations.
- Student reaches progress or portfolio in 1 click from home.
- Guardian reaches the current learning digest in 1 click from home.

## Role journeys to verify

- PYP homeroom teacher
- PYP specialist
- MYP subject teacher
- DP teacher
- PYP coordinator
- MYP coordinator
- DP coordinator
- Whole-school IB leader
- Student
- Guardian

## Release checks

- Every IB nav item resolves to a real `/ib/**` route.
- Home, evidence, publishing, operations, review, and exception reports have loading, empty, error, permission, and offline states.
- No major coordinator or teacher card dead-ends into a placeholder without a deeper route.
- AI remains diff-based and never auto-applies or auto-publishes.
- Mobile triage remains limited to high-value tasks and clearly shows pending vs saved vs retry states.
- Route-load telemetry remains wired through the IB workspace scaffold.
- No known family-facing surface exposes internal review or draft-state language.
