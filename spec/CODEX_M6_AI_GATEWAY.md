# Codex Instructions — M6: AI Gateway Integration Completion

## Objective

Complete Milestone 6 (AI Gateway) from ~50% to 100%. The FastAPI AI Gateway service is fully built and tested. What remains is wiring it into the Rails core (models, controllers, policies for 4 orphaned tables), building the admin UI, and adding the AI Assistant Panel to planning screens.

---

## What Already Exists (DO NOT recreate)

### AI Gateway Service (apps/ai-gateway) — COMPLETE, do not modify
- `app/main.py` — FastAPI app with CORS, auth, error handling
- `app/routers/v1.py` — endpoints: `POST /v1/generate`, `POST /v1/generate_stream`, `GET /v1/providers`, `GET /v1/health`
- `app/providers/anthropic_provider.py` — Anthropic Claude integration
- `app/providers/openai_provider.py` — OpenAI integration
- `app/providers/registry.py` — multi-provider dispatch
- `app/providers/base.py` — BaseProvider, GenerateResponse, StreamChunk, Usage, ProviderError
- `app/safety/filters.py` — input/output safety filtering
- `app/prompts/system_prompts.py` — 5 task-specific system prompts (lesson_plan, unit_plan, differentiation, assessment, rewrite)
- `app/auth.py` — Bearer SERVICE_TOKEN verification
- `app/config.py` — Pydantic settings from env vars
- `tests/` — comprehensive test suite

### Database Tables — EXIST in schema.rb but have NO migrations and NO models

These 4 tables are already in `apps/core/db/schema.rb`. They were added directly to schema.rb without a migration file. You MUST create migration files for them AND model files.

#### ai_provider_configs
```
id, api_key (text), available_models (jsonb, default: []), created_at, created_by_id (bigint, not null),
default_model (string, not null), display_name (string, not null), provider_name (string, not null),
settings (jsonb, default: {}), status (string, default: "inactive", not null), tenant_id (bigint, not null), updated_at
Indexes: unique [tenant_id, provider_name], [tenant_id], [created_by_id]
Foreign keys: tenants, users (created_by_id)
```

#### ai_task_policies
```
id, ai_provider_config_id (bigint, not null), allowed_roles (jsonb, default: []), created_at,
created_by_id (bigint, not null), enabled (boolean, default: true), max_tokens_limit (integer, default: 4096),
model_override (string), requires_approval (boolean, default: false), settings (jsonb, default: {}),
task_type (string, not null), temperature_limit (float, default: 1.0), tenant_id (bigint, not null), updated_at
Indexes: unique [tenant_id, task_type], [tenant_id], [ai_provider_config_id], [created_by_id]
Foreign keys: ai_provider_configs, tenants, users (created_by_id)
```

#### ai_templates
```
id, created_at, created_by_id (bigint, not null), name (string, not null), status (string, default: "draft"),
system_prompt (text, not null), task_type (string, not null), tenant_id (bigint, not null), updated_at,
user_prompt_template (text, not null), variables (jsonb, default: [])
Indexes: [tenant_id, task_type, status], [tenant_id], [created_by_id]
Foreign keys: tenants, users (created_by_id)
```

#### ai_invocations
```
id, ai_provider_config_id (bigint, not null), ai_task_policy_id (bigint), ai_template_id (bigint),
completed_at, completion_tokens (integer), context (jsonb, default: {}), created_at, duration_ms (integer),
error_message (text), input_hash (string), model (string, not null), prompt_tokens (integer),
provider_name (string, not null), started_at, status (string, default: "pending", not null),
task_type (string, not null), tenant_id (bigint, not null), total_tokens (integer), updated_at,
user_id (bigint, not null)
Indexes: [ai_provider_config_id], [ai_task_policy_id], [ai_template_id], [tenant_id, task_type, created_at], [tenant_id], [user_id]
Foreign keys: ai_provider_configs, ai_task_policies, ai_templates, tenants, users
```

---

## Tasks to Complete

### Task 1: Create Migrations for the 4 AI Tables

The tables already exist in schema.rb but have no migration files. Create conditional migrations that only create the table if it doesn't already exist (to support both `db:schema:load` and `db:migrate` paths).

**Create:** `apps/core/db/migrate/20260215000001_create_ai_provider_configs.rb`
**Create:** `apps/core/db/migrate/20260215000002_create_ai_task_policies.rb`
**Create:** `apps/core/db/migrate/20260215000003_create_ai_templates.rb`
**Create:** `apps/core/db/migrate/20260215000004_create_ai_invocations.rb`

**Pattern:** Use `create_table ... unless table_exists?(:table_name)` in the `up` method, like the existing `20260214143000_create_audit_logs.rb` migration does.

Match the exact columns, types, indexes, and foreign keys from schema.rb (listed above).

### Task 2: Create Rails Models

**Create:** `apps/core/app/models/ai_provider_config.rb`
```ruby
class AiProviderConfig < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[active inactive].freeze
  VALID_PROVIDERS = %w[anthropic openai].freeze

  belongs_to :created_by, class_name: "User"
  has_many :ai_task_policies, dependent: :restrict_with_error
  has_many :ai_invocations, dependent: :restrict_with_error

  validates :provider_name, presence: true, inclusion: { in: VALID_PROVIDERS }
  validates :provider_name, uniqueness: { scope: :tenant_id }
  validates :display_name, presence: true
  validates :default_model, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  encrypts :api_key  # Rails 8 attribute encryption

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
```

**Create:** `apps/core/app/models/ai_task_policy.rb`
```ruby
class AiTaskPolicy < ApplicationRecord
  include TenantScoped

  VALID_TASK_TYPES = %w[lesson_plan unit_plan differentiation assessment rewrite].freeze

  belongs_to :ai_provider_config
  belongs_to :created_by, class_name: "User"
  has_many :ai_invocations, dependent: :nullify

  validates :task_type, presence: true, inclusion: { in: VALID_TASK_TYPES }
  validates :task_type, uniqueness: { scope: :tenant_id }
  validates :max_tokens_limit, numericality: { greater_than: 0 }, allow_nil: true
  validates :temperature_limit, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 2 }, allow_nil: true

  def allowed_for_role?(role_name)
    allowed_roles.blank? || allowed_roles.include?(role_name.to_s)
  end
end
```

**Create:** `apps/core/app/models/ai_template.rb`
```ruby
class AiTemplate < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft active archived].freeze
  VALID_TASK_TYPES = %w[lesson_plan unit_plan differentiation assessment rewrite].freeze

  belongs_to :created_by, class_name: "User"
  has_many :ai_invocations, dependent: :nullify

  validates :name, presence: true
  validates :task_type, presence: true, inclusion: { in: VALID_TASK_TYPES }
  validates :system_prompt, presence: true
  validates :user_prompt_template, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
end
```

**Create:** `apps/core/app/models/ai_invocation.rb`
```ruby
class AiInvocation < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[pending running completed failed].freeze

  belongs_to :user
  belongs_to :ai_provider_config
  belongs_to :ai_task_policy, optional: true
  belongs_to :ai_template, optional: true

  validates :task_type, presence: true
  validates :provider_name, presence: true
  validates :model, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def complete!(tokens:, duration:, response_hash: nil)
    update!(
      status: "completed",
      completed_at: Time.current,
      prompt_tokens: tokens[:prompt],
      completion_tokens: tokens[:completion],
      total_tokens: tokens[:total],
      duration_ms: duration
    )
  end

  def fail!(message)
    update!(status: "failed", error_message: message, completed_at: Time.current)
  end
end
```

### Task 3: Create AI Gateway Client Service

**Create:** `apps/core/app/services/ai_gateway_client.rb`

This service calls the FastAPI AI Gateway from Rails.

```ruby
class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", "")

  def self.generate(provider:, model:, messages:, task_type: nil, max_tokens: 4096, temperature: 0.7)
    conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 120
    end

    response = conn.post("/v1/generate") do |req|
      req.headers["Authorization"] = "Bearer #{SERVICE_TOKEN}"
      req.body = {
        provider: provider,
        model: model,
        messages: messages,
        task_type: task_type,
        max_tokens: max_tokens,
        temperature: temperature
      }
    end

    raise "AI Gateway error: #{response.status} #{response.body}" unless response.success?
    response.body
  end
end
```

Add `gem "faraday"` to the Gemfile if not already present. (Check first — it may already be there for OneRoster.)

### Task 4: Create Pundit Policies

**Create:** `apps/core/app/policies/ai_provider_config_policy.rb`
- index?, show?: admin only
- create?, update?, destroy?: admin only
- Scope: `scope.all` (admin-only controller, so all within tenant)

**Create:** `apps/core/app/policies/ai_task_policy_policy.rb`
- index?, show?: admin only
- create?, update?, destroy?: admin only
- Scope: `scope.all`

**Create:** `apps/core/app/policies/ai_template_policy.rb`
- index?: admin or curriculum_lead
- show?: admin or curriculum_lead
- create?, update?, destroy?: admin only
- Scope: admin/curriculum_lead see all; others see only `status: "active"`

**Create:** `apps/core/app/policies/ai_invocation_policy.rb`
- index?: any authenticated user (scoped to own invocations unless admin)
- show?: own invocation or admin
- create?: checked via task_policy.allowed_for_role? in the controller
- Scope: admin sees all, others see `where(user_id: user.id)`

**Pattern to follow:** See `apps/core/app/policies/course_policy.rb` for role-based scoping.

### Task 5: Create Controllers

**Create:** `apps/core/app/controllers/api/v1/ai_provider_configs_controller.rb`
- Standard CRUD (index, show, create, update, destroy)
- Additional actions: `activate`, `deactivate`
- Strong params: `provider_name, display_name, default_model, api_key, status, available_models: [], settings: {}`

**Create:** `apps/core/app/controllers/api/v1/ai_task_policies_controller.rb`
- Standard CRUD
- Nested under provider config OR standalone
- Strong params: `ai_provider_config_id, task_type, enabled, max_tokens_limit, model_override, requires_approval, temperature_limit, allowed_roles: [], settings: {}`

**Create:** `apps/core/app/controllers/api/v1/ai_templates_controller.rb`
- Standard CRUD
- Strong params: `name, task_type, system_prompt, user_prompt_template, status, variables: []`

**Create:** `apps/core/app/controllers/api/v1/ai_invocations_controller.rb`
- `index` — list invocations (filterable by task_type, status, date range)
- `show` — single invocation detail
- `create` — the main AI generation endpoint:
  1. Find the tenant's `AiTaskPolicy` for the given `task_type`
  2. Verify the policy is enabled and user's role is allowed
  3. Find the provider config from the task policy
  4. Optionally find an `AiTemplate` if `ai_template_id` is provided
  5. Build messages array (system prompt from template or default, user prompt)
  6. Create `AiInvocation` record with status "pending"
  7. Call `AiGatewayClient.generate`
  8. Update invocation with completion data
  9. Return the AI response + invocation ID
- Strong params: `task_type, prompt, context: {}, ai_template_id`

**Add routes in** `apps/core/config/routes.rb`:
```ruby
resources :ai_provider_configs, only: [:index, :show, :create, :update, :destroy] do
  member do
    post :activate
    post :deactivate
  end
end
resources :ai_task_policies, only: [:index, :show, :create, :update, :destroy]
resources :ai_templates, only: [:index, :show, :create, :update, :destroy]
resources :ai_invocations, only: [:index, :show, :create]
```

### Task 6: Create Factories and Specs

**Create factories:**
- `apps/core/spec/factories/ai_provider_configs.rb`
- `apps/core/spec/factories/ai_task_policies.rb`
- `apps/core/spec/factories/ai_templates.rb`
- `apps/core/spec/factories/ai_invocations.rb`

**Create request specs:**
- `apps/core/spec/requests/api/v1/ai_provider_configs_spec.rb`
- `apps/core/spec/requests/api/v1/ai_task_policies_spec.rb`
- `apps/core/spec/requests/api/v1/ai_templates_spec.rb`
- `apps/core/spec/requests/api/v1/ai_invocations_spec.rb`

**Create policy specs:**
- `apps/core/spec/policies/ai_provider_config_policy_spec.rb`
- `apps/core/spec/policies/ai_task_policy_policy_spec.rb`
- `apps/core/spec/policies/ai_template_policy_spec.rb`
- `apps/core/spec/policies/ai_invocation_policy_spec.rb`

**Pattern to follow:** See `apps/core/spec/requests/api/v1/courses_spec.rb` and `apps/core/spec/policies/course_policy_spec.rb`.

### Task 7: Create Admin AI Pages (Frontend)

**Create:** `apps/web/src/app/admin/ai/page.tsx` — AI Registry page
- List all `AiProviderConfig` records (GET `/api/v1/ai_provider_configs`)
- Show: display_name, provider_name, status badge, default_model, number of task policies
- Actions: Create new, activate/deactivate toggle, edit, delete
- Create/edit form: provider_name (dropdown: anthropic, openai), display_name, default_model, api_key (password field), available_models (comma-separated)

**Create:** `apps/web/src/app/admin/ai/policies/page.tsx` — AI Policies page
- List all `AiTaskPolicy` records (GET `/api/v1/ai_task_policies`)
- Show: task_type, linked provider, enabled/disabled, allowed_roles, max_tokens_limit
- Create/edit form: task_type (dropdown from VALID_TASK_TYPES), ai_provider_config_id (dropdown), enabled toggle, requires_approval toggle, allowed_roles (multi-select: admin, curriculum_lead, teacher), max_tokens_limit, temperature_limit, model_override
- Delete confirmation

**Create:** `apps/web/src/app/admin/ai/templates/page.tsx` — AI Templates page
- List all `AiTemplate` records (GET `/api/v1/ai_templates`)
- Show: name, task_type, status
- Create/edit form: name, task_type, status, system_prompt (textarea), user_prompt_template (textarea), variables (JSON editor or comma-separated)

**Update:** `apps/web/src/components/AppShell.tsx`
- Add "AI Settings" as a sub-item under "Admin" in the sidebar navigation, linking to `/admin/ai`

### Task 8: Create AI Assistant Panel Component

**Create:** `apps/web/src/components/AiAssistPanel.tsx`

This is a collapsible right-side panel that appears on planning screens (Unit Planner, Lesson Editor).

**Props:** `{ unitId?: number, lessonId?: number, context?: Record<string, string> }`

**UI:**
1. Task type selector (dropdown): Lesson Plan, Unit Plan, Differentiation, Assessment, Rewrite
2. Prompt text area (placeholder: "Describe what you'd like the AI to help with...")
3. "Generate" button
4. Loading spinner while waiting
5. Response display area (markdown rendered)
6. "Apply to Plan" button — copies the response text to clipboard or inserts into the parent form
7. Policy banner at top — shows which AI actions are available based on GET `/api/v1/ai_task_policies` (gray out disabled task types)
8. Error state if generation fails

**API calls:**
- On mount: GET `/api/v1/ai_task_policies` to determine which task types are enabled
- On generate: POST `/api/v1/ai_invocations` with `{ task_type, prompt, context: { unit_id, lesson_id, ...props.context } }`

**Integrate into existing pages:**
- `apps/web/src/app/plan/units/[id]/page.tsx` — add `<AiAssistPanel unitId={id} />` as a toggleable right panel
- `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` — add `<AiAssistPanel lessonId={lessonId} />`

---

## Architecture Rules

1. All models MUST include `TenantScoped`
2. All controller actions MUST call `authorize` or use `policy_scope`
3. API key in `AiProviderConfig` MUST use `encrypts :api_key` (Rails 8 encryption)
4. AI Gateway calls MUST go through `AiGatewayClient` service, never direct HTTP from frontend
5. Every AI generation MUST create an `AiInvocation` audit record
6. Frontend uses `apiFetch` from `apps/web/src/lib/api.ts`
7. Admin pages use `<ProtectedRoute>` and `<AppShell>`

---

## Testing

```bash
cd apps/core && bundle exec rspec spec/requests/api/v1/ai_provider_configs_spec.rb spec/requests/api/v1/ai_task_policies_spec.rb spec/requests/api/v1/ai_templates_spec.rb spec/requests/api/v1/ai_invocations_spec.rb
cd apps/web && npm run build
```

---

## Definition of Done

- [ ] 4 migration files exist and are conditional (idempotent)
- [ ] 4 model files with TenantScoped, validations, associations
- [ ] AiGatewayClient service can call the AI Gateway
- [ ] 4 Pundit policies with role-based access
- [ ] 4 controllers with CRUD + AI generation endpoint
- [ ] Routes registered in routes.rb
- [ ] Factories and request specs for all 4 resources
- [ ] Admin AI Registry page (list, create, edit, activate/deactivate)
- [ ] Admin AI Policies page (list, create, edit)
- [ ] Admin AI Templates page (list, create, edit)
- [ ] AI Assistant Panel component on Unit Planner and Lesson Editor
- [ ] AppShell sidebar updated with AI Settings link
- [ ] No lint errors
