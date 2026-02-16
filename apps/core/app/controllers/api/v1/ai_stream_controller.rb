module Api
  module V1
    class AiStreamController < ApplicationController
      include ActionController::Live

      def create
        authorize AiInvocation

        task_type = params[:task_type]
        task_policy = AiTaskPolicy.find_by(tenant: Current.tenant, task_type: task_type)

        unless task_policy&.enabled
          render json: { error: "AI task type '#{task_type}' is not enabled" }, status: :forbidden
          return
        end

        unless task_policy.allowed_roles.blank? || (task_policy.allowed_roles & current_user_roles).any?
          render json: { error: "Your role is not authorized for this task type" }, status: :forbidden
          return
        end

        provider_config = resolve_provider(task_policy)
        model = task_policy.model_override.presence || provider_config.default_model
        template = resolve_template
        max_tokens = task_policy.max_tokens_limit || 4096
        temperature = task_policy.temperature_limit || 0.7
        messages = build_messages(template)

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
          context: {
            messages: messages,
            max_tokens: max_tokens,
            temperature: temperature,
            return_url: params[:return_url]
          }
        )

        response.headers["Content-Type"] = "text/event-stream"
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Accel-Buffering"] = "no"

        chunk_count = 0
        start_time = Process.clock_gettime(Process::CLOCK_MONOTONIC)

        begin
          full_text = AiGatewayClient.generate_stream(
            provider: provider_config.provider_name,
            model: model,
            messages: messages,
            task_type: task_type,
            max_tokens: max_tokens,
            temperature: temperature
          ) do |token, _parsed|
            chunk_count += 1
            response.stream.write("data: #{({ token: token, invocation_id: invocation.id }).to_json}\n\n")
          end

          duration = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - start_time) * 1000).round
          invocation.complete!(
            tokens: {
              completion_chunks: chunk_count,
              total_chunks: chunk_count
            },
            duration: duration,
            response_hash: { content: full_text }
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

      def resolve_provider(task_policy)
        if task_policy.ai_provider_config_id.present?
          AiProviderConfig.find(task_policy.ai_provider_config_id)
        else
          AiProviderConfig.find_by!(tenant: Current.tenant, status: "active")
        end
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
