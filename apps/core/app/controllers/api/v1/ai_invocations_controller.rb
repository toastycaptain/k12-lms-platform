require "digest"

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
        authorize AiInvocation
        task_type = params[:task_type].to_s
        task_policy = resolve_task_policy(task_type)
        return unless task_policy
        return unless ensure_task_policy_access(task_policy)

        provider_config = active_provider_config
        unless provider_config
          render json: { error: "No AI provider configured" }, status: :service_unavailable
          return
        end

        model = resolved_model(task_policy, provider_config)
        template = AiTemplate.find_by!(id: params[:ai_template_id], tenant: Current.tenant) if params[:ai_template_id].present?
        system_prompt = template&.system_prompt || "You are a helpful K-12 education assistant."
        messages = build_messages(system_prompt)
        max_tokens = resolved_max_tokens(task_policy)
        temperature = resolved_temperature(task_policy)
        context_payload = invocation_context(messages: messages, max_tokens: max_tokens, temperature: temperature)

        invocation = AiInvocation.new(
          tenant: Current.tenant,
          user: Current.user,
          ai_provider_config: provider_config,
          ai_task_policy: task_policy,
          ai_template: template,
          task_type: task_type,
          provider_name: provider_config.provider_name,
          model: model,
          status: "pending",
          context: context_payload,
          input_hash: Digest::SHA256.hexdigest(messages.to_json)
        )
        invocation.save!

        if async_requested?
          AiGenerationJob.perform_later(invocation.id)
          render json: {
            invocation_id: invocation.id,
            status: invocation.status,
            message: "Generation queued. Poll GET /api/v1/ai_invocations/#{invocation.id} for status."
          }, status: :accepted
          return
        end

        begin
          invocation.update!(status: "running", started_at: Time.current)
          start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

          result = AiGatewayClient.generate(
            provider: provider_config.provider_name,
            model: model,
            messages: messages,
            task_type: task_type,
            max_tokens: max_tokens,
            temperature: temperature,
            context: context_payload
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
        rescue AiGatewayClient::AiGatewayError => e
          invocation.fail!(e.message)
          render json: { error: "AI generation failed: #{e.message}" }, status: :bad_gateway
        rescue StandardError => e
          invocation.fail!(e.message)
          render json: { error: "AI generation failed: #{e.message}" }, status: :bad_gateway
        end
      end

      private

      def async_requested?
        ActiveModel::Type::Boolean.new.cast(params[:async])
      end

      def build_messages(system_prompt)
        messages = [ { role: "system", content: system_prompt } ]

        if params[:messages].is_a?(Array)
          user_messages = params[:messages].filter_map do |message|
            role, content = extract_message_fields(message)
            next if role.blank? || content.blank?

            { role: role, content: content }
          end
          messages.concat(user_messages)
        elsif params[:prompt].present?
          messages << { role: "user", content: params[:prompt] }
        end

        messages
      end

      def invocation_context(messages:, max_tokens:, temperature:)
        base = normalize_context.deep_stringify_keys
        base["messages"] = messages
        base["max_tokens"] = max_tokens
        base["temperature"] = temperature
        base["return_url"] = params[:return_url] if params[:return_url].present?
        base
      end

      def extract_message_fields(message)
        permitted = if message.respond_to?(:permit)
          message.permit(:role, :content).to_h
        elsif message.respond_to?(:to_h)
          message.to_h
        else
          {}
        end

        role = permitted["role"] || permitted[:role]
        content = permitted["content"] || permitted[:content]
        [ role, content ]
      end

      def normalize_context
        context = params[:context]
        return {} if context.nil?
        return context.to_unsafe_h if context.respond_to?(:to_unsafe_h)
        return context.to_h if context.respond_to?(:to_h)

        {}
      end

      def resolve_task_policy(task_type)
        task_policy = AiTaskPolicy.find_by(tenant: Current.tenant, task_type: task_type, enabled: true)
        return task_policy if task_policy

        render json: { error: "AI task type not enabled" }, status: :forbidden
        nil
      end

      def ensure_task_policy_access(task_policy)
        unless role_allowed_for_policy?(task_policy)
          render json: { error: "Your role is not authorized for this AI task type" }, status: :forbidden
          return false
        end

        if task_policy.requires_approval?
          render json: { error: "This AI action requires approval" }, status: :forbidden
          return false
        end

        true
      end

      def role_allowed_for_policy?(task_policy)
        return true if task_policy.allowed_roles.blank?

        (task_policy.allowed_roles & current_user_roles).any?
      end

      def current_user_roles
        Current.user.roles.pluck(:name)
      end

      def active_provider_config
        AiProviderConfig.find_by(tenant: Current.tenant, status: "active")
      end

      def resolved_model(task_policy, provider_config)
        task_policy.model_override.presence || provider_config.default_model
      end

      def resolved_max_tokens(task_policy)
        requested_max_tokens = integer_param(params[:max_tokens], default: 4096)
        return requested_max_tokens unless task_policy.max_tokens_limit

        [ requested_max_tokens, task_policy.max_tokens_limit ].min
      end

      def resolved_temperature(task_policy)
        requested_temperature = float_param(params[:temperature], default: 0.7)
        return requested_temperature unless task_policy.temperature_limit

        [ requested_temperature, task_policy.temperature_limit ].min
      end

      def integer_param(value, default:)
        Integer(value)
      rescue ArgumentError, TypeError
        default
      end

      def float_param(value, default:)
        Float(value)
      rescue ArgumentError, TypeError
        default
      end
    end
  end
end
