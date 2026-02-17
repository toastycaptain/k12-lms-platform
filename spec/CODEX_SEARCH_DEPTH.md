# CODEX_SEARCH_DEPTH — Implement Full-Text Search Across Core Entities

**Priority:** P1
**Effort:** Medium (6–8 hours)
**Spec Refs:** TECH-2.8 (Search Strategy — Postgres FTS initially), UX-3.2 (Top bar search)
**Depends on:** None

---

## Problem

The TECH_SPEC §2.8 specifies Postgres FTS as the Phase 1–2 search strategy. A `GlobalSearch` component and `/api/v1/search` endpoint exist, but the search implementation is shallow:

1. The search controller likely uses basic `ILIKE` queries, not Postgres full-text search
2. No `tsvector` columns or GIN indexes on searchable tables
3. Search results are not ranked by relevance
4. No search suggestions or typeahead
5. Limited entity coverage — not all searchable entities may be included

The UX spec envisions search as a core navigation aid: teachers should find standards, units, templates, courses, and assignments quickly from the top bar.

---

## Tasks

### 1. Audit Current Search Implementation

Read and document:
- `apps/core/app/controllers/api/v1/search_controller.rb` — current query logic
- `apps/web/src/components/GlobalSearch.tsx` — current UI behavior
- Identify which entities are currently searchable

### 2. Add tsvector Columns

Create a migration to add `searchable` tsvector columns to these tables:

| Table | Fields to Index | Weight |
|-------|----------------|--------|
| unit_plans | title, description | A, B |
| lesson_plans | title, description | A, B |
| templates | name, description | A, B |
| courses | name, description, code | A, B, C |
| assignments | title, description | A, B |
| standards | code, description | A, B |
| standard_frameworks | name, description | A, B |
| question_banks | name, description | A, B |
| questions | content, explanation | A, B |
| discussions | title | A |
| announcements | title, body | A, B |

Migration pattern:
```ruby
class AddSearchVectors < ActiveRecord::Migration[8.0]
  def up
    add_column :unit_plans, :searchable, :tsvector
    add_index :unit_plans, :searchable, using: :gin

    execute <<-SQL
      UPDATE unit_plans SET searchable =
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B');
    SQL

    execute <<-SQL
      CREATE TRIGGER unit_plans_searchable_trigger
      BEFORE INSERT OR UPDATE OF title, description ON unit_plans
      FOR EACH ROW EXECUTE FUNCTION
        tsvector_update_trigger(searchable, 'pg_catalog.english', title, description);
    SQL
  end

  def down
    execute "DROP TRIGGER IF EXISTS unit_plans_searchable_trigger ON unit_plans"
    remove_column :unit_plans, :searchable
  end
end
```

Repeat for each table above.

### 3. Create Search Service

Create `apps/core/app/services/search_service.rb`:

```ruby
class SearchService
  SEARCHABLE_MODELS = {
    "units" => UnitPlan,
    "lessons" => LessonPlan,
    "templates" => Template,
    "courses" => Course,
    "assignments" => Assignment,
    "standards" => Standard,
    "question_banks" => QuestionBank,
    "discussions" => Discussion,
  }.freeze

  def initialize(query:, types: nil, limit: 20)
    @query = query
    @types = types || SEARCHABLE_MODELS.keys
    @limit = [limit, 50].min
  end

  def call
    return [] if @query.blank?

    ts_query = sanitize_query(@query)
    results = []

    @types.each do |type|
      model = SEARCHABLE_MODELS[type]
      next unless model

      records = model
        .where("searchable @@ plainto_tsquery('english', ?)", ts_query)
        .select("*, ts_rank(searchable, plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(ts_query)})) AS rank")
        .order("rank DESC")
        .limit(@limit)

      results.concat(records.map { |r| serialize_result(r, type) })
    end

    results.sort_by { |r| -r[:rank] }.first(@limit)
  end

  private

  def sanitize_query(query)
    query.gsub(/[^\w\s]/, " ").strip
  end

  def serialize_result(record, type)
    {
      id: record.id,
      type: type,
      title: record.respond_to?(:title) ? record.title : record.try(:name),
      description: record.try(:description)&.truncate(200),
      rank: record.try(:rank)&.to_f || 0,
      url: build_url(record, type),
    }
  end

  def build_url(record, type)
    # Return frontend-friendly URL path
    case type
    when "units" then "/plan/units/#{record.id}"
    when "lessons" then "/plan/units/#{record.unit_plan_id}/lessons/#{record.id}"
    when "templates" then "/plan/templates/#{record.id}"
    when "courses" then "/teach/courses/#{record.id}"
    when "assignments" then "/teach/courses/#{record.course_id}/assignments/#{record.id}"
    when "standards" then "/plan/standards"
    when "question_banks" then "/assess/banks/#{record.id}"
    when "discussions" then "/teach/courses/#{record.course_id}/discussions/#{record.id}"
    end
  end
end
```

### 4. Update Search Controller

Update `apps/core/app/controllers/api/v1/search_controller.rb`:
- Accept `q` (query), `types` (comma-separated entity types), and `limit` params
- Delegate to `SearchService`
- Return results with type, title, description, rank, and URL
- Ensure tenant scoping via `Current.tenant`

### 5. Enhance GlobalSearch Component

Update `apps/web/src/components/GlobalSearch.tsx`:
- Add debounced typeahead (300ms debounce)
- Show results grouped by type (Units, Courses, Standards, etc.)
- Show result count per type
- Keyboard navigation (arrow keys + enter)
- Highlight matching text in results
- Show "No results" state
- Show loading spinner during search

### 6. Add Search Specs

Create `apps/core/spec/services/search_service_spec.rb`:
- Test search returns matching records
- Test search respects tenant scoping
- Test search filters by type
- Test search limits results
- Test search handles empty/blank queries
- Test search ranks results by relevance

Update `apps/core/spec/requests/api/v1/search_controller_spec.rb`:
- Test search endpoint returns 200
- Test search with query param
- Test search with type filter
- Test search with limit
- Test search requires authentication
- Test search scoped to current tenant

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_add_search_vectors.rb` | tsvector columns + GIN indexes |
| `apps/core/app/services/search_service.rb` | Full-text search orchestrator |
| `apps/core/spec/services/search_service_spec.rb` | Search service tests |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/search_controller.rb` | Use SearchService |
| `apps/web/src/components/GlobalSearch.tsx` | Enhanced typeahead UX |
| `apps/core/spec/requests/api/v1/search_controller_spec.rb` | Extended search tests |

---

## Definition of Done

- [ ] tsvector columns and GIN indexes exist on 10+ tables
- [ ] SearchService returns ranked, tenant-scoped results
- [ ] Search controller uses SearchService
- [ ] GlobalSearch component shows grouped, typeahead results
- [ ] Search service specs pass
- [ ] Search request specs pass
- [ ] `bundle exec rspec` passes (1441+ specs)
- [ ] Frontend typecheck and build pass
- [ ] No Rubocop violations
