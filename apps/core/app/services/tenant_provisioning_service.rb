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
      "resource_links" => %w[read create update delete]
    },
    "student" => {
      "courses" => %w[read],
      "assignments" => %w[read],
      "submissions" => %w[read create],
      "quizzes" => %w[read],
      "discussions" => %w[read create]
    },
    "curriculum_lead" => {
      "unit_plans" => %w[read create update delete publish approve],
      "templates" => %w[read create update delete publish],
      "standards" => %w[read create update],
      "approvals" => %w[read update]
    },
    "guardian" => {
      "submissions" => %w[read]
    }
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
        setup_token: generate_setup_token(@admin)
      }
    ensure
      Current.tenant = nil
    end
  end

  private

  def validate_params!
    required = %i[school_name subdomain admin_email]
    missing = required.select { |key| @params[key].blank? }
    if missing.any?
      raise ProvisioningError, "Missing required fields: #{missing.join(', ')}"
    end

    if Tenant.unscoped.exists?(slug: @params[:subdomain])
      raise ProvisioningError, "Subdomain '#{@params[:subdomain]}' is already taken"
    end

    if User.unscoped.exists?(email: @params[:admin_email])
      raise ProvisioningError, "Email '#{@params[:admin_email]}' is already registered"
    end

    return if @params[:curriculum_default_profile_key].blank?
    return if CurriculumProfileRegistry.keys.include?(@params[:curriculum_default_profile_key])

    raise ProvisioningError, "Unknown curriculum_default_profile_key '#{@params[:curriculum_default_profile_key]}'"
  end

  def create_tenant
    curriculum_default_profile_key = @params[:curriculum_default_profile_key].presence ||
      CurriculumProfileRegistry.default_profile_key

    Tenant.create!(
      name: @params[:school_name],
      slug: @params[:subdomain],
      settings: {
        "curriculum_default_profile_key" => curriculum_default_profile_key,
        "branding" => {
          "logo_url" => @params[:logo_url],
          "primary_color" => @params[:primary_color] || "#1e40af",
          "school_name" => @params[:school_name]
        },
        "features" => {
          "ai_enabled" => @params.fetch(:ai_enabled, true),
          "google_integration" => @params.fetch(:google_enabled, true),
          "portfolio_enabled" => true,
          "guardian_portal_enabled" => true
        },
        "ai_safety_level" => @params[:safety_level] || "strict"
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
    DEFAULT_ROLES.each_with_object({}) do |role_name, created_roles|
      created_roles[role_name] = Role.create!(tenant: @tenant, name: role_name)
    end
  end

  def create_permissions
    Current.tenant = @tenant
    DEFAULT_PERMISSIONS.each do |role_name, resources|
      role = @roles[role_name]
      next unless role

      resources.each do |resource, actions|
        resources_to_grant = if resource == "all"
          Permission::VALID_RESOURCES
        else
          [ resource ]
        end

        resources_to_grant.each do |resolved_resource|
          next unless Permission::VALID_RESOURCES.include?(resolved_resource)

          actions.each do |action|
            next unless Permission::VALID_ACTIONS.include?(action)

            Permission.create!(
              tenant: @tenant,
              role: role,
              resource: resolved_resource,
              action: action,
              granted: true
            )
          end
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
    start_month = (@params[:academic_year_start_month] || 8).to_i
    start_date = Date.new(current_year, start_month, 1)
    start_date -= 1.year if Date.current.month < start_month

    AcademicYear.create!(
      tenant: @tenant,
      name: "#{start_date.year}-#{start_date.year + 1}",
      start_date: start_date,
      end_date: start_date + 1.year - 1.day
    )
  end

  def create_default_ai_policies
    Current.tenant = @tenant
    provider = create_default_ai_provider_config

    %w[lesson_plan unit_plan differentiation assessment rewrite].each do |task_type|
      AiTaskPolicy.create!(
        tenant: @tenant,
        ai_provider_config: provider,
        created_by: @admin,
        task_type: task_type,
        enabled: true,
        requires_approval: true
      )
    end
  end

  def create_default_ai_provider_config
    provider_name = @params[:default_ai_provider].presence || "anthropic"
    default_model = if provider_name == "openai"
      "gpt-4.1-mini"
    else
      "claude-sonnet-4-5-20250929"
    end

    display_name = if provider_name == "openai"
      "OpenAI"
    else
      "Claude"
    end

    AiProviderConfig.create!(
      tenant: @tenant,
      created_by: @admin,
      provider_name: provider_name,
      display_name: display_name,
      default_model: default_model,
      available_models: [ default_model ],
      status: "active",
      settings: {}
    )
  end

  def create_default_standard_frameworks
    Current.tenant = @tenant
    [ "Common Core", "NGSS", "C3 Framework" ].each do |framework_name|
      StandardFramework.find_or_create_by!(tenant: @tenant, name: framework_name) do |framework|
        framework.jurisdiction = "US"
      end
    end
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.warn("[TenantProvisioningService] Could not seed standard frameworks: #{e.message}")
  end

  def generate_setup_token(user)
    payload = {
      user_id: user.id,
      tenant_id: @tenant.id,
      exp: 48.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base, "HS256")
  end
end
