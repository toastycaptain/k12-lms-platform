require "digest"

module Api
  module V1
    class AiInvocationsController < ApplicationController
      before_action :set_invocation, only: [ :show, :update ]

      def index
        invocations = policy_scope(AiInvocation).order(created_at: :desc)
        invocations = invocations.where(task_type: params[:task_type]) if params[:task_type].present?
        invocations = invocations.where(status: params[:status]) if params[:status].present?
        invocations = paginate(invocations)
        render json: invocations
      end

      def show
        authorize @invocation
        render json: @invocation
      end

      def update
        authorize @invocation

        context = (@invocation.context || {}).deep_dup
        context["apply"] ||= {}

        if apply_params[:applied_at].present?
          context["apply"]["applied_at"] = normalized_time(apply_params[:applied_at]).iso8601
        end

        if apply_params[:applied_to].present?
          context["apply"]["applied_to"] = normalize_applied_to(apply_params[:applied_to])
        end

        review_payload = normalized_review_payload
        if review_payload.present?
          context["review"] ||= {}
          context["review"].merge!(review_payload)
          MetricsService.increment(
            "ib.ai.reviewed",
            tags: {
              task_type: @invocation.task_type,
              workflow: context["workflow"].to_s,
              status: review_payload["status"].to_s
            }
          ) if ib_ai_task?(@invocation.task_type)
        end

        @invocation.update!(context: context)
        log_review_event(review_payload) if review_payload.present?
        render json: @invocation
      rescue ActiveRecord::RecordInvalid
        render json: { errors: @invocation.errors.full_messages }, status: :unprocessable_content
      end

      def create
        authorize AiInvocation
        request_started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        task_type = params[:task_type].to_s
        task_policy = resolve_task_policy(task_type)
        return unless task_policy
        return unless ensure_task_policy_access(task_policy)

        provider_config = active_provider_config
        unless provider_config
          MetricsService.increment("ai.invocation.failed", tags: { task_type: task_type, reason: "provider_missing" })
          render json: { error: "No AI provider configured" }, status: :service_unavailable
          return
        end

        model = resolved_model(task_policy, provider_config)
        metric_tags = {
          task_type: task_type,
          provider: provider_config.provider_name,
          model: model
        }
        MetricsService.increment("ai.invocation.requested", tags: metric_tags)
        template = AiTemplate.find_by!(id: params[:ai_template_id], tenant: Current.tenant) if params[:ai_template_id].present?
        max_tokens = resolved_max_tokens(task_policy)
        temperature = resolved_temperature(task_policy)
        messages, context_payload, task_definition = build_invocation_payload(
          task_type: task_type,
          template: template,
          max_tokens: max_tokens,
          temperature: temperature
        )
        return if performed?

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
          MetricsService.increment("ai.invocation.queued", tags: metric_tags)
          MetricsService.timing(
            "ai.invocation.controller_duration_ms",
            elapsed_ms(request_started_at),
            tags: metric_tags.merge(mode: "async")
          )
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
            duration: duration,
            response_hash: result
          )
          MetricsService.increment("ib.ai.completed", tags: metric_tags.merge(workflow: context_payload["workflow"].to_s)) if ib_ai_task?(task_type)
          MetricsService.increment("ai.invocation.completed", tags: metric_tags)
          MetricsService.timing("ai.invocation.duration_ms", duration, tags: metric_tags)
          MetricsService.timing(
            "ai.invocation.controller_duration_ms",
            elapsed_ms(request_started_at),
            tags: metric_tags.merge(mode: "sync")
          )
          MetricsService.gauge("ai.invocation.prompt_tokens", usage["prompt_tokens"] || 0, tags: metric_tags)
          MetricsService.gauge("ai.invocation.completion_tokens", usage["completion_tokens"] || 0, tags: metric_tags)
          MetricsService.gauge("ai.invocation.total_tokens", usage["total_tokens"] || 0, tags: metric_tags)

          render json: {
            id: invocation.id,
            content: result["content"],
            provider: result["provider"],
            model: result["model"],
            usage: usage,
            status: invocation.status,
            review_required: context_payload["review_required"],
            task_definition: task_definition,
            grounding_refs: context_payload["grounding_refs"],
            human_only_boundaries: context_payload["human_only_boundaries"],
            tenant_controls: context_payload["tenant_controls"],
            quality_track: context_payload["quality_track"]
          }
          log_generation_event(invocation, task_definition: task_definition, context_payload: context_payload)
        rescue AiGatewayClient::AiGatewayError => e
          MetricsService.increment("ai.invocation.failed", tags: metric_tags.merge(error: e.class.name))
          MetricsService.timing(
            "ai.invocation.controller_duration_ms",
            elapsed_ms(request_started_at),
            tags: metric_tags.merge(mode: "sync", outcome: "failed")
          )
          invocation.fail!(e.message)
          render json: { error: "AI generation failed: #{e.message}" }, status: :bad_gateway
        rescue StandardError => e
          MetricsService.increment("ai.invocation.failed", tags: metric_tags.merge(error: e.class.name))
          MetricsService.timing(
            "ai.invocation.controller_duration_ms",
            elapsed_ms(request_started_at),
            tags: metric_tags.merge(mode: "sync", outcome: "failed")
          )
          invocation.fail!(e.message)
          render json: { error: "AI generation failed: #{e.message}" }, status: :bad_gateway
        end
      end

      private

      def set_invocation
        @invocation = AiInvocation.find(params[:id])
      end

      def apply_params
        params.permit(:applied_at, applied_to: [ :type, :id ], review: [ :status, :teacher_trust, :notes, :workflow, :estimated_minutes_saved, { accepted_fields: [], rejected_fields: [] } ])
      end

      def normalized_time(raw_value)
        Time.zone.parse(raw_value.to_s) || Time.current
      rescue ArgumentError, TypeError
        Time.current
      end

      def normalize_applied_to(raw_payload)
        payload = raw_payload.respond_to?(:to_h) ? raw_payload.to_h : {}
        raw_id = payload[:id] || payload["id"]
        {
          "type" => payload[:type] || payload["type"],
          "id" => normalize_applied_to_id(raw_id)
        }.compact
      end

      def normalize_applied_to_id(value)
        return value unless value.respond_to?(:to_s)

        string_value = value.to_s
        return string_value.to_i if /\A\d+\z/.match?(string_value)

        value
      end

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
        normalize_context_for(task_type: params[:task_type].to_s)
      end

      def resolve_task_policy(task_type)
        task_policy = AiTaskPolicy.find_by(tenant: Current.tenant, task_type: task_type, enabled: true)
        return task_policy if task_policy

        render json: { error: "AI task type not enabled" }, status: :forbidden
        nil
      end

      def ensure_task_policy_access(task_policy)
        if approval_required_for_policy?(task_policy)
          render json: { error: "This AI action requires approval" }, status: :forbidden
          return false
        end

        unless role_allowed_for_policy?(task_policy)
          render json: { error: "Your role is not authorized for this AI task type" }, status: :forbidden
          return false
        end

        true
      end

      def approval_required_for_policy?(task_policy)
        task_policy.requires_approval? && !ib_ai_task?(task_policy.task_type)
      end

      def role_allowed_for_policy?(task_policy)
        allowed_roles = Array(task_policy.allowed_roles).presence
        if allowed_roles.blank? && ib_ai_task?(task_policy.task_type)
          allowed_roles = Array(::Ib::Ai::TaskCatalog.definition_for(task_policy.task_type)&.dig(:default_roles))
        end
        return true if allowed_roles.blank?

        (allowed_roles & current_user_roles).any?
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

      def elapsed_ms(started_at)
        ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(1)
      end

      def build_invocation_payload(task_type:, template:, max_tokens:, temperature:)
        if ib_ai_task?(task_type)
          prepared = ::Ib::Ai::Orchestrator.new(user: Current.user).prepare(
            task_type: task_type,
            prompt: params[:prompt],
            context: normalize_context_for(task_type: task_type),
            template: template
          )
          context_payload = prepared[:context].deep_stringify_keys
          context_payload["messages"] = prepared[:messages]
          context_payload["max_tokens"] = max_tokens
          context_payload["temperature"] = temperature
          context_payload["return_url"] = params[:return_url] if params[:return_url].present?
          context_payload["school_id"] ||= Current.school&.id
          return [ prepared[:messages], context_payload, prepared[:definition] ]
        end

        system_prompt = template&.system_prompt || "You are a helpful K-12 education assistant."
        messages = build_messages(system_prompt)
        [ messages, invocation_context(messages: messages, max_tokens: max_tokens, temperature: temperature), nil ]
      rescue ::Ib::Ai::GuardrailService::GuardrailViolation => e
        render json: { error: e.message }, status: :unprocessable_content
        [ [], {}, nil ]
      end

      def normalize_context_for(task_type:)
        return {} if params[:context].nil?

        return raw_context_payload if ib_ai_task?(task_type)

        params.permit(context: [ :document_id, :document_title, :document_type, :selection_text, :source, :return_url ]).to_h[:context] || {}
      end

      def raw_context_payload
        value = params[:context]
        return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
        return value.to_h if value.respond_to?(:to_h)

        {}
      end

      def ib_ai_task?(task_type)
        ::Ib::Ai::TaskCatalog.ib_task?(task_type)
      end

      def normalized_review_payload
        raw = apply_params[:review]
        payload = raw.respond_to?(:to_h) ? raw.to_h : {}
        return {} if payload.blank?

        review = {
          "status" => payload[:status] || payload["status"],
          "notes" => payload[:notes] || payload["notes"],
          "workflow" => payload[:workflow] || payload["workflow"],
          "accepted_fields" => Array(payload[:accepted_fields] || payload["accepted_fields"]).map(&:to_s),
          "rejected_fields" => Array(payload[:rejected_fields] || payload["rejected_fields"]).map(&:to_s),
          "reviewed_at" => Time.current.utc.iso8601
        }.compact
        trust = payload[:teacher_trust] || payload["teacher_trust"]
        review["teacher_trust"] = trust.to_f if trust.present?
        minutes_saved = payload[:estimated_minutes_saved] || payload["estimated_minutes_saved"]
        review["estimated_minutes_saved"] = minutes_saved.to_i if minutes_saved.present?
        review
      end

      def log_generation_event(invocation, task_definition:, context_payload:)
        return unless ib_ai_task?(invocation.task_type)

        AuditLogger.log(
          event_type: "ib_ai_invocation_generated",
          actor: Current.user,
          auditable: invocation,
          request: request,
          metadata: {
            task_type: invocation.task_type,
            workflow: context_payload["workflow"],
            task_label: task_definition&.dig(:label),
            review_required: context_payload["review_required"],
            grounding_ref_count: Array(context_payload["grounding_refs"]).length
          }
        )
      end

      def log_review_event(review_payload)
        return unless ib_ai_task?(@invocation.task_type)

        AuditLogger.log(
          event_type: "ib_ai_invocation_reviewed",
          actor: Current.user,
          auditable: @invocation,
          request: request,
          metadata: review_payload.merge("task_type" => @invocation.task_type)
        )
      end
    end
  end
end
