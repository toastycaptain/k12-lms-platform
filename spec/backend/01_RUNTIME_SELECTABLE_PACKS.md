# Step 1 — Runtime-selectable curriculum packs (finish “profile releases”)

## Outcome

After this step:

- A tenant (and optionally a district) can **import** and **publish** a curriculum pack (currently stored in `curriculum_profile_releases.payload`).
- The runtime resolver can select packs from:
  - **System packs** (repo JSON files)
  - **Tenant published/frozen pack releases** in the DB
- When a DB release exists for `key@version`, the runtime can use the release payload without requiring a deploy.
- All “pack existence checks” (admin settings, assignments, school overrides, course pins) validate against the same **Pack Store**.

This step does *not* redesign planner objects or documents yet; it focuses on making packs **real runtime artifacts**.

---

## Why the current code needs this

Today:

- `CurriculumProfileLifecycleService` can import/publish a profile release to DB.
- `CurriculumProfileResolver` only loads packs from `CurriculumProfileRegistry` (filesystem JSON) and uses DB releases only to gate eligibility.

So publishing a release doesn’t actually change the runtime pack payload.

---

## Key design decisions

### Decision 1 — Introduce a Pack Store abstraction
Create a service that can fetch a pack payload from multiple sources (system + DB).

### Decision 2 — Precedence rules
When resolving a pack:

1. If an **exact tenant release** exists for `key@version` and it is `published` or `frozen`, use it.
2. Else, use the **system pack** for that `key@version` if present.
3. Else, fallback to the **system fallback pack**.

If a tenant has a release for `key@version` but the release is `draft`/`deprecated`/`rolled_back`, treat that pack version as **not eligible**.

### Decision 3 — Keep DB table names for now
To minimize churn, keep `curriculum_profile_releases` as-is. In code, treat them as *pack releases*.

---

## Implementation plan

### 1) Add a Pack Store service

**Create:** `apps/core/app/services/curriculum_pack_store.rb`

Responsibilities:

- List available packs for a tenant
- Fetch a pack payload by key/version
- Normalize payload to the canonical internal shape (use existing `CurriculumProfileRegistry.normalize_profile` behavior)

Suggested API:

```rb
class CurriculumPackStore
  CACHE_TTL = 10.minutes

  # Returns [{key:, version:, label:, status:, source:}]
  def self.list(tenant:)
  end

  # Returns normalized pack payload Hash or nil
  def self.fetch(tenant:, key:, version: nil)
  end

  # Returns true/false
  def self.exists?(tenant:, key:, version: nil)
  end
end
```

#### 1.1) System packs
Use `CurriculumProfileRegistry.all` as “system packs”.

#### 1.2) Tenant packs (DB releases)
Query `CurriculumProfileRelease.where(tenant_id: tenant.id)`.

Only statuses eligible for runtime selection:
- `published`
- `frozen`

(These are lifecycle statuses on `CurriculumProfileRelease`, not the pack payload’s own `status`.)

#### 1.3) Caching
Cache per tenant + pack identity:

- `tenant:{tenant_id}:pack:{key}:{version}`
- `tenant:{tenant_id}:pack_index`

Invalidate cache when:
- a release is imported/published/deprecated/frozen/rolled_back

You already call `CurriculumProfileResolver.invalidate_cache!` during lifecycle operations. Add `CurriculumPackStore.invalidate_cache!(tenant:)` and call it from the lifecycle service.

---

### 2) Update the resolver to fetch payloads from the Pack Store

**Modify:** `apps/core/app/services/curriculum_profile_resolver.rb`

Replace `select_profile(candidate)` with something that calls the store.

Current:

```rb
CurriculumProfileRegistry.find(key, version)
```

Replace with:

```rb
CurriculumPackStore.fetch(tenant: tenant, key: key, version: version)
```

#### 2.1) Preserve existing resolver output shape
Keep the resolved hash keys the same for now (`profile_key`, `profile_version`, `planner_object_schemas`, etc.) so the frontend doesn’t break.

#### 2.2) Add pack payload source metadata
Add fields:

- `pack_payload_source`: `"tenant_release" | "system" | "fallback"`
- `pack_release_id` when payload comes from DB

This is critical for debugging.

#### 2.3) Eligibility checks
The resolver currently calls `release_eligible?` if the feature flag is on. Keep that behavior, but align it with store logic:

- If a tenant release exists and is not eligible, the resolver must skip that candidate.
- If no tenant release exists, allow system packs.

Implementation note:
- Prefer to move eligibility checks into `CurriculumPackStore.fetch` so there’s a single source of truth.

---

### 3) Update curriculum settings UI payload to list tenant packs

**Modify:** `apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb`

Update `settings_payload`:

- `available_profile_keys` should be replaced/expanded to a list from `CurriculumPackStore.list(tenant: Current.tenant)`.
- `available_profiles` should include both system and tenant releases.

Suggested payload structure:

```json
{
  "available_packs": [
    {
      "key": "ib_continuum",
      "version": "2026.1",
      "label": "IB Continuum",
      "pack_status": "active",
      "release_status": "published",
      "source": "tenant_release"
    }
  ]
}
```

Keep the old fields for backwards compatibility during frontend migration:

- `available_profile_keys`
- `available_profiles`

…but populate them from `available_packs`.

---

### 4) Replace all pack validation checks to use the Pack Store

Search for usages of:

- `CurriculumProfileRegistry.exists?`
- `CurriculumProfileRegistry.keys`

and replace with store-backed checks.

**Files to update (current repo):**

- `apps/core/app/models/curriculum_profile_assignment.rb`
- `apps/core/app/models/school.rb`
- `apps/core/app/models/course.rb`
- `apps/core/app/services/tenant_provisioning_service.rb`
- `apps/core/app/controllers/api/v1/admin/curriculum_settings_controller.rb`
- `apps/core/app/controllers/api/v1/district_controller.rb`

#### 4.1) Model validation patterns
Model validations should not depend on `Current.tenant` being set.

Preferred:

- use the model’s `tenant_id`
- query `CurriculumProfileRelease` for that tenant
- OR fall back to system registry

Example for assignments:

```rb
# curriculum_profile_assignment.rb

def profile_key_must_exist
  return if profile_key.blank?

  tenant = Tenant.unscoped.find_by(id: tenant_id)
  return if tenant && CurriculumPackStore.exists?(tenant: tenant, key: profile_key, version: profile_version)

  errors.add(:profile_key, "is not a recognized curriculum pack")
end
```

(Yes, this adds a DB read; it’s acceptable for admin writes. Do not do this for hot-path reads.)

---

### 5) District distribution must handle tenant-specific pack releases

**Modify:** `apps/core/app/controllers/api/v1/district_controller.rb` → `push_curriculum_distribution`

When distributing a pack:

- If the pack exists as a **system pack**, you can continue setting tenant defaults/assignments as today.
- If the pack exists only as a **tenant release** (custom pack), you must copy the release payload to each target tenant before setting defaults.

Implementation approach:

1. Determine the pack payload using `CurriculumPackStore.fetch(tenant: source_tenant, key:, version:)`.
2. For each target tenant:
   - `CurriculumProfileLifecycleService#import!` the payload into that tenant (idempotent by key/version)
   - `publish!` it (or freeze it) depending on district rules
   - apply tenant defaults and optional school overrides

Add audit metadata like:

- `"source" => "district_distribution"`
- `"district_id" => current_district.id`
- `"source_tenant_id" => source_tenant.id`

---

### 6) Update the curriculum profiles endpoint (optional but recommended)

**Modify:** `apps/core/app/controllers/api/v1/curriculum_profiles_controller.rb`

Instead of returning only system packs from `CurriculumProfileRegistry`, return tenant-available packs:

- `CurriculumPackStore.list(tenant: Current.tenant)`

If you must preserve old behavior:

- add `?source=system|tenant|all` params

---

## Tests

Add/extend RSpec tests.

### Required test cases

1. **Pack Store fetch precedence**
   - When tenant release exists (published), it overrides system pack of same key/version.
   - When tenant release exists (draft), it is not eligible and system pack is used (or fallback if no system pack).

2. **Resolver uses tenant release payload**
   - Resolve returns terminology/schema fields from the release payload.

3. **Admin settings validation**
   - Updating tenant default to a tenant-released pack version succeeds.

4. **District distribution copies releases**
   - After distribution, target tenant has a release record and resolver resolves to it.

---

## Rollout plan

### Feature flag
Introduce a feature flag key (existing pattern uses `FeatureFlag`):

- `curriculum_pack_store_v1` (default false)

When off:
- resolver behavior remains unchanged (system-only)

When on:
- resolver uses `CurriculumPackStore`

### Rollback
To rollback:

- disable feature flag
- packs revert to system profiles

No schema changes required for rollback in this step.

---

## Acceptance criteria

- An admin can import and publish a pack JSON via existing endpoint.
- After publish, `CurriculumProfileResolver.resolve(...)` returns fields from the **DB payload**, not the filesystem JSON.
- Admin curriculum settings UI lists both system and tenant packs.
- Invalid pack key/version updates are rejected consistently.
