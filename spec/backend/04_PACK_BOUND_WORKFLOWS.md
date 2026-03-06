# Step 4 — Replace hard-coded workflows with pack-bound workflows

## Outcome

After this step:

- Workflow rules are no longer hard-coded in `CurriculumWorkflowEngine::TRANSITIONS`.
- Each curriculum pack defines:
  - workflow definitions (`workflow_definitions`)
  - bindings from document types to workflows (`workflow_bindings`)
- The backend enforces transitions based on the **selected pack**, enabling:
  - different approval processes (IB vs American vs British)
  - different state machines per document type
  - future workflows without deploying code (when only config changes)

This step assumes Step 1 (Pack Store) and Step 3 (pack schema upgrade).

---

## Why this matters

Workflows differ by curriculum and by school:

- IB PYP often requires collaborative planning + review
- DP may require coordinator sign-off
- American standards units might be published quickly, but assessments require review

Hard-coded workflows block per-curriculum adaptation.

---

## Design decisions

### Decision 1 — Workflows are data, but execution remains safe
Packs define **data**:

- states
- events
- role gates
- named guard types
- named side effect types

But packs cannot run arbitrary code.

### Decision 2 — Keep a registry of allowed guards/side-effects
The backend owns the implementations.

Pack references them by name:

```json
{"guards": [{"type": "approval_not_required_or_approved"}]}
```

### Decision 3 — Workflow state stored on the record
For now, keep using the `status` column as the workflow state.

In Route 3, `CurriculumDocument.status` becomes the workflow state.

---

## Implementation plan

### 1) Add a workflow registry

**Create:** `apps/core/app/services/curriculum/workflow_registry.rb`

Responsibilities:

- Given a pack payload + document_type, return the workflow definition

Suggested API:

```rb
module Curriculum
  class WorkflowRegistry
    def self.workflow_for!(pack:, document_type:)
      workflow_key = (pack["workflow_bindings"] || {})[document_type.to_s]
      raise KeyError, "No workflow binding for #{document_type}" if workflow_key.blank?

      workflow = (pack["workflow_definitions"] || {})[workflow_key]
      raise KeyError, "No workflow definition #{workflow_key}" if workflow.nil?

      { key: workflow_key, definition: workflow }
    end
  end
end
```

---

### 2) Implement guard registry

**Create:** `apps/core/app/services/curriculum/workflow_guards.rb`

Goal:

- Pack events can declare `guards: [...]`
- Backend evaluates guards safely

Example guard types:

- `approval_required` → boolean
- `approval_not_required_or_approved`

Implementation approach:

```rb
module Curriculum
  class WorkflowGuards
    GuardFailed = Class.new(StandardError)

    def self.check!(guards:, record:, actor:, context: {})
      Array(guards).each do |guard|
        type = guard["type"].to_s
        handler = registry.fetch(type) { raise GuardFailed, "Unknown guard #{type}" }
        ok = handler.call(record: record, actor: actor, context: context, params: guard)
        raise GuardFailed, "Guard failed: #{type}" unless ok
      end

      true
    end

    def self.registry
      @registry ||= {
        "approval_required" => ->(record:, actor:, context:, params:) {
          context[:approval_required] == true
        },
        "approval_not_required_or_approved" => ->(record:, actor:, context:, params:) {
          return true unless context[:approval_required] == true
          # if approval required, record must have an approved approval or be in pending_approval
          Approval.where(approvable: record, status: "approved").exists? || record.status.to_s == "pending_approval"
        }
      }
    end
  end
end
```

Notes:

- Guards must be deterministic and fast.
- If a guard needs DB reads, ensure indexed queries.

---

### 3) Implement side effect registry

**Create:** `apps/core/app/services/curriculum/workflow_side_effects.rb`

Examples:

- `create_approval`
- `auto_approve_pending`
- `notify_roles`

Implementation approach:

```rb
module Curriculum
  class WorkflowSideEffects
    SideEffectError = Class.new(StandardError)

    def self.apply!(effects:, record:, actor:, context: {})
      Array(effects).each do |effect|
        type = effect["type"].to_s
        handler = registry.fetch(type) { raise SideEffectError, "Unknown side effect #{type}" }
        handler.call(record: record, actor: actor, context: context, params: effect)
      end
    end

    def self.registry
      @registry ||= {
        "create_approval" => ->(record:, actor:, context:, params:) {
          record.approvals.create!(tenant: record.tenant, requested_by: actor, status: "pending")
        },
        "auto_approve_pending" => ->(record:, actor:, context:, params:) {
          Approval.where(approvable: record, status: "pending").update_all(status: "approved", updated_at: Time.current)
        }
      }
    end
  end
end
```

---

### 4) Build the pack-bound workflow engine

**Create:** `apps/core/app/services/curriculum/workflow_engine.rb`

This is the new engine that replaces `CurriculumWorkflowEngine`.

#### 4.1) Determine pack for a record

For Route 3 documents:

- record has `pack_key` / `pack_version`

For legacy objects (UnitPlan/LessonPlan/Template):

- derive pack by calling `CurriculumProfileResolver.resolve(tenant:, school:, course:)`
- use `CurriculumPackStore.fetch`

Implement a helper:

```rb
module Curriculum
  class WorkflowEngine
    class TransitionError < StandardError; end

    def self.transition!(record:, event:, actor:, context: {})
      pack = resolve_pack_for_record!(record)
      document_type = resolve_document_type(record)

      wf = WorkflowRegistry.workflow_for!(pack: pack, document_type: document_type)
      definition = wf[:definition]
      event_def = (definition["events"] || {})[event.to_s]
      raise TransitionError, "Unsupported transition #{document_type}.#{event}" if event_def.nil?

      allowed_from = Array(event_def["from"]).map(&:to_s)
      to_state = event_def["to"].to_s
      roles = Array(event_def["roles"]).map(&:to_s)

      current_state = record.status.to_s
      raise TransitionError, "Invalid from state" unless allowed_from.include?(current_state)
      raise TransitionError, "Role not permitted" unless role_allowed?(actor, roles)

      WorkflowGuards.check!(guards: event_def["guards"], record: record, actor: actor, context: context)

      record.update!(status: to_state)

      WorkflowSideEffects.apply!(effects: event_def["side_effects"], record: record, actor: actor, context: context)

      record
    rescue WorkflowGuards::GuardFailed => e
      raise TransitionError, e.message
    rescue WorkflowSideEffects::SideEffectError => e
      raise TransitionError, e.message
    end

    # ... helper methods
  end
end
```

#### 4.2) Resolve document_type

Mapping for legacy:

- `UnitPlan` → `unit_plan`
- `LessonPlan` → `lesson_plan`
- `Template` → `template`

Route 3:

- `CurriculumDocument.document_type`

---

### 5) Replace controller usage

**Modify:**

- `apps/core/app/controllers/api/v1/unit_plans_controller.rb`
- `apps/core/app/controllers/api/v1/lesson_plans_controller.rb` (if it has publish)
- `apps/core/app/controllers/api/v1/templates_controller.rb`

Replace:

```rb
CurriculumWorkflowEngine.transition!(...)
```

with:

```rb
Curriculum::WorkflowEngine.transition!(...)
```

Keep `CurriculumWorkflowEngine` in place for now, but stop calling it.

---

### 6) Update packs to define workflows

Update your system packs to include:

- `workflow_definitions`
- `workflow_bindings`

For legacy packs, the registry normalization can synthesize default workflows.

---

## Tests

### Unit tests

- workflow registry finds correct workflow by binding
- unknown workflow binding errors clearly
- role gating enforced
- guard failure stops transition
- side effect executed

### Request specs

- `/unit_plans/:id/publish` respects pack rules
- A pack with approval requirement blocks publish from draft

---

## Rollout plan

Feature flag:

- `curriculum_pack_workflows_v1` (default false)

When off:

- use old `CurriculumWorkflowEngine`

When on:

- use new `Curriculum::WorkflowEngine`

Rollback:

- toggle flag off

No schema rollback required.

---

## Acceptance criteria

- Workflow transitions are driven by pack JSON, not hard-coded Ruby constants.
- Different packs can enforce different allowed transitions.
- Pack-defined side effects execute via safe, whitelisted handlers.
