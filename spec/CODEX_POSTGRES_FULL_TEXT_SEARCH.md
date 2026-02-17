# CODEX_POSTGRES_FULL_TEXT_SEARCH — Upgrade Search from ILIKE to Postgres FTS

**Priority:** P1
**Effort:** Medium (5–6 hours)
**Spec Refs:** TECH-2.8 (Search Strategy — Postgres FTS initially), PRD-8 (Performance)
**Depends on:** None

---

## Problem

The search controller uses `ILIKE '%query%'` pattern matching across 5 entity types. This has problems at scale:

1. **No index usage** — ILIKE with leading wildcard triggers sequential scans
2. **No ranking** — results returned in arbitrary order, not relevance-ranked
3. **No stemming** — searching "teaching" won't match "teacher"
4. **No partial word matching** — no prefix search or trigram support
5. **5 separate queries** — one per entity type, no unified ranking

TECH-2.8 specifies "Postgres FTS initially" as the search strategy.

---

## Tasks

### 1. Add tsvector Columns via Migration

```ruby
class AddFullTextSearchColumns < ActiveRecord::Migration[8.0]
  def change
    # Unit Plans
    add_column :unit_plans, :search_vector, :tsvector
    add_index :unit_plans, :search_vector, using: :gin

    # Lesson Plans
    add_column :lesson_plans, :search_vector, :tsvector
    add_index :lesson_plans, :search_vector, using: :gin

    # Courses
    add_column :courses, :search_vector, :tsvector
    add_index :courses, :search_vector, using: :gin

    # Standards
    add_column :standards, :search_vector, :tsvector
    add_index :standards, :search_vector, using: :gin

    # Assignments
    add_column :assignments, :search_vector, :tsvector
    add_index :assignments, :search_vector, using: :gin

    # Question Banks
    add_column :question_banks, :search_vector, :tsvector
    add_index :question_banks, :search_vector, using: :gin
  end
end
```

### 2. Add Trigger-Based Vector Updates

Create migration with SQL triggers to auto-update tsvector on INSERT/UPDATE:

```sql
CREATE FUNCTION unit_plans_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER unit_plans_search_update
  BEFORE INSERT OR UPDATE ON unit_plans
  FOR EACH ROW EXECUTE FUNCTION unit_plans_search_trigger();
```

Repeat for each searchable table with appropriate field weights (A = title/name, B = description/content, C = secondary fields).

### 3. Backfill Existing Records

Create rake task `search:reindex` that updates all existing records to populate tsvector columns.

### 4. Create SearchService

Create `apps/core/app/services/search_service.rb`:

```ruby
class SearchService
  SEARCHABLE = {
    "unit_plans" => { model: UnitPlan, fields: "title, description" },
    "lesson_plans" => { model: LessonPlan, fields: "title" },
    "courses" => { model: Course, fields: "name, description" },
    "standards" => { model: Standard, fields: "code, description" },
    "assignments" => { model: Assignment, fields: "title, description" },
    "question_banks" => { model: QuestionBank, fields: "name" },
  }.freeze

  def search(query, user:, types: nil, limit: 10)
    tsquery = sanitize_query(query)
    results = []

    target_types = types || SEARCHABLE.keys
    target_types.each do |type|
      config = SEARCHABLE[type]
      next unless config

      scope = policy_scope(user, config[:model])
      hits = scope.where("search_vector @@ plainto_tsquery('english', ?)", tsquery)
                  .select("*, ts_rank(search_vector, plainto_tsquery('english', '#{tsquery}')) AS rank")
                  .order("rank DESC")
                  .limit(limit)

      results += hits.map { |r| format_result(r, type) }
    end

    results.sort_by { |r| -r[:rank] }.first(limit)
  end

  private

  def sanitize_query(query)
    query.gsub(/[^\w\s]/, "").strip
  end
end
```

### 5. Update Search Controller

Replace ILIKE queries with SearchService calls. Return ranked results with relevance scores.

### 6. Update GlobalSearch Component

Update `apps/web/src/components/GlobalSearch.tsx`:
- Show relevance-ranked results across all types
- Add type filter chips (All, Units, Courses, Standards, etc.)
- Highlight matching terms in results

### 7. Add Tests

- `apps/core/spec/services/search_service_spec.rb`
- Update `apps/core/spec/requests/api/v1/search_controller_spec.rb`

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/db/migrate/YYYYMMDD_add_full_text_search.rb` | tsvector columns + GIN indexes |
| `apps/core/db/migrate/YYYYMMDD_add_search_triggers.rb` | SQL triggers for auto-update |
| `apps/core/app/services/search_service.rb` | FTS query service |
| `apps/core/lib/tasks/search.rake` | Reindex task |
| `apps/core/spec/services/search_service_spec.rb` | Service spec |

## Files to Modify

| File | Purpose |
|------|---------|
| `apps/core/app/controllers/api/v1/search_controller.rb` | Use SearchService |
| `apps/web/src/components/GlobalSearch.tsx` | Type filters, highlighting |

---

## Definition of Done

- [ ] tsvector columns and GIN indexes on 6 tables
- [ ] SQL triggers auto-update vectors on write
- [ ] Rake task backfills existing records
- [ ] SearchService returns relevance-ranked results
- [ ] Search controller uses FTS instead of ILIKE
- [ ] Results ranked by ts_rank across entity types
- [ ] Stemming works (e.g., "teaching" matches "teacher")
- [ ] All specs pass
