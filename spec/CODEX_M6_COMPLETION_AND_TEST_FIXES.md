# Codex Instructions — M6 Completion, Faraday Dependency, and Test Fixes

## Objective

Three tasks remain to bring the platform to green:

1. **Add `gem "faraday"` to the Gemfile** — blocks both M6 (AiGatewayClient) and M7 (OneRosterClient) at runtime
2. **Complete M6 (AI Gateway)** — models exist but are incomplete; migrations, service, policies, controllers, routes, specs, and frontend are missing
3. **Fix 9 failing tests** — pre-existing bugs in approvals, modules, accommodations, grading, Google token, and classroom sync

---

## What Already Exists (DO NOT recreate)

### AI Models (exist but INCOMPLETE — must be replaced)
- `apps/core/app/models/ai_provider_config.rb` — missing VALID_STATUSES, VALID_PROVIDERS, `encrypts :api_key`, activate!/deactivate!, dependency strategy wrong
- `apps/core/app/models/ai_task_policy.rb` — missing VALID_TASK_TYPES, allowed_for_role?, numericality validations
- `apps/core/app/models/ai_template.rb` — missing VALID_STATUSES, VALID_TASK_TYPES, status inclusion
- `apps/core/app/models/ai_invocation.rb` — missing "running" in VALID_STATUSES, missing complete!/fail! methods

### AI Factories (exist but may need updates)
- `apps/core/spec/factories/ai_provider_configs.rb` — EXISTS (uses "fake" provider, which is fine for tests)
- `apps/core/spec/factories/ai_task_policies.rb` — EXISTS
- `apps/core/spec/factories/ai_invocations.rb` — EXISTS

### Admin AI page stub
- `apps/web/src/app/admin/ai/page.tsx` — EXISTS but is a placeholder with no functionality. Must be REPLACED.

### AppShell sidebar already includes "AI Settings" link pointing to `/admin/ai`

### Database tables — all 4 AI tables exist in schema.rb (see CODEX_M6_AI_GATEWAY.md for exact schema)

---

## Task 1: Add Faraday to Gemfile

**Modify:** `apps/core/Gemfile`

Add this line after the Google APIs gems (after line 29):

```ruby
# HTTP client for AI Gateway and OneRoster
gem "faraday"
```

Then run `bundle install`.

---

## Task 2: Create 4 AI Migrations

Create conditional migrations using the `create_table ... unless table_exists?` pattern.

**Create:** `apps/core/db/migrate/20260215000001_create_ai_provider_configs.rb`

```ruby
class CreateAiProviderConfigs < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_provider_configs)
      create_table :ai_provider_configs do |t|
        t.text :api_key
        t.jsonb :available_models, default: [], null: false
        t.bigint :created_by_id, null: false
        t.string :default_model, null: false
        t.string :display_name, null: false
        t.string :provider_name, null: false
        t.jsonb :settings, default: {}, null: false
        t.string :status, default: "inactive", null: false
        t.references :tenant, null: false, foreign_key: true
        t.timestamps
      end

      add_index :ai_provider_configs, [:tenant_id, :provider_name], unique: true
      add_index :ai_provider_configs, :created_by_id
      add_foreign_key :ai_provider_configs, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_provider_configs, if_exists: true
  end
end
```

**Create:** `apps/core/db/migrate/20260215000002_create_ai_task_policies.rb`

```ruby
class CreateAiTaskPolicies < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_task_policies)
      create_table :ai_task_policies do |t|
        t.bigint :ai_provider_config_id, null: false
        t.jsonb :allowed_roles, default: [], null: false
        t.bigint :created_by_id, null: false
        t.boolean :enabled, default: true, null: false
        t.integer :max_tokens_limit, default: 4096
        t.string :model_override
        t.boolean :requires_approval, default: false, null: false
        t.jsonb :settings, default: {}, null: false
        t.string :task_type, null: false
        t.float :temperature_limit, default: 1.0
        t.references :tenant, null: false, foreign_key: true
        t.timestamps
      end

      add_index :ai_task_policies, [:tenant_id, :task_type], unique: true
      add_index :ai_task_policies, :ai_provider_config_id
      add_index :ai_task_policies, :created_by_id
      add_foreign_key :ai_task_policies, :ai_provider_configs
      add_foreign_key :ai_task_policies, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_task_policies, if_exists: true
  end
end
```

**Create:** `apps/core/db/migrate/20260215000003_create_ai_templates.rb`

```ruby
class CreateAiTemplates < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_templates)
      create_table :ai_templates do |t|
        t.bigint :created_by_id, null: false
        t.string :name, null: false
        t.string :status, default: "draft"
        t.text :system_prompt, null: false
        t.string :task_type, null: false
        t.references :tenant, null: false, foreign_key: true
        t.text :user_prompt_template, null: false
        t.jsonb :variables, default: [], null: false
        t.timestamps
      end

      add_index :ai_templates, [:tenant_id, :task_type, :status]
      add_index :ai_templates, :created_by_id
      add_foreign_key :ai_templates, :users, column: :created_by_id
    end
  end

  def down
    drop_table :ai_templates, if_exists: true
  end
end
```

**Create:** `apps/core/db/migrate/20260215000004_create_ai_invocations.rb`

```ruby
class CreateAiInvocations < ActiveRecord::Migration[8.0]
  def up
    unless table_exists?(:ai_invocations)
      create_table :ai_invocations do |t|
        t.bigint :ai_provider_config_id, null: false
        t.bigint :ai_task_policy_id
        t.bigint :ai_template_id
        t.datetime :completed_at
        t.integer :completion_tokens
        t.jsonb :context, default: {}, null: false
        t.integer :duration_ms
        t.text :error_message
        t.string :input_hash
        t.string :model, null: false
        t.integer :prompt_tokens
        t.string :provider_name, null: false
        t.datetime :started_at
        t.string :status, default: "pending", null: false
        t.string :task_type, null: false
        t.references :tenant, null: false, foreign_key: true
        t.integer :total_tokens
        t.bigint :user_id, null: false
        t.timestamps
      end

      add_index :ai_invocations, :ai_provider_config_id
      add_index :ai_invocations, :ai_task_policy_id
      add_index :ai_invocations, :ai_template_id
      add_index :ai_invocations, [:tenant_id, :task_type, :created_at]
      add_index :ai_invocations, :user_id
      add_foreign_key :ai_invocations, :ai_provider_configs
      add_foreign_key :ai_invocations, :ai_task_policies
      add_foreign_key :ai_invocations, :ai_templates
      add_foreign_key :ai_invocations, :users
    end
  end

  def down
    drop_table :ai_invocations, if_exists: true
  end
end
```

---

## Task 3: Fix (Replace) the 4 AI Models

These files already exist but are incomplete. **Replace their entire contents.**

**Replace:** `apps/core/app/models/ai_provider_config.rb`
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

  encrypts :api_key

  def activate!
    update!(status: "active")
  end

  def deactivate!
    update!(status: "inactive")
  end
end
```

**Replace:** `apps/core/app/models/ai_task_policy.rb`
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

  def effective_model
    model_override.presence || ai_provider_config.default_model
  end
end
```

**Replace:** `apps/core/app/models/ai_template.rb`
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

**Replace:** `apps/core/app/models/ai_invocation.rb`
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

---

## Task 4: Create AI Gateway Client Service

**Create:** `apps/core/app/services/ai_gateway_client.rb`

```ruby
class AiGatewayClient
  BASE_URL = ENV.fetch("AI_GATEWAY_URL", "http://localhost:8000")
  SERVICE_TOKEN = ENV.fetch("AI_GATEWAY_SERVICE_TOKEN", "")

  class AiGatewayError < StandardError
    attr_reader :status_code, :response_body

    def initialize(message, status_code: nil, response_body: nil)
      @status_code = status_code
      @response_body = response_body
      super(message)
    end
  end

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
      }.compact
    end

    unless response.success?
      raise AiGatewayError.new(
        "AI Gateway error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    response.body
  end
end
```

---

## Task 5: Create 4 Pundit Policies

**Create:** `apps/core/app/policies/ai_provider_config_policy.rb`
```ruby
class AiProviderConfigPolicy < ApplicationPolicy
  def index?
    admin_user?
  end

  def show?
    admin_user?
  end

  def create?
    admin_user?
  end

  def update?
    admin_user?
  end

  def destroy?
    admin_user?
  end

  def activate?
    admin_user?
  end

  def deactivate?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.none
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
```

**Create:** `apps/core/app/policies/ai_task_policy_policy.rb`
```ruby
class AiTaskPolicyPolicy < ApplicationPolicy
  def index?
    admin_user?
  end

  def show?
    admin_user?
  end

  def create?
    admin_user?
  end

  def update?
    admin_user?
  end

  def destroy?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.none
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
```

**Create:** `apps/core/app/policies/ai_template_policy.rb`
```ruby
class AiTemplatePolicy < ApplicationPolicy
  def index?
    admin_user? || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def show?
    admin_user? || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
  end

  def create?
    admin_user?
  end

  def update?
    admin_user?
  end

  def destroy?
    admin_user?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin) || user.has_role?(:curriculum_lead)
        scope.all
      else
        scope.where(status: "active")
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
```

**Create:** `apps/core/app/policies/ai_invocation_policy.rb`
```ruby
class AiInvocationPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin_user? || record.user_id == user.id
  end

  def create?
    true
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.has_role?(:admin)
        scope.all
      else
        scope.where(user_id: user.id)
      end
    end
  end

  private

  def admin_user?
    user.has_role?(:admin)
  end
end
```

---

## Task 6: Create 4 Controllers

**Create:** `apps/core/app/controllers/api/v1/ai_provider_configs_controller.rb`
```ruby
module Api
  module V1
    class AiProviderConfigsController < ApplicationController
      before_action :set_config, only: [:show, :update, :destroy, :activate, :deactivate]

      def index
        configs = policy_scope(AiProviderConfig)
        configs = paginate(configs)
        render json: configs
      end

      def show
        authorize @config
        render json: @config
      end

      def create
        @config = AiProviderConfig.new(config_params)
        @config.tenant = Current.tenant
        @config.created_by = Current.user
        authorize @config
        if @config.save
          render json: @config, status: :created
        else
          render json: { errors: @config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @config
        if @config.update(config_params)
          render json: @config
        else
          render json: { errors: @config.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @config
        @config.destroy!
        head :no_content
      rescue ActiveRecord::DeleteRestrictionError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      def activate
        authorize @config
        @config.activate!
        render json: @config
      end

      def deactivate
        authorize @config
        @config.deactivate!
        render json: @config
      end

      private

      def set_config
        @config = AiProviderConfig.find(params[:id])
      end

      def config_params
        params.permit(:provider_name, :display_name, :default_model, :api_key, :status, available_models: [], settings: {})
      end
    end
  end
end
```

**Create:** `apps/core/app/controllers/api/v1/ai_task_policies_controller.rb`
```ruby
module Api
  module V1
    class AiTaskPoliciesController < ApplicationController
      before_action :set_policy, only: [:show, :update, :destroy]

      def index
        policies = policy_scope(AiTaskPolicy)
        policies = paginate(policies)
        render json: policies
      end

      def show
        authorize @ai_task_policy
        render json: @ai_task_policy
      end

      def create
        @ai_task_policy = AiTaskPolicy.new(policy_params)
        @ai_task_policy.tenant = Current.tenant
        @ai_task_policy.created_by = Current.user
        authorize @ai_task_policy
        if @ai_task_policy.save
          render json: @ai_task_policy, status: :created
        else
          render json: { errors: @ai_task_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @ai_task_policy
        if @ai_task_policy.update(policy_params)
          render json: @ai_task_policy
        else
          render json: { errors: @ai_task_policy.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @ai_task_policy
        @ai_task_policy.destroy!
        head :no_content
      end

      private

      def set_policy
        @ai_task_policy = AiTaskPolicy.find(params[:id])
      end

      def policy_params
        params.permit(:ai_provider_config_id, :task_type, :enabled, :max_tokens_limit,
                       :model_override, :requires_approval, :temperature_limit, allowed_roles: [], settings: {})
      end
    end
  end
end
```

**Create:** `apps/core/app/controllers/api/v1/ai_templates_controller.rb`
```ruby
module Api
  module V1
    class AiTemplatesController < ApplicationController
      before_action :set_template, only: [:show, :update, :destroy]

      def index
        templates = policy_scope(AiTemplate)
        templates = paginate(templates)
        render json: templates
      end

      def show
        authorize @template
        render json: @template
      end

      def create
        @template = AiTemplate.new(template_params)
        @template.tenant = Current.tenant
        @template.created_by = Current.user
        authorize @template
        if @template.save
          render json: @template, status: :created
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @template
        if @template.update(template_params)
          render json: @template
        else
          render json: { errors: @template.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @template
        @template.destroy!
        head :no_content
      end

      private

      def set_template
        @template = AiTemplate.find(params[:id])
      end

      def template_params
        params.permit(:name, :task_type, :system_prompt, :user_prompt_template, :status, variables: [])
      end
    end
  end
end
```

**Create:** `apps/core/app/controllers/api/v1/ai_invocations_controller.rb`
```ruby
module Api
  module V1
    class AiInvocationsController < ApplicationController
      def index
        invocations = policy_scope(AiInvocation).order(created_at: :desc)
        invocations = invocations.where(task_type: params[:task_type]) if params[:task_type].present?
        invocations = invocations.where(status: params[:status]) if params[:status].present?
        invocations = paginate(invocations)
        render json: invocations
      end

      def show
        @invocation = AiInvocation.find(params[:id])
        authorize @invocation
        render json: @invocation
      end

      def create
        task_policy = AiTaskPolicy.find_by!(task_type: params[:task_type])

        unless task_policy.enabled
          render json: { error: "AI task type '#{params[:task_type]}' is currently disabled" }, status: :forbidden
          return
        end

        user_roles = Current.user.roles.pluck(:name)
        unless user_roles.any? { |r| task_policy.allowed_for_role?(r) }
          render json: { error: "Your role is not authorized for this AI task type" }, status: :forbidden
          return
        end

        provider_config = task_policy.ai_provider_config
        model = task_policy.effective_model

        template = AiTemplate.find(params[:ai_template_id]) if params[:ai_template_id].present?

        system_prompt = template&.system_prompt || "You are a helpful K-12 education assistant."
        user_prompt = params[:prompt]

        messages = [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt }
        ]

        invocation = AiInvocation.new(
          tenant: Current.tenant,
          user: Current.user,
          ai_provider_config: provider_config,
          ai_task_policy: task_policy,
          ai_template: template,
          task_type: params[:task_type],
          provider_name: provider_config.provider_name,
          model: model,
          status: "pending",
          started_at: Time.current,
          context: params[:context] || {}
        )
        authorize invocation
        invocation.save!

        begin
          invocation.update!(status: "running")
          start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

          result = AiGatewayClient.generate(
            provider: provider_config.provider_name,
            model: model,
            messages: messages,
            task_type: params[:task_type],
            max_tokens: task_policy.max_tokens_limit || 4096,
            temperature: task_policy.temperature_limit || 0.7
          )

          duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).to_i
          usage = result["usage"] || {}

          invocation.complete!(
            tokens: {
              prompt: usage["prompt_tokens"],
              completion: usage["completion_tokens"],
              total: usage["total_tokens"]
            },
            duration: duration
          )

          render json: {
            id: invocation.id,
            content: result["content"],
            provider: result["provider"],
            model: result["model"],
            usage: usage,
            status: invocation.status
          }
        rescue => e
          invocation.fail!(e.message)
          render json: { error: "AI generation failed: #{e.message}" }, status: :bad_gateway
        end
      end
    end
  end
end
```

---

## Task 7: Add Routes

**Modify:** `apps/core/config/routes.rb`

Add these routes inside the `namespace :api do → namespace :v1 do` block, near the other resource routes:

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

---

## Task 8: Create Missing Factory and Specs

**Create:** `apps/core/spec/factories/ai_templates.rb`
```ruby
FactoryBot.define do
  factory :ai_template do
    association :tenant
    association :created_by, factory: :user
    sequence(:name) { |n| "Template #{n}" }
    task_type { "lesson_plan" }
    status { "active" }
    system_prompt { "You are a helpful K-12 education assistant." }
    user_prompt_template { "Generate a {task_type} for {subject} at {grade_level} level." }
    variables { ["task_type", "subject", "grade_level"] }
  end
end
```

**Create:** `apps/core/spec/requests/api/v1/ai_provider_configs_spec.rb`
```ruby
require "rails_helper"

RSpec.describe "Api::V1::AiProviderConfigs", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil; Current.user = nil }

  describe "GET /api/v1/ai_provider_configs" do
    it "lists configs for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_provider_configs"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "denies access for teacher" do
      mock_session(teacher, tenant: tenant)
      get "/api/v1/ai_provider_configs"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/ai_provider_configs" do
    it "creates a config as admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/ai_provider_configs", params: {
        provider_name: "anthropic",
        display_name: "Claude",
        default_model: "claude-sonnet-4-5-20250929",
        api_key: "sk-test-key"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["provider_name"]).to eq("anthropic")
    end
  end

  describe "POST /api/v1/ai_provider_configs/:id/activate" do
    it "activates a config" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      config = create(:ai_provider_config, tenant: tenant, created_by: admin, status: "inactive")
      Current.tenant = nil

      post "/api/v1/ai_provider_configs/#{config.id}/activate"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("active")
    end
  end
end
```

**Create:** `apps/core/spec/requests/api/v1/ai_task_policies_spec.rb`
```ruby
require "rails_helper"

RSpec.describe "Api::V1::AiTaskPolicies", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil; Current.user = nil }

  describe "GET /api/v1/ai_task_policies" do
    it "lists policies for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      Current.tenant = nil

      get "/api/v1/ai_task_policies"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "denies access for teacher" do
      mock_session(teacher, tenant: tenant)
      get "/api/v1/ai_task_policies"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "POST /api/v1/ai_task_policies" do
    it "creates a policy as admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      Current.tenant = nil

      post "/api/v1/ai_task_policies", params: {
        ai_provider_config_id: provider.id,
        task_type: "assessment",
        enabled: true,
        allowed_roles: ["teacher", "admin"],
        max_tokens_limit: 2048
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["task_type"]).to eq("assessment")
    end
  end
end
```

**Create:** `apps/core/spec/requests/api/v1/ai_templates_spec.rb`
```ruby
require "rails_helper"

RSpec.describe "Api::V1::AiTemplates", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil; Current.user = nil }

  describe "GET /api/v1/ai_templates" do
    it "lists templates for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin)
      Current.tenant = nil

      get "/api/v1/ai_templates"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "shows only active templates for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:ai_template, tenant: tenant, created_by: admin, status: "active")
      create(:ai_template, tenant: tenant, created_by: admin, status: "draft", name: "Draft Template")
      Current.tenant = nil

      get "/api/v1/ai_templates"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/ai_templates" do
    it "creates a template as admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/ai_templates", params: {
        name: "Lesson Helper",
        task_type: "lesson_plan",
        system_prompt: "You help teachers create lesson plans.",
        user_prompt_template: "Create a lesson plan for {subject}.",
        status: "draft"
      }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["name"]).to eq("Lesson Helper")
    end

    it "denies creation for teacher" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/ai_templates", params: {
        name: "Teacher Template",
        task_type: "lesson_plan",
        system_prompt: "test",
        user_prompt_template: "test"
      }
      expect(response).to have_http_status(:forbidden)
    end
  end
end
```

**Create:** `apps/core/spec/requests/api/v1/ai_invocations_spec.rb`
```ruby
require "rails_helper"

RSpec.describe "Api::V1::AiInvocations", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil; Current.user = nil }

  describe "GET /api/v1/ai_invocations" do
    it "lists own invocations for teacher" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy_record = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: policy_record)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider, ai_task_policy: policy_record)
      Current.tenant = nil

      get "/api/v1/ai_invocations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "lists all invocations for admin" do
      mock_session(admin, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      policy_record = create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider)
      create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: policy_record)
      create(:ai_invocation, tenant: tenant, user: admin, ai_provider_config: provider, ai_task_policy: policy_record)
      Current.tenant = nil

      get "/api/v1/ai_invocations"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(2)
    end
  end

  describe "POST /api/v1/ai_invocations" do
    it "creates an invocation and calls AI Gateway" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin, provider_name: "anthropic", default_model: "claude-sonnet-4-5-20250929")
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider, task_type: "lesson_plan", enabled: true, allowed_roles: ["teacher"])
      Current.tenant = nil

      fake_response = instance_double(Faraday::Response, status: 200, body: {
        "content" => "Here is your lesson plan...",
        "provider" => "anthropic",
        "model" => "claude-sonnet-4-5-20250929",
        "usage" => { "prompt_tokens" => 100, "completion_tokens" => 200, "total_tokens" => 300 }
      }, success?: true)
      allow_any_instance_of(Faraday::Connection).to receive(:post).and_return(fake_response)

      expect {
        post "/api/v1/ai_invocations", params: {
          task_type: "lesson_plan",
          prompt: "Create a math lesson for 5th grade",
          context: { grade: "5", subject: "math" }
        }
      }.to change(AiInvocation.unscoped, :count).by(1)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["content"]).to include("lesson plan")
      expect(AiInvocation.unscoped.order(:id).last.status).to eq("completed")
    end

    it "returns forbidden when task type is disabled" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      provider = create(:ai_provider_config, tenant: tenant, created_by: admin)
      create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider, task_type: "lesson_plan", enabled: false)
      Current.tenant = nil

      post "/api/v1/ai_invocations", params: { task_type: "lesson_plan", prompt: "test" }
      expect(response).to have_http_status(:forbidden)
    end
  end
end
```

**Create:** `apps/core/spec/policies/ai_provider_config_policy_spec.rb`
```ruby
require "rails_helper"

RSpec.describe AiProviderConfigPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy?, :activate?, :deactivate? do
    let(:admin) { user = create(:user, tenant: tenant); user.add_role(:admin); user }
    let(:teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
    let(:record) { create(:ai_provider_config, tenant: tenant, created_by: admin) }

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end
end
```

**Create:** `apps/core/spec/policies/ai_task_policy_policy_spec.rb`
```ruby
require "rails_helper"

RSpec.describe AiTaskPolicyPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index?, :show?, :create?, :update?, :destroy? do
    let(:admin) { user = create(:user, tenant: tenant); user.add_role(:admin); user }
    let(:teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
    let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin) }
    let(:record) { create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider) }

    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies non-admin users" do
      expect(policy).not_to permit(teacher, record)
    end
  end
end
```

**Create:** `apps/core/spec/policies/ai_template_policy_spec.rb`
```ruby
require "rails_helper"

RSpec.describe AiTemplatePolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:admin) { user = create(:user, tenant: tenant); user.add_role(:admin); user }
  let(:teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
  let(:record) { create(:ai_template, tenant: tenant, created_by: admin) }

  permissions :index?, :show? do
    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "permits teachers" do
      expect(policy).to permit(teacher, record)
    end
  end

  permissions :create?, :update?, :destroy? do
    it "permits admins" do
      expect(policy).to permit(admin, record)
    end

    it "denies teachers" do
      expect(policy).not_to permit(teacher, record)
    end
  end

  describe "Scope" do
    let!(:active_template) { create(:ai_template, tenant: tenant, created_by: admin, status: "active") }
    let!(:draft_template) { create(:ai_template, tenant: tenant, created_by: admin, status: "draft", name: "Draft") }

    it "returns all for admin" do
      scope = AiTemplatePolicy::Scope.new(admin, AiTemplate).resolve
      expect(scope).to include(active_template, draft_template)
    end

    it "returns only active for teacher" do
      scope = AiTemplatePolicy::Scope.new(teacher, AiTemplate).resolve
      expect(scope).to include(active_template)
      expect(scope).not_to include(draft_template)
    end
  end
end
```

**Create:** `apps/core/spec/policies/ai_invocation_policy_spec.rb`
```ruby
require "rails_helper"

RSpec.describe AiInvocationPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  let(:admin) { user = create(:user, tenant: tenant); user.add_role(:admin); user }
  let(:teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
  let(:other_teacher) { user = create(:user, tenant: tenant); user.add_role(:teacher); user }
  let(:provider) { create(:ai_provider_config, tenant: tenant, created_by: admin) }
  let(:task_policy_record) { create(:ai_task_policy, tenant: tenant, created_by: admin, ai_provider_config: provider) }
  let(:record) { create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }

  permissions :show? do
    it "permits the owning user" do
      expect(policy).to permit(teacher, record)
    end

    it "permits admin" do
      expect(policy).to permit(admin, record)
    end

    it "denies other users" do
      expect(policy).not_to permit(other_teacher, record)
    end
  end

  describe "Scope" do
    let!(:own_invocation) { create(:ai_invocation, tenant: tenant, user: teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }
    let!(:other_invocation) { create(:ai_invocation, tenant: tenant, user: other_teacher, ai_provider_config: provider, ai_task_policy: task_policy_record) }

    it "returns all for admin" do
      scope = AiInvocationPolicy::Scope.new(admin, AiInvocation).resolve
      expect(scope).to include(own_invocation, other_invocation)
    end

    it "returns only own for teacher" do
      scope = AiInvocationPolicy::Scope.new(teacher, AiInvocation).resolve
      expect(scope).to include(own_invocation)
      expect(scope).not_to include(other_invocation)
    end
  end
end
```

---

## Task 9: Create Admin AI Frontend Pages

**Replace:** `apps/web/src/app/admin/ai/page.tsx` — AI Provider Config management

This page should:
- List all AiProviderConfig records (GET `/api/v1/ai_provider_configs`)
- Show: display_name, provider_name, status badge, default_model
- Create/edit form: provider_name (dropdown: anthropic, openai), display_name, default_model, api_key (password field)
- Activate/deactivate toggle
- Delete button with confirmation
- Links to "AI Policies" (`/admin/ai/policies`) and "AI Templates" (`/admin/ai/templates`)
- Use `<ProtectedRoute>`, `<AppShell>`, `apiFetch`

**Create:** `apps/web/src/app/admin/ai/policies/page.tsx` — AI Task Policy management

This page should:
- List all AiTaskPolicy records (GET `/api/v1/ai_task_policies`)
- Show: task_type, linked provider name, enabled/disabled, allowed_roles badges, max_tokens_limit
- Create/edit form: task_type dropdown (lesson_plan, unit_plan, differentiation, assessment, rewrite), ai_provider_config_id dropdown, enabled toggle, requires_approval toggle, allowed_roles multi-select (admin, curriculum_lead, teacher), max_tokens_limit, temperature_limit, model_override
- Delete confirmation
- Use `<ProtectedRoute>`, `<AppShell>`, `apiFetch`

**Create:** `apps/web/src/app/admin/ai/templates/page.tsx` — AI Template management

This page should:
- List all AiTemplate records (GET `/api/v1/ai_templates`)
- Show: name, task_type, status badge
- Create/edit form: name, task_type dropdown, status dropdown (draft, active, archived), system_prompt textarea, user_prompt_template textarea, variables comma-separated input
- Delete confirmation
- Use `<ProtectedRoute>`, `<AppShell>`, `apiFetch`

---

## Task 10: Create AI Assistant Panel Component

**Create:** `apps/web/src/components/AiAssistantPanel.tsx`

Props: `{ unitId?: number, lessonId?: number, context?: Record<string, string> }`

UI:
1. Task type selector (dropdown): lesson_plan, unit_plan, differentiation, assessment, rewrite
2. Prompt textarea (placeholder: "Describe what you'd like the AI to help with...")
3. "Generate" button
4. Loading spinner while waiting
5. Response display area (rendered as markdown or preformatted text)
6. "Copy to Clipboard" button
7. Policy banner: on mount, GET `/api/v1/ai_task_policies` to determine which task types are enabled. Gray out disabled types.
8. Error state if generation fails

API calls:
- On mount: `GET /api/v1/ai_task_policies` (may return 403 for non-admin, in which case show all types as available since the create endpoint does its own auth)
- On generate: `POST /api/v1/ai_invocations` with `{ task_type, prompt, context: { unit_id, lesson_id, ...props.context } }`

Integrate into existing pages by adding a toggleable panel:
- `apps/web/src/app/plan/units/[id]/page.tsx` — add `<AiAssistantPanel unitId={id} />`
- `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx` — add `<AiAssistantPanel lessonId={lessonId} />`

Use `apiFetch` from `apps/web/src/lib/api.ts`. Wrap in a collapsible section or slide-over panel.

---

## Task 11: Fix 9 Failing Tests

### Fix 1: ClassroomCourseSyncJob error handling (spec/jobs/classroom_course_sync_job_spec.rb:79)

**Problem:** The test stubs `AcademicYear.first` to return nil, expecting the course creation to fail and increment `records_failed`. But the job code calls `AcademicYear.order(start_date: :desc).first`, not `AcademicYear.first`, so the stub never fires and the course creation succeeds with a nil academic_year (or the error is different).

**Fix:** In `apps/core/app/jobs/classroom_course_sync_job.rb`, change line 38 from:
```ruby
academic_year = AcademicYear.order(start_date: :desc).first
```
to:
```ruby
academic_year = AcademicYear.order(start_date: :desc).first
raise "No academic year available for course creation" unless academic_year
```

This ensures that when no academic year exists, the individual course processing raises an error that gets caught by the `rescue` block on line 59 and increments `records_failed`.

### Fix 2: Approvals list/filter (spec/requests/api/v1/approvals_spec.rb:113 and :129)

**Problem:** The test creates two Approval records for the same unit_plan — one "pending" and one "approved". But `Approval#no_duplicate_pending` (line 31-33 in approval.rb) prevents creating ANY new approval when a "pending" one already exists, regardless of the new record's status. The first `create` makes a "pending" one, then the second `create` (with `status: "approved"`) fails because a pending approval already exists.

**Fix:** In `apps/core/app/models/approval.rb`, change the `no_duplicate_pending` validation to only check when the new record itself is pending:

```ruby
def no_duplicate_pending
  return unless status == "pending"
  if Approval.where(approvable: approvable, status: "pending").exists?
    errors.add(:base, "A pending approval already exists for this item")
  end
end
```

### Fix 3: CourseModules DELETE returns 204 instead of 403 (spec/requests/api/v1/course_modules_spec.rb:87)

**Problem:** The test expects a teacher to get 403 on DELETE, but `CourseModulePolicy#destroy?` (line 18) allows teachers: `user.has_role?(:admin) || user.has_role?(:teacher)`.

**Fix:** In `apps/core/app/policies/course_module_policy.rb`, change `destroy?` to admin-only:

```ruby
def destroy?
  user.has_role?(:admin)
end
```

### Fix 4: QuizAccommodations — student gets 403 on POST /quizzes/:id/attempts (spec/requests/api/v1/quiz_accommodations_spec.rb:110 and :122)

**Problem:** The test creates a student and a quiz, creates an accommodation, then POSTs to create an attempt. The `QuizAttemptPolicy#create?` method (line 14) checks `enrolled_student_in_course?(record.quiz.course_id)` — but the test never creates an Enrollment for the student in the quiz's course. Without enrollment, the policy denies access.

**Fix:** In `apps/core/spec/requests/api/v1/quiz_accommodations_spec.rb`, add enrollment setup. After the `quiz` let block (around line 30), add a shared setup block. The test at lines 109-131 needs the student to be enrolled. Add a `before` block inside the "accommodation effects" describe:

In the `describe "accommodation effects"` block (line 109), add this before hook:
```ruby
before do
  Current.tenant = tenant
  ay = create(:academic_year, tenant: tenant)
  term = create(:term, tenant: tenant, academic_year: ay)
  section = create(:section, tenant: tenant, course: course, term: term)
  create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
  Current.tenant = nil
end
```

**Note:** The `course` let block (line 19-23) doesn't create an academic_year, but Course requires one. Check if the factory handles this — if not, the `course` let block may also need to create an academic_year first. Ensure the course has an academic year.

### Fix 5: SubmissionGrading gradebook returns 403 (spec/requests/api/v1/submission_grading_spec.rb:107)

**Problem:** The test calls `GET /api/v1/courses/:id/gradebook` as a teacher. The gradebook controller (line 6) does `authorize @course, :show?`. The `CoursePolicy#show?` checks if the user is admin OR enrolled in the course. The teacher in this test is NOT enrolled in the course — they just created the assignment but have no Enrollment record.

**Fix:** In `apps/core/spec/requests/api/v1/submission_grading_spec.rb`, add a teacher enrollment in the gradebook test. Inside the "returns gradebook for course" test (line 107), after creating the section and student enrollment (lines 110-112), add:

```ruby
create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
```

So lines 110-113 become:
```ruby
term = create(:term, tenant: tenant, academic_year: academic_year)
section = create(:section, tenant: tenant, course: course, term: term)
create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher")
create(:enrollment, tenant: tenant, section: section, user: student, role: "student")
```

### Fix 6: GoogleTokenService refresh tests (spec/services/google_token_service_spec.rb:47 and :65)

**Problem:** The `refresh!` method (google_token_service.rb line 46) has `return if valid_token?` inside `with_lock`. Since the test user has `google_token_expires_at: 1.hour.from_now`, `valid_token?` returns true (token expires in 1 hour, which is > 5 minutes from now), so `refresh!` returns early without actually refreshing.

**Fix:** In `apps/core/spec/services/google_token_service_spec.rb`, update the test user's `google_token_expires_at` so the token is about to expire (within the 5-minute threshold). Change line 12:

From:
```ruby
google_token_expires_at: 1.hour.from_now)
```

To:
```ruby
google_token_expires_at: 2.minutes.from_now)
```

This makes `valid_token?` return false (since 2 minutes < 5 minutes threshold), allowing `refresh!` to proceed. This fix applies to both the "refreshes the token" test (line 47) and the "raises an error" test (line 65), since both use the same `user` let block.

---

## Architecture Rules

1. All models MUST include `TenantScoped`
2. All controller actions MUST call `authorize` or use `policy_scope`
3. API key in `AiProviderConfig` MUST use `encrypts :api_key` (Rails 8 encryption)
4. AI Gateway calls MUST go through `AiGatewayClient` service
5. Every AI generation MUST create an `AiInvocation` audit record
6. Frontend uses `apiFetch` from `apps/web/src/lib/api.ts`
7. Admin pages use `<ProtectedRoute>` and `<AppShell>`

---

## Testing

After completing all tasks, verify:

```bash
cd apps/core && bundle install && bundle exec rspec --format progress
cd apps/web && npm run build
```

All 605+ examples should pass with 0 failures. The Next.js build should complete successfully.

---

## Definition of Done

- [ ] `gem "faraday"` added to Gemfile and bundle installed
- [ ] 4 migration files (conditional, idempotent)
- [ ] 4 model files complete with constants, validations, methods, encryption
- [ ] AiGatewayClient service created
- [ ] 4 Pundit policies with role-based access
- [ ] 4 controllers with CRUD + AI generation endpoint
- [ ] Routes registered in routes.rb
- [ ] ai_templates factory created
- [ ] 4 request specs + 4 policy specs
- [ ] Admin AI page replaced with full provider config UI
- [ ] Admin AI Policies page created
- [ ] Admin AI Templates page created
- [ ] AiAssistantPanel component created and integrated into unit/lesson pages
- [ ] All 9 previously failing tests now pass
- [ ] Full test suite green (0 failures)
- [ ] Next.js build succeeds
