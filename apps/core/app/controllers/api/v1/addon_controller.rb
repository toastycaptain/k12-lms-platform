require "base64"
require "digest"

module Api
  module V1
    class AddonController < ApplicationController
      skip_before_action :authenticate_user!
      before_action :authenticate_addon!

      def unit_plans
        authorize :addon, :unit_plans?
        plans = policy_scope(UnitPlan).order(updated_at: :desc).limit(50)
        render json: plans.map { |p| { id: p.id, title: p.title, status: p.status, updated_at: p.updated_at } }
      end

      def lessons
        authorize :addon, :lessons?
        unit_plan = policy_scope(UnitPlan).find(params[:id])
        lessons = unit_plan.lesson_plans.order(:position)
        render json: lessons.map { |l| { id: l.id, title: l.title, position: l.position } }
      end

      def unit_plan_standards
        authorize :addon, :standards?
        unit_plan = policy_scope(UnitPlan).find(params[:id])
        standards = unit_plan.current_version&.standards&.includes(:standard_framework) || []

        render json: standards.map { |standard|
          {
            id: standard.id,
            code: standard.code,
            description: standard.description,
            framework_id: standard.standard_framework_id,
            framework_name: standard.standard_framework.name
          }
        }
      end

      def attach
        authorize :addon, :attach?
        linkable_class = linkable_class_for(params[:linkable_type])
        unless linkable_class
          render json: { error: "Invalid linkable_type" }, status: :unprocessable_entity
          return
        end

        linkable = linkable_class.find(params[:linkable_id])
        if linkable.respond_to?(:tenant_id) && linkable.tenant_id != Current.tenant.id
          render json: { error: "Forbidden" }, status: :forbidden
          return
        end

        resource_link = ResourceLink.create!(
          tenant: Current.tenant,
          linkable: linkable,
          url: params[:drive_file_url],
          title: params[:drive_file_title],
          provider: "google_drive",
          drive_file_id: params[:drive_file_id],
          mime_type: params[:drive_mime_type],
          metadata: resource_link_metadata_for(linkable)
        )
        render json: resource_link, status: :created
      end

      def standards
        authorize :addon, :standards?
        standards = policy_scope(Standard).joins(:standard_framework)
        standards = standards.where(standard_framework_id: params[:framework_id]) if params[:framework_id].present?
        standards = standards.order("standard_frameworks.name ASC, standards.code ASC").limit(100)

        render json: standards.map { |standard|
          {
            id: standard.id,
            code: standard.code,
            description: standard.description,
            framework_id: standard.standard_framework_id,
            framework_name: standard.standard_framework.name
          }
        }
      end

      def templates
        authorize :addon, :templates?
        templates = policy_scope(Template).where(status: "published").order(updated_at: :desc).limit(50)
        render json: templates.map { |template|
          {
            id: template.id,
            name: template.name,
            subject: template.subject,
            grade_level: template.grade_level
          }
        }
      end

      def ai_generate
        authorize :addon, :ai_generate?

        task_type = params[:task_type].to_s
        prompt = params[:prompt].to_s
        context = normalized_context

        if task_type.blank? || prompt.blank?
          render json: { error: "task_type and prompt are required" }, status: :unprocessable_entity
          return
        end

        task_policy = AiTaskPolicy.find_by(tenant: Current.tenant, task_type: task_type, enabled: true)
        unless task_policy
          render json: { error: "No enabled AI task policy for task_type" }, status: :forbidden
          return
        end

        unless task_allowed_for_user?(task_policy)
          render json: { error: "Forbidden" }, status: :forbidden
          return
        end

        provider_config = task_policy.ai_provider_config
        model_name = task_policy.effective_model
        invocation = AiInvocation.create!(
          tenant: Current.tenant,
          ai_provider_config: provider_config,
          ai_task_policy: task_policy,
          user: Current.user,
          provider_name: provider_config.provider_name,
          model: model_name,
          task_type: task_type,
          context: context,
          input_hash: Digest::SHA256.hexdigest(prompt),
          started_at: Time.current,
          status: "pending"
        )

        result = AiGatewayClient.generate(
          provider: provider_config.provider_name,
          model: model_name,
          messages: [ { role: "user", content: prompt } ],
          task_type: task_type,
          max_tokens: task_policy.max_tokens_limit || 4096,
          temperature: task_policy.temperature_limit || 0.7
        )
        usage = result["usage"].is_a?(Hash) ? result["usage"] : {}
        invocation.complete!(
          tokens: {
            prompt: usage["prompt_tokens"],
            completion: usage["completion_tokens"],
            total: usage["total_tokens"]
          },
          duration: duration_ms(invocation.started_at)
        )
        render json: result, status: :ok
      rescue AiGatewayClient::AiGatewayError => e
        invocation&.fail!(e.message)
        render json: { error: "AI gateway error", detail: e.message }, status: (e.status_code || 502)
      rescue => e
        invocation&.fail!(e.message)
        render json: { error: "AI gateway request failed", detail: e.message }, status: :bad_gateway
      end

      def me
        authorize :addon, :me?
        render json: {
          id: Current.user.id,
          name: "#{Current.user.first_name} #{Current.user.last_name}",
          email: Current.user.email,
          tenant_name: Current.tenant.name
        }
      end

      private

      def authenticate_addon!
        token = bearer_token
        return unauthorized unless token

        integration_config = resolve_addon_integration_config(token)
        return unauthorized unless integration_config

        Current.tenant = integration_config.tenant
        Current.user = resolve_addon_user(token, integration_config)
        unauthorized unless Current.user
      rescue JSON::ParserError, ArgumentError
        unauthorized
      end

      def unauthorized
        render json: { error: "Unauthorized" }, status: :unauthorized
      end

      def bearer_token
        header = request.headers["Authorization"].to_s
        return nil unless header.start_with?("Bearer ")

        header.delete_prefix("Bearer ").strip.presence
      end

      def resolve_addon_integration_config(token)
        IntegrationConfig.unscoped
          .includes(:tenant, :created_by)
          .where(provider: "google_workspace", status: "active")
          .find do |config|
          settings = config.settings.is_a?(Hash) ? config.settings : {}
          secure_token_match?(settings["addon_token"], token) || secure_token_match?(settings["service_token"], token)
        end
      end

      def secure_token_match?(expected, provided)
        return false if expected.blank? || provided.blank?
        return false unless expected.bytesize == provided.bytesize

        ActiveSupport::SecurityUtils.secure_compare(expected, provided)
      end

      def resolve_addon_user(token, integration_config)
        payload_user_id = decoded_token_payload(token)&.dig("user_id")
        payload_user = User.unscoped.find_by(id: payload_user_id, tenant_id: integration_config.tenant_id) if payload_user_id.present?
        return payload_user if payload_user

        settings = integration_config.settings.is_a?(Hash) ? integration_config.settings : {}
        service_user_id = settings["service_user_id"] || settings["addon_user_id"]
        service_user = User.unscoped.find_by(id: service_user_id, tenant_id: integration_config.tenant_id) if service_user_id.present?
        return service_user if service_user

        integration_config.created_by if integration_config.created_by&.tenant_id == integration_config.tenant_id
      end

      def decoded_token_payload(token)
        segments = token.split(".")
        return nil unless segments.length == 3

        payload = segments[1]
        padded = payload + ("=" * ((4 - payload.length % 4) % 4))
        JSON.parse(Base64.urlsafe_decode64(padded))
      end

      def linkable_class_for(linkable_type)
        {
          "LessonPlan" => LessonPlan,
          "LessonVersion" => LessonVersion,
          "UnitVersion" => UnitVersion,
          "CourseModule" => CourseModule,
          "Assignment" => Assignment
        }[linkable_type.to_s]
      end

      def resource_link_metadata_for(linkable)
        context = curriculum_context_for_linkable(linkable)
        return {} if context.blank?

        {
          "effective_curriculum_profile_key" => context[:profile_key],
          "effective_curriculum_source" => context[:source],
          "integration_context_tag" => context.dig(:integration_hints, "google_addon_context")
        }
      end

      def curriculum_context_for_linkable(linkable)
        course = course_for_linkable(linkable)
        return nil unless course

        CurriculumProfileResolver.resolve(
          tenant: Current.tenant,
          school: course.school,
          course: course
        )
      end

      def course_for_linkable(linkable)
        case linkable
        when Assignment, CourseModule
          linkable.course
        when LessonPlan
          linkable.unit_plan&.course
        when LessonVersion
          linkable.lesson_plan&.unit_plan&.course
        when UnitVersion
          linkable.unit_plan&.course
        else
          nil
        end
      end

      def normalized_context
        return {} if params[:context].nil?

        params.permit(context: [ :document_id, :document_title, :document_type, :selection_text ]).to_h[:context] || {}
      end

      def task_allowed_for_user?(task_policy)
        allowed_roles = Array(task_policy.allowed_roles).map(&:to_s)
        return true if allowed_roles.empty?

        allowed_roles.any? { |role| Current.user.has_role?(role) }
      end

      def duration_ms(started_at)
        return nil if started_at.blank?

        ((Time.current - started_at) * 1000).to_i
      end
    end
  end
end
