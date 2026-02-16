require "digest"

module Api
  module V1
    class AiStreamController < ApplicationController
      include ActionController::Live

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
        template = resolve_template
        max_tokens = resolved_max_tokens(task_policy)
        temperature = resolved_temperature(task_policy)
        messages = build_messages(template)
        invocation_context = {
          messages: messages,
          max_tokens: max_tokens,
          temperature: temperature,
          return_url: params[:return_url]
        }

        invocation = AiInvocation.create!(
          tenant: Current.tenant,
          user: Current.user,
          ai_provider_config: provider_config,
          ai_task_policy: task_policy,
          ai_template: template,
          task_type: task_type,
          provider_name: provider_config.provider_name,
          model: model,
          status: "running",
          started_at: Time.current,
          context: invocation_context,
          input_hash: Digest::SHA256.hexdigest(messages.to_json)
        )

        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"

        stream_usage = {}
        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

        begin
          full_text = AiGatewayClient.generate_stream(
            provider: provider_config.provider_name,
            model: model,
            messages: messages,
            task_type: task_type,
            max_tokens: max_tokens,
            temperature: temperature,
            context: invocation_context
          ) do |token, parsed|
            if token.present?
              response.stream.write("data: #{({ token: token, invocation_id: invocation.id }).to_json}\n\n")
            end

            usage = parsed.is_a?(Hash) ? parsed["usage"] : nil
            stream_usage = usage if usage.is_a?(Hash)
          end

          duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round
          invocation.complete!(
            tokens: stream_tokens(messages: messages, full_text: full_text, usage: stream_usage),
            duration: duration,
            response_hash: { content: full_text, usage: stream_usage.presence }
          )

          response.stream.write("data: #{({ done: true, invocation_id: invocation.id, content: full_text }).to_json}\n\n")
        rescue AiGatewayClient::AiGatewayError => e
          invocation.fail!(e.message)
          response.stream.write("data: #{({ error: e.message }).to_json}\n\n")
        rescue StandardError => e
          invocation.fail!(e.message)
          response.stream.write("data: #{({ error: "Stream failed" }).to_json}\n\n")
        ensure
          response.stream.close
        end
      rescue IOError
        # Client disconnected; nothing to do.
      end

      private

      def current_user_roles
        Current.user.roles.pluck(:name)
      end

      def resolve_task_policy(task_type)
        task_policy = AiTaskPolicy.find_by(tenant: Current.tenant, task_type: task_type, enabled: true)
        return task_policy if task_policy

        render json: { error: "AI task type not enabled" }, status: :forbidden
        nil
      end

      def ensure_task_policy_access(task_policy)
        unless task_policy.allowed_roles.blank? || (task_policy.allowed_roles & current_user_roles).any?
          render json: { error: "Your role is not authorized for this AI task type" }, status: :forbidden
          return false
        end

        if task_policy.requires_approval?
          render json: { error: "This AI action requires approval" }, status: :forbidden
          return false
        end

        true
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

      def stream_tokens(messages:, full_text:, usage:)
        if usage.present?
          return {
            prompt: usage["prompt_tokens"],
            completion: usage["completion_tokens"],
            total: usage["total_tokens"]
          }
        end

        prompt_tokens = estimate_tokens(messages.map { |message| message[:content].to_s }.join(" "))
        completion_tokens = estimate_tokens(full_text)
        {
          prompt: prompt_tokens,
          completion: completion_tokens,
          total: prompt_tokens + completion_tokens
        }
      end

      def estimate_tokens(text)
        return 0 if text.blank?

        (text.length / 4.0).ceil
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

      def resolve_template
        return nil unless params[:ai_template_id].present?

        AiTemplate.find_by(id: params[:ai_template_id], tenant: Current.tenant)
      end

      def build_messages(template)
        messages = []

        system_prompt = template&.system_prompt.presence || "You are a helpful K-12 education assistant."
        messages << { role: "system", content: system_prompt }

        if params[:messages].is_a?(Array)
          messages += params[:messages].filter_map do |message|
            permitted = if message.respond_to?(:permit)
              message.permit(:role, :content).to_h
            elsif message.respond_to?(:to_h)
              message.to_h
            end

            next if permitted.blank?
            role = permitted["role"] || permitted[:role]
            content = permitted["content"] || permitted[:content]
            next if role.blank? || content.blank?

            { role: role, content: content }
          end
        elsif params[:prompt].present?
          messages << { role: "user", content: params[:prompt] }
        end

        messages
      end
    end
  end
end
