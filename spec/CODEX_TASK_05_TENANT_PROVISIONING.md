# CODEX_TASK_05 — Tenant Provisioning (Backend Only)

**Priority:** P1
**Effort:** 6–8 hours
**Depends On:** Task 01 (Security Audit), Task 03 (Backup/Restore)
**Branch:** `batch7/05-tenant-provisioning`

---

## Objective

Automate school onboarding: create tenant, school, roles, permissions, admin user, academic year, AI policies, and standard frameworks in a single transaction. Provide bulk creation for districts, CSV/OneRoster data import, and an onboarding checklist API.

---

## Tasks

### 1. Create TenantProvisioningService

**File: `apps/core/app/services/tenant_provisioning_service.rb`**

```ruby
class TenantProvisioningService
  DEFAULT_ROLES = %w[admin teacher student curriculum_lead guardian].freeze
  DEFAULT_PERMISSIONS = {
    "admin" => { "all" => %w[read create update delete publish approve manage] },
    "teacher" => {
      "unit_plans" => %w[read create update delete publish],
      "lesson_plans" => %w[read create update delete],
      "courses" => %w[read],
      "assignments" => %w[read create update delete publish],
      "submissions" => %w[read update],
      "quizzes" => %w[read create update delete publish],
      "discussions" => %w[read create update],
      "resources" => %w[read create update delete],
      "portfolios" => %w[read],
    },
    "student" => {
      "courses" => %w[read],
      "assignments" => %w[read],
      "submissions" => %w[read create],
      "quizzes" => %w[read],
      "discussions" => %w[read create],
      "resources" => %w[read],
      "portfolios" => %w[read create update],
    },
    "curriculum_lead" => {
      "unit_plans" => %w[read create update delete publish approve],
      "templates" => %w[read create update delete publish],
      "standards" => %w[read create update],
      "approvals" => %w[read update],
    },
    "guardian" => {
      "portfolios" => %w[read],
      "submissions" => %w[read],
    },
  }.freeze

  class ProvisioningError < StandardError; end

  def initialize(params)
    @params = params.to_h.with_indifferent_access
  end

  def call
    validate_params!

    ActiveRecord::Base.transaction do
      @tenant = create_tenant
      @school = create_school
      @roles = create_roles
      create_permissions
      @admin = create_admin_user
      @academic_year = create_academic_year
      create_default_ai_policies
      create_default_standard_frameworks

      {
        tenant: @tenant,
        school: @school,
        admin: @admin,
        academic_year: @academic_year,
        roles: @roles.values.map(&:name),
        setup_token: generate_setup_token(@admin),
      }
    end
  end

  private

  def validate_params!
    required = %i[school_name subdomain admin_email]
    missing = required.select { |key| @params[key].blank? }
    raise ProvisioningError, "Missing required fields: #{missing.join(', ')}" if missing.any?

    if Tenant.unscoped.exists?(slug: @params[:subdomain])
      raise ProvisioningError, "Subdomain '#{@params[:subdomain]}' is already taken"
    end

    if User.unscoped.exists?(email: @params[:admin_email])
      raise ProvisioningError, "Email '#{@params[:admin_email]}' is already registered"
    end
  end

  def create_tenant
    Tenant.create!(
      name: @params[:school_name],
      slug: @params[:subdomain],
      settings: {
        "branding" => {
          "logo_url" => @params[:logo_url],
          "primary_color" => @params[:primary_color] || "#1e40af",
          "school_name" => @params[:school_name],
        },
        "features" => {
          "ai_enabled" => @params[:ai_enabled] != false,
          "google_integration" => @params[:google_enabled] != false,
          "portfolio_enabled" => true,
          "guardian_portal_enabled" => true,
        },
        "ai_safety_level" => @params[:safety_level] || "strict",
      }
    )
  end

  def create_school
    Current.tenant = @tenant
    School.create!(
      tenant: @tenant,
      name: @params[:school_name],
      timezone: @params[:timezone] || "America/New_York"
    )
  end

  def create_roles
    Current.tenant = @tenant
    DEFAULT_ROLES.each_with_object({}) do |role_name, hash|
      hash[role_name] = Role.create!(tenant: @tenant, name: role_name)
    end
  end

  def create_permissions
    DEFAULT_PERMISSIONS.each do |role_name, resources|
      role = @roles[role_name]
      next unless role

      resources.each do |resource, actions|
        actions.each do |action|
          Permission.create!(
            tenant: @tenant,
            role: role,
            resource: resource,
            action: action
          )
        end
      end
    end
  end

  def create_admin_user
    Current.tenant = @tenant
    user = User.create!(
      email: @params[:admin_email],
      first_name: @params[:admin_first_name] || "Admin",
      last_name: @params[:admin_last_name] || @params[:school_name],
      tenant: @tenant
    )
    user.add_role(:admin)
    user
  end

  def create_academic_year
    Current.tenant = @tenant
    current_year = Date.current.year
    start_month = @params[:academic_year_start_month] || 8  # August

    start_date = Date.new(current_year, start_month, 1)
    start_date -= 1.year if Date.current.month < start_month

    AcademicYear.create!(
      tenant: @tenant,
      name: "#{start_date.year}-#{start_date.year + 1}",
      start_date: start_date,
      end_date: start_date + 1.year - 1.day,
      status: "active"
    )
  end

  def create_default_ai_policies
    Current.tenant = @tenant
    default_tasks = %w[lesson_plan unit_plan differentiation assessment rewrite]
    default_tasks.each do |task|
      AiTaskPolicy.create!(
        tenant: @tenant,
        task_type: task,
        enabled: true,
        require_review: true
      )
    end
  end

  def create_default_standard_frameworks
    Current.tenant = @tenant
    # Create placeholder frameworks — schools will import real data later
    %w[Common\ Core NGSS C3\ Framework].each do |name|
      StandardFramework.find_or_create_by!(tenant: @tenant, name: name) do |fw|
        fw.description = "#{name} standards framework"
        fw.status = "active"
      end
    end
  rescue ActiveRecord::RecordInvalid
    # StandardFramework model may not exist yet — skip silently
    Rails.logger.info("[Provisioning] StandardFramework not available, skipping")
  end

  def generate_setup_token(user)
    # Simple signed token for first-time setup URL
    payload = { user_id: user.id, tenant_id: @tenant.id, exp: 48.hours.from_now.to_i }
    JWT.encode(payload, Rails.application.secret_key_base, "HS256")
  end
end
```

### 2. Create OnboardingChecklistService

**File: `apps/core/app/services/onboarding_checklist_service.rb`**

```ruby
class OnboardingChecklistService
  def initialize(tenant)
    @tenant = tenant
  end

  def call
    items = checklist_items
    completed = items.count { |i| i[:done] }

    {
      tenant_id: @tenant.id,
      school_name: @tenant.name,
      completion_percentage: items.empty? ? 0 : ((completed.to_f / items.size) * 100).round(0),
      completed_count: completed,
      total_count: items.size,
      items: items,
    }
  end

  private

  def checklist_items
    Current.tenant = @tenant
    [
      { key: "admin_created", label: "Admin account created", done: admin_exists?, required: true },
      { key: "school_configured", label: "School settings configured", done: school_configured?, required: true },
      { key: "academic_year", label: "Academic year and terms set up", done: academic_year_exists?, required: true },
      { key: "teachers_added", label: "At least one teacher added", done: teachers_exist?, required: true },
      { key: "students_added", label: "Students enrolled", done: students_exist?, required: false },
      { key: "course_created", label: "At least one course created", done: courses_exist?, required: false },
      { key: "standards_imported", label: "Standards framework imported", done: standards_exist?, required: false },
      { key: "google_configured", label: "Google integration configured", done: google_configured?, required: false },
      { key: "ai_configured", label: "AI policies configured", done: ai_configured?, required: true },
      { key: "branding_set", label: "School branding customized", done: branding_set?, required: false },
    ]
  ensure
    Current.tenant = nil
  end

  def admin_exists?
    User.joins(:roles).where(roles: { name: "admin" }).exists?
  end

  def school_configured?
    @tenant.schools.exists?
  end

  def academic_year_exists?
    AcademicYear.where(tenant: @tenant).exists?
  end

  def teachers_exist?
    User.joins(:roles).where(roles: { name: "teacher" }).exists?
  end

  def students_exist?
    User.joins(:roles).where(roles: { name: "student" }).exists?
  end

  def courses_exist?
    Course.exists?
  end

  def standards_exist?
    # Check if any standards or standard frameworks exist
    Standard.exists?
  rescue NameError
    false  # Standard model may not exist
  end

  def google_configured?
    @tenant.settings.dig("features", "google_integration") == true
  end

  def ai_configured?
    AiTaskPolicy.exists?
  end

  def branding_set?
    branding = @tenant.settings["branding"]
    branding.present? && branding["logo_url"].present?
  end
end
```

### 3. Create DataImportService

**File: `apps/core/app/services/data_import_service.rb`**

```ruby
require "csv"

class DataImportService
  class ImportError < StandardError; end

  VALID_IMPORT_TYPES = %w[users courses enrollments].freeze

  def initialize(tenant, import_type:, csv_content:, imported_by:)
    @tenant = tenant
    @import_type = import_type
    @csv_content = csv_content
    @imported_by = imported_by
    @results = { created: 0, updated: 0, skipped: 0, errors: [] }
  end

  def call
    validate_import_type!
    Current.tenant = @tenant

    rows = CSV.parse(@csv_content, headers: true, liberal_parsing: true)

    case @import_type
    when "users" then import_users(rows)
    when "courses" then import_courses(rows)
    when "enrollments" then import_enrollments(rows)
    end

    @results
  ensure
    Current.tenant = nil
  end

  private

  def validate_import_type!
    unless VALID_IMPORT_TYPES.include?(@import_type)
      raise ImportError, "Invalid import type: #{@import_type}. Valid types: #{VALID_IMPORT_TYPES.join(', ')}"
    end
  end

  def import_users(rows)
    rows.each_with_index do |row, index|
      email = row["email"]&.strip
      unless email.present? && email.match?(URI::MailTo::EMAIL_REGEXP)
        @results[:errors] << { row: index + 2, error: "Invalid or missing email" }
        next
      end

      role_name = row["role"]&.strip&.downcase || "student"
      unless Role::VALID_ROLES.include?(role_name)
        @results[:errors] << { row: index + 2, error: "Invalid role: #{role_name}" }
        next
      end

      user = User.find_by(email: email, tenant: @tenant)
      if user
        user.update(
          first_name: row["first_name"]&.strip || user.first_name,
          last_name: row["last_name"]&.strip || user.last_name
        )
        user.add_role(role_name) unless user.has_role?(role_name.to_sym)
        @results[:updated] += 1
      else
        user = User.create!(
          email: email,
          first_name: row["first_name"]&.strip || "Imported",
          last_name: row["last_name"]&.strip || "User",
          tenant: @tenant
        )
        user.add_role(role_name)
        @results[:created] += 1
      end
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end

  def import_courses(rows)
    academic_year = AcademicYear.where(tenant: @tenant).order(start_date: :desc).first
    unless academic_year
      @results[:errors] << { row: 0, error: "No academic year found for tenant. Create one first." }
      return
    end

    rows.each_with_index do |row, index|
      name = row["name"]&.strip
      unless name.present?
        @results[:errors] << { row: index + 2, error: "Missing course name" }
        next
      end

      course = Course.find_by(name: name, academic_year: academic_year, tenant: @tenant)
      if course
        course.update(description: row["description"]&.strip) if row["description"].present?
        @results[:updated] += 1
      else
        Course.create!(
          name: name,
          description: row["description"]&.strip,
          academic_year: academic_year,
          tenant: @tenant
        )
        @results[:created] += 1
      end

      # Create section if section_name provided
      if row["section_name"].present? && !course.nil?
        target = course || Course.find_by(name: name, academic_year: academic_year, tenant: @tenant)
        Section.find_or_create_by!(
          course: target,
          name: row["section_name"].strip,
          tenant: @tenant
        )
      end
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end

  def import_enrollments(rows)
    rows.each_with_index do |row, index|
      email = row["email"]&.strip
      course_name = row["course_name"]&.strip
      section_name = row["section_name"]&.strip

      user = User.find_by(email: email, tenant: @tenant)
      unless user
        @results[:errors] << { row: index + 2, error: "User not found: #{email}" }
        next
      end

      course = Course.find_by(name: course_name, tenant: @tenant)
      unless course
        @results[:errors] << { row: index + 2, error: "Course not found: #{course_name}" }
        next
      end

      section = if section_name.present?
        course.sections.find_by(name: section_name)
      else
        course.sections.first || course.sections.create!(name: "Default", tenant: @tenant)
      end

      unless section
        @results[:errors] << { row: index + 2, error: "Section not found: #{section_name}" }
        next
      end

      existing = Enrollment.find_by(user: user, section: section, tenant: @tenant)
      if existing
        @results[:skipped] += 1
      else
        role_name = row["role"]&.strip&.downcase || "student"
        Enrollment.create!(
          user: user,
          section: section,
          role: role_name,
          tenant: @tenant
        )
        @results[:created] += 1
      end
    rescue ActiveRecord::RecordInvalid => e
      @results[:errors] << { row: index + 2, error: e.message }
    end
  end
end
```

### 4. Create Provisioning API Controller

**File: `apps/core/app/controllers/api/v1/admin/provisioning_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class ProvisioningController < ApplicationController
        skip_before_action :authenticate_user!, only: []  # All actions require auth
        before_action :authorize_super_admin

        # POST /api/v1/admin/provisioning/create_school
        def create_school
          result = TenantProvisioningService.new(provision_params).call

          render json: {
            tenant_id: result[:tenant].id,
            tenant_slug: result[:tenant].slug,
            school_id: result[:school].id,
            admin_email: result[:admin].email,
            roles: result[:roles],
            setup_token: result[:setup_token],
          }, status: :created

        rescue TenantProvisioningService::ProvisioningError => e
          render json: { error: e.message }, status: :unprocessable_content
        end

        # POST /api/v1/admin/provisioning/bulk_create
        def bulk_create
          results = []

          params[:schools].each do |school_params|
            begin
              permitted = school_params.permit(
                :school_name, :subdomain, :admin_email, :admin_first_name,
                :admin_last_name, :timezone, :logo_url, :primary_color,
                :ai_enabled, :google_enabled, :safety_level
              )
              result = TenantProvisioningService.new(permitted).call
              results << {
                school_name: school_params[:school_name],
                tenant_id: result[:tenant].id,
                admin_email: result[:admin].email,
                status: "created",
              }
            rescue => e
              results << {
                school_name: school_params[:school_name],
                status: "failed",
                error: e.message,
              }
            end
          end

          render json: {
            total: results.size,
            created: results.count { |r| r[:status] == "created" },
            failed: results.count { |r| r[:status] == "failed" },
            results: results,
          }
        end

        # GET /api/v1/admin/provisioning/checklist/:tenant_id
        def checklist
          tenant = Tenant.unscoped.find(params[:tenant_id])
          render json: OnboardingChecklistService.new(tenant).call
        end

        # GET /api/v1/admin/provisioning/tenants
        def tenants
          tenants = Tenant.unscoped.order(:name).map do |t|
            checklist = OnboardingChecklistService.new(t).call
            {
              id: t.id,
              name: t.name,
              slug: t.slug,
              created_at: t.created_at,
              users_count: t.try(:users_count) || 0,
              courses_count: t.try(:courses_count) || 0,
              onboarding_percentage: checklist[:completion_percentage],
            }
          end
          render json: tenants
        end

        # POST /api/v1/admin/provisioning/import/:tenant_id
        def import
          tenant = Tenant.unscoped.find(params[:tenant_id])

          unless params[:csv_file].present? || params[:csv_content].present?
            render json: { error: "csv_file or csv_content is required" }, status: :bad_request
            return
          end

          csv_content = if params[:csv_file].respond_to?(:read)
            params[:csv_file].read
          else
            params[:csv_content]
          end

          result = DataImportService.new(
            tenant,
            import_type: params[:import_type],
            csv_content: csv_content,
            imported_by: Current.user
          ).call

          render json: result
        rescue DataImportService::ImportError => e
          render json: { error: e.message }, status: :bad_request
        end

        private

        def authorize_super_admin
          unless Current.user&.has_role?(:admin) || Current.user&.district_admin?
            head :forbidden
          end
        end

        def provision_params
          params.require(:school).permit(
            :school_name, :subdomain, :admin_email, :admin_first_name,
            :admin_last_name, :timezone, :logo_url, :primary_color,
            :ai_enabled, :google_enabled, :safety_level, :academic_year_start_month
          )
        end
      end
    end
  end
end
```

### 5. Create Branding Controller

**File: `apps/core/app/controllers/api/v1/admin/branding_controller.rb`**

```ruby
module Api
  module V1
    module Admin
      class BrandingController < ApplicationController
        before_action :authorize_admin

        # GET /api/v1/admin/branding
        def show
          authorize :branding, :view?
          render json: {
            school_name: Current.tenant.settings.dig("branding", "school_name") || Current.tenant.name,
            logo_url: Current.tenant.settings.dig("branding", "logo_url"),
            primary_color: Current.tenant.settings.dig("branding", "primary_color") || "#1e40af",
            favicon_url: Current.tenant.settings.dig("branding", "favicon_url"),
          }
        end

        # PUT /api/v1/admin/branding
        def update
          authorize :branding, :manage?

          Current.tenant.settings["branding"] ||= {}
          branding = Current.tenant.settings["branding"]

          branding["school_name"] = params[:school_name] if params[:school_name].present?
          branding["primary_color"] = params[:primary_color] if params[:primary_color].present?
          branding["logo_url"] = params[:logo_url] if params[:logo_url].present?
          branding["favicon_url"] = params[:favicon_url] if params[:favicon_url].present?

          if Current.tenant.save
            render json: branding
          else
            render json: { errors: Current.tenant.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end
      end
    end
  end
end
```

### 6. Create Policies

**File: `apps/core/app/policies/branding_policy.rb`**

```ruby
class BrandingPolicy < ApplicationPolicy
  def view?
    user.has_role?(:admin)
  end

  def manage?
    user.has_role?(:admin)
  end
end
```

**File: `apps/core/app/policies/provisioning_policy.rb`**

```ruby
class ProvisioningPolicy < ApplicationPolicy
  def manage?
    user.has_role?(:admin) || user.district_admin?
  end
end
```

### 7. Add Routes

Update `apps/core/config/routes.rb` — add within the `namespace :admin` block:

```ruby
namespace :admin do
  # ... existing routes ...
  namespace :provisioning do
    post :create_school
    post :bulk_create
    get "checklist/:tenant_id", action: :checklist
    get :tenants
    post "import/:tenant_id", action: :import
  end
  resource :branding, only: [:show, :update]
end
```

### 8. Add Factory for Tests

**File: `apps/core/spec/factories/backup_records.rb`** (if not created in Task 03):

Already created in Task 03.

Ensure the existing `tenants` factory supports settings:

The existing factory already has `settings { {} }` — this is sufficient.

### 9. Write Tests

**File: `apps/core/spec/services/tenant_provisioning_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe TenantProvisioningService do
  let(:valid_params) do
    {
      school_name: "Riverside Academy",
      subdomain: "riverside",
      admin_email: "admin@riverside.edu",
      admin_first_name: "Jane",
      admin_last_name: "Smith",
      timezone: "America/Chicago",
    }
  end

  after { Current.tenant = nil }

  describe "#call" do
    it "creates a complete tenant setup" do
      result = described_class.new(valid_params).call

      expect(result[:tenant]).to be_persisted
      expect(result[:tenant].slug).to eq("riverside")
      expect(result[:school]).to be_persisted
      expect(result[:admin].email).to eq("admin@riverside.edu")
      expect(result[:admin]).to have_role(:admin)
      expect(result[:academic_year]).to be_persisted
      expect(result[:roles]).to include("admin", "teacher", "student")
      expect(result[:setup_token]).to be_present
    end

    it "creates all 5 default roles" do
      result = described_class.new(valid_params).call
      Current.tenant = result[:tenant]
      expect(Role.pluck(:name).sort).to eq(%w[admin curriculum_lead guardian student teacher])
      Current.tenant = nil
    end

    it "creates permissions for each role" do
      result = described_class.new(valid_params).call
      Current.tenant = result[:tenant]
      expect(Permission.count).to be > 0
      Current.tenant = nil
    end

    it "creates AI task policies" do
      result = described_class.new(valid_params).call
      Current.tenant = result[:tenant]
      expect(AiTaskPolicy.count).to eq(5)
      Current.tenant = nil
    end

    it "applies branding settings" do
      params = valid_params.merge(primary_color: "#ff0000", logo_url: "https://example.com/logo.png")
      result = described_class.new(params).call

      branding = result[:tenant].settings["branding"]
      expect(branding["primary_color"]).to eq("#ff0000")
      expect(branding["logo_url"]).to eq("https://example.com/logo.png")
    end

    it "rolls back on failure" do
      params = valid_params.merge(admin_email: "")  # Invalid email

      expect {
        described_class.new(params).call
      }.to raise_error(ActiveRecord::RecordInvalid)

      expect(Tenant.unscoped.find_by(slug: "riverside")).to be_nil
    end

    it "raises on duplicate subdomain" do
      Tenant.create!(name: "Existing", slug: "riverside", settings: {})

      expect {
        described_class.new(valid_params).call
      }.to raise_error(TenantProvisioningService::ProvisioningError, /already taken/)
    end

    it "raises on missing required fields" do
      expect {
        described_class.new({ school_name: "Test" }).call
      }.to raise_error(TenantProvisioningService::ProvisioningError, /Missing required fields/)
    end
  end
end
```

**File: `apps/core/spec/services/onboarding_checklist_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe OnboardingChecklistService do
  let!(:tenant) { create(:tenant) }

  after { Current.tenant = nil }

  describe "#call" do
    it "returns checklist with completion percentage" do
      result = described_class.new(tenant).call

      expect(result[:tenant_id]).to eq(tenant.id)
      expect(result[:completion_percentage]).to be_a(Integer)
      expect(result[:items]).to be_an(Array)
      expect(result[:items].length).to eq(10)
    end

    it "marks admin_created as true when admin exists" do
      Current.tenant = tenant
      user = create(:user, tenant: tenant)
      user.add_role(:admin)
      Current.tenant = nil

      result = described_class.new(tenant).call
      admin_item = result[:items].find { |i| i[:key] == "admin_created" }
      expect(admin_item[:done]).to be true
    end

    it "calculates correct percentage" do
      # Empty tenant — most items should be false
      result = described_class.new(tenant).call
      expect(result[:completion_percentage]).to be < 100
    end
  end
end
```

**File: `apps/core/spec/services/data_import_service_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe DataImportService do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "users import" do
    let(:csv_content) do
      <<~CSV
        email,first_name,last_name,role
        teacher1@school.edu,Alice,Johnson,teacher
        student1@school.edu,Bob,Smith,student
      CSV
    end

    it "creates users with roles" do
      result = described_class.new(
        tenant,
        import_type: "users",
        csv_content: csv_content,
        imported_by: admin
      ).call

      expect(result[:created]).to eq(2)
      expect(result[:errors]).to be_empty

      Current.tenant = tenant
      alice = User.find_by(email: "teacher1@school.edu")
      expect(alice).to be_present
      expect(alice.has_role?(:teacher)).to be true
      Current.tenant = nil
    end

    it "reports errors for invalid emails" do
      csv = "email,first_name,last_name,role\n,Alice,Johnson,teacher\n"
      result = described_class.new(
        tenant, import_type: "users", csv_content: csv, imported_by: admin
      ).call

      expect(result[:errors].length).to eq(1)
      expect(result[:errors].first[:error]).to include("Invalid")
    end

    it "updates existing users" do
      Current.tenant = tenant
      create(:user, email: "teacher1@school.edu", first_name: "Old", tenant: tenant)
      Current.tenant = nil

      result = described_class.new(
        tenant, import_type: "users", csv_content: csv_content, imported_by: admin
      ).call

      expect(result[:updated]).to eq(1)
      expect(result[:created]).to eq(1)
    end
  end

  describe "invalid import type" do
    it "raises ImportError" do
      expect {
        described_class.new(
          tenant, import_type: "invalid", csv_content: "a,b\n1,2", imported_by: admin
        ).call
      }.to raise_error(DataImportService::ImportError)
    end
  end
end
```

**File: `apps/core/spec/requests/api/v1/admin/provisioning_spec.rb`**

```ruby
require "rails_helper"

RSpec.describe "Api::V1::Admin::Provisioning", type: :request do
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

  after { Current.tenant = nil }

  describe "POST /api/v1/admin/provisioning/create_school" do
    it "creates a new school for admin" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/provisioning/create_school", params: {
        school: {
          school_name: "New Academy",
          subdomain: "new-academy",
          admin_email: "admin@newacademy.edu",
          admin_first_name: "Jane",
          admin_last_name: "Doe",
        }
      }

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["tenant_slug"]).to eq("new-academy")
      expect(body["admin_email"]).to eq("admin@newacademy.edu")
      expect(body["setup_token"]).to be_present
    end

    it "returns 403 for non-admin" do
      mock_session(teacher, tenant: tenant)
      post "/api/v1/admin/provisioning/create_school", params: { school: { school_name: "Test" } }
      expect(response).to have_http_status(:forbidden)
    end

    it "returns 422 for duplicate subdomain" do
      mock_session(admin, tenant: tenant)
      Tenant.create!(name: "Existing", slug: "existing-school", settings: {})

      post "/api/v1/admin/provisioning/create_school", params: {
        school: { school_name: "Test", subdomain: "existing-school", admin_email: "a@b.com" }
      }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/admin/provisioning/checklist/:tenant_id" do
    it "returns onboarding checklist" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/provisioning/checklist/#{tenant.id}"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["items"]).to be_an(Array)
      expect(body["completion_percentage"]).to be_a(Integer)
    end
  end

  describe "GET /api/v1/admin/provisioning/tenants" do
    it "returns all tenants with onboarding status" do
      mock_session(admin, tenant: tenant)
      get "/api/v1/admin/provisioning/tenants"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
    end
  end

  describe "POST /api/v1/admin/provisioning/import/:tenant_id" do
    it "imports users from CSV" do
      mock_session(admin, tenant: tenant)

      post "/api/v1/admin/provisioning/import/#{tenant.id}", params: {
        import_type: "users",
        csv_content: "email,first_name,last_name,role\ntest@school.edu,Test,User,teacher\n"
      }

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["created"]).to eq(1)
    end
  end
end
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/core/app/services/tenant_provisioning_service.rb` | Automated school setup |
| `apps/core/app/services/onboarding_checklist_service.rb` | Setup progress tracking |
| `apps/core/app/services/data_import_service.rb` | CSV data import |
| `apps/core/app/controllers/api/v1/admin/provisioning_controller.rb` | Provisioning API |
| `apps/core/app/controllers/api/v1/admin/branding_controller.rb` | Branding API |
| `apps/core/app/policies/branding_policy.rb` | Admin-only branding access |
| `apps/core/app/policies/provisioning_policy.rb` | Admin/district-admin access |
| All spec files listed above | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `apps/core/config/routes.rb` | Add provisioning, branding routes under admin namespace |

---

## Definition of Done

- [ ] TenantProvisioningService creates tenant, school, 5 roles, permissions, admin user, academic year, AI policies in one transaction
- [ ] Transaction rolls back completely on any failure
- [ ] Duplicate subdomain and email detected before creation
- [ ] Setup token generated for first-time admin access
- [ ] OnboardingChecklistService evaluates 10 items with completion percentage
- [ ] DataImportService handles CSV users, courses, and enrollments
- [ ] DataImportService reports per-row errors without aborting entire import
- [ ] Bulk creation handles mixed success/failure per school
- [ ] Branding API allows get/update of school branding settings
- [ ] All provisioning, checklist, import, and branding tests pass
- [ ] `bundle exec rspec` passes (full suite)
- [ ] `bundle exec rubocop` passes
