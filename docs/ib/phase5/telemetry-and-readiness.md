# IB Phase 5 Telemetry Taxonomy and Readiness Signals

## Telemetry Principles
- emit structured events for route usage, workflow outcomes, publishing, and standards exports
- never emit student work content or family-facing narrative text in telemetry payloads
- include only operational metadata needed for rollout decisions: tenant, school, route, record ids, outcome, and timestamps

## Event Taxonomy
| Event | Emitter | Purpose | Core Metadata |
| --- | --- | --- | --- |
| `ib_route_view` | `IbWorkspaceScaffold` | route usage signal | `routeId`, `href` |
| `ib_workspace_render` | `IbWorkspaceScaffold` | route render latency | `workspace`, `clickDepth` |
| `ib_workspace_first_interaction` | `IbWorkspaceScaffold` | first-interaction timing | `workspace`, `routeId` |
| `ib_workspace_click_depth` | `IbWorkspaceScaffold` | interaction complexity | `workspace`, `clickDepth` |
| `ib.route.resolve` | `Api::V1::Ib::ResolutionsController` | route-resolution outcome | `entity_ref`, `href`, `status`, `route_id` |
| `ib.standards.export.enqueued` | `Ib::Standards::ExportService` | export job start | `packet_id`, `cycle_id` |
| `ib.standards.export.succeeded` | `Ib::Standards::ExportService` | successful export | `packet_id`, `export_id` |
| `ib.standards.export.failed` | `Ib::Standards::ExportService` | export failure | `packet_id`, `export_id`, `message` |
| `ib.publishing.scheduled` | `PublishingQueueItemsController` | digest scheduling | `queue_item_id`, `state` |
| `ib.publishing.held` | `PublishingQueueItemsController` | explicit hold action | `queue_item_id`, `state` |
| `ib.publishing.published` | `PublishingQueueItemsController` | publish-now success | `queue_item_id`, `state` |
| `curriculum.workflow.transition` | `Curriculum::WorkflowEngine` | workflow success | workflow key, event, actor |
| `curriculum.workflow.transition_failed` | `Curriculum::WorkflowEngine` | workflow failure | workflow key, event, error |

## Readiness Sections Backed by the Backend
The pilot-readiness service now reports these explicit sections:
- pack and flags
- programme settings
- route readiness
- document migration
- review governance
- standards and exports
- publishing reliability
- telemetry signals

## How to Read the Signals
- `green`: safe enough for the intended pilot scope
- `yellow`: gaps are known and should be remediated before expanding pilot traffic
- `red`: pilot or release should stop until the blocking condition is cleared

## Primary Operational Questions Answered
- Are users landing on canonical routes or still depending on legacy redirects?
- Is the active school on the right pack/version with the required flags?
- Are review queues explainable, school-scoped, and within SLA?
- Are standards exports and family publishing succeeding reliably?
- Is document migration drift low enough to turn on documents-only mode?
