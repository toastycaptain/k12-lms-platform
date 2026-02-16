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
        task_policy = AiTaskPolicy.find_by!(tenant: Current.tenant, task_type: params[:task_type])

        unless task_policy.enabled
          render json: { error: "AI task type '#{params[:task_type]}' is currently disabled" }, status: :forbidden
          return
        end

        user_roles = Current.user.roles.pluck(:name)
        unless user_roles.any? { |role_name| task_policy.allowed_for_role?(role_name) }
          render json: { error: "Your role is not authorized for this AI task type" }, status: :forbidden
          return
        end

        provider_config = task_policy.ai_provider_config
        model = task_policy.effective_model

        template = AiTemplate.find_by!(id: params[:ai_template_id], tenant: Current.tenant) if params[:ai_template_id].present?
        system_prompt = template&.system_prompt || "You are a helpful K-12 education assistant."
        messages = build_messages(system_prompt)
        max_tokens = task_policy.max_tokens_limit || 4096
        temperature = task_policy.temperature_limit || 0.7

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
          context: invocation_context(messages: messages, max_tokens: max_tokens, temperature: temperature)
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
            task_type: params[:task_type],
            max_tokens: max_tokens,
            temperature: temperature
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
    end
  end
end
