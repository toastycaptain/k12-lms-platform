# Phase 10 Search And Knowledge Discovery

## Scope
- Tasks `431` to `444`
- Goal: turn the IB data graph into a permission-safe search surface that behaves like institutional memory, not a flat keyword box

## Architecture
- Search stays request-scoped and school-scoped. There is no parallel search database in Phase 10.
- `Ib::Search::UnifiedSearchService` is now the single backend contract for query parsing, relevance ranking, permission filtering, redaction, grouped result shaping, concept linking, and telemetry.
- `Ib::Search::QueryParser` owns the lightweight query language:
  - supported filters: `kind`, `programme`, `status`, `audience`, `visibility`, `student`, `owner`, `lens`
  - free text and filters can be mixed in one query string
- `Ib::Search::KnowledgeGraphService` builds lightweight concept and relation links from returned results so the UI can explain why records are related.
- `Ib::Search::FreshnessService` exposes operational metadata:
  - current index strategy
  - latency budget target
  - backpressure mode
  - rebuild recommendation threshold
- `Ib::Search::ProfileService` remains the search-ops surface for admins/coordinators and now includes:
  - freshness summary
  - adoption summary
  - saved lens inventory
  - relevance contract metadata

## Permission Model
- Backend search does not trust model scopes alone.
- Every candidate record is still checked with its policy `show?` rule before serialization.
- Search adds stricter user-type guards on top of policy results for content that existing Phase 1-9 scopes intentionally left broad:
  - guardians and students never receive internal comments/tasks/documents/library items
  - guardian/student evidence and reflection results require linked-student access plus audience/visibility fit
  - guardian/student story results require audience fit and student linkage where metadata exists

## Relevance And Semantic Fallback
- Ranking order:
  - exact title / prefix title hits
  - detail / preview token hits
  - keyword / synonym hits
  - deterministic semantic fallback using token overlap plus concept keywords
  - recency balance
- There is no live embedding dependency in Phase 10.
- Semantic mode is intentionally deterministic:
  - `lexical_rank_plus_keyword_graph`
  - fallback: `token_overlap_and_synonyms`

## Indexed Domains
- Curriculum documents
- Evidence items
- Reflection requests
- Learning stories
- Operational records
- Reports
- Standards packets
- Document comments / tasks
- Specialist library items
- Portfolio collections

## UI Contract
- The search dialog now surfaces:
  - grouped results
  - quick preview
  - coordinator lenses
  - facet chips
  - zero-result recovery help
  - concept graph tags
  - keyboard navigation guidance
- Saved searches persist both query text and applied filters.

## Freshness, Rebuilds, And Backpressure
- Search remains database-backed in Phase 10.
- Freshness target: `5` minutes equivalent data visibility under normal write load.
- Rebuild strategy in this phase:
  - manual request plus background refresh, not autonomous reindex storms
  - recommend a deeper rebuild when recent zero-result rate exceeds `35%`
  - large-school active profiles drive stricter latency budgets

## Observability
- Backend telemetry:
  - `ib.search.executed`
  - `ib.search.zero_result`
- Frontend analytics:
  - `ib.search.executed`
  - `ib.search.result_opened`
  - `ib.search.saved`
- Search ops payload includes adoption summary so operators can judge usefulness, not just volume.

## Large-School Load Budget
- Baseline script: [`infrastructure/phase10/load/ib_search.js`](/Users/colinpeterson/k12-lms-platform/infrastructure/phase10/load/ib_search.js)
- Current target thresholds:
  - `http_req_failed < 2%`
  - `p95 < 900ms`
  - `p99 < 1500ms`

## Manual QA
1. Search as a teacher for `reflection` and confirm documents/tasks/evidence all appear when course-linked.
2. Search as a guardian for `reflection` and confirm internal document/task results are absent.
3. Apply facet chips and confirm the request includes `filters[...][]` parameters.
4. Run a zero-result query and verify recovery help plus suggestions appear.
5. Open `Search Ops Panel` and confirm freshness/adoption fields render from `/api/v1/ib/search_profiles`.
